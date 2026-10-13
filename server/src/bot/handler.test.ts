import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreateOrderInput, OrderRecord } from '../types/order'
import { FALLBACK_SERVICES } from './catalog'
import { createBotHandler } from './handler'
import { createMemorySessionStore } from './sessions'
import type { TgUpdate } from './types'

const user = { id: 42, first_name: 'Ivan', username: 'ivan_wm' }
const chat = { id: 42, type: 'private' as const }
const ADMIN_CHAT = '-100500'

function fakeOrder(input: CreateOrderInput): OrderRecord {
  return {
    id: 'uuid-1',
    public_id: 'ICL-TEST-0001',
    created_at: '2026-10-13T10:00:00Z',
    updated_at: '2026-10-13T10:00:00Z',
    user_id: null,
    client_telegram: input.clientTelegram,
    service_id: input.serviceId ?? null,
    service_title: input.serviceTitle,
    platform: input.platform ?? null,
    quantity_label: input.quantityLabel ?? null,
    price: input.price ?? null,
    price_label: input.priceLabel ?? null,
    description: input.description,
    references_text: input.referencesText ?? '',
    links: input.links ?? [],
    files: [],
    meta: input.meta ?? {},
    status: 'new',
    telegram_sent: false,
    telegram_error: null,
  }
}

function setup() {
  const calls: { method: string; params: Record<string, unknown> }[] = []
  const api = {
    call: vi.fn(async (method: string, params: Record<string, unknown> = {}) => {
      calls.push({ method, params })
      return {} as never
    }),
  }
  const createOrder = vi.fn(async (input: CreateOrderInput) => fakeOrder(input))
  const afterOrderCreated = vi.fn(async () => undefined)
  const handle = createBotHandler({
    api,
    sessions: createMemorySessionStore(),
    loadCatalog: async () => FALLBACK_SERVICES,
    createOrder,
    afterOrderCreated,
    listOrders: async () => [],
    adminChatId: ADMIN_CHAT,
    supportUrl: 'https://t.me/support',
  })

  let updateId = 0
  const text = (value: string) =>
    handle({ update_id: ++updateId, message: { message_id: updateId, from: user, chat, date: 0, text: value } })
  const press = (data: string) =>
    handle({
      update_id: ++updateId,
      callback_query: { id: `cb${updateId}`, from: user, data, message: { message_id: 1, chat, date: 0 } },
    } satisfies TgUpdate)
  const lastText = () => {
    const sent = calls.filter((c) => c.method === 'sendMessage')
    return String(sent[sent.length - 1]?.params.text ?? '')
  }
  const sentTo = (chatId: number | string) =>
    calls.filter((c) => c.method === 'sendMessage' && String(c.params.chat_id) === String(chatId))

  return { handle, calls, text, press, lastText, sentTo, createOrder, afterOrderCreated }
}

describe('telegram bot flow', () => {
  let bot: ReturnType<typeof setup>
  beforeEach(() => {
    bot = setup()
  })

  it('shows main menu on /start', async () => {
    await bot.text('/start')
    expect(bot.lastText()).toContain('iGaming Content Lab')
  })

  it('creates a per-piece order end to end', async () => {
    const videoIndex = FALLBACK_SERVICES.findIndex((s) => s.id === 'video-creative')
    await bot.text('/order')
    await bot.press(`svc:${videoIndex}`)
    expect(bot.lastText()).toContain('Сколько штук')

    await bot.text('7')
    expect(bot.lastText()).toContain('Минимальный заказ')

    await bot.text('20')
    expect(bot.lastText()).toContain('$20 за 20 шт.')

    await bot.text('коротко')
    expect(bot.lastText()).toContain('подробнее')

    await bot.text('Креативы под гео BR, оффер казино, вертикаль 9:16')
    await bot.text('Примеры: t.me/example_channel')
    expect(bot.lastText()).toContain('Проверьте заявку')

    await bot.press('confirm')
    expect(bot.createOrder).toHaveBeenCalledOnce()
    const input = bot.createOrder.mock.calls[0][0]
    expect(input).toMatchObject({
      clientTelegram: '@ivan_wm',
      serviceId: 'video-creative',
      price: 20,
      quantityLabel: '20 шт.',
      links: ['https://t.me/example_channel'],
      meta: { source: 'telegram_bot', telegram_user_id: '42', telegram_chat_id: '42' },
    })
    expect(bot.afterOrderCreated).toHaveBeenCalledOnce()
    expect(bot.lastText()).toContain('ICL-TEST-0001')

    await bot.press('confirm')
    expect(bot.createOrder).toHaveBeenCalledOnce()
  })

  it('skips quantity for individual services and allows skipping references', async () => {
    const customIndex = FALLBACK_SERVICES.findIndex((s) => s.id === 'custom')
    await bot.press(`svc:${customIndex}`)
    expect(bot.lastText()).toContain('Опишите задачу')
    await bot.text('Нужен лендинг-обзор и 10 статей для SEO')
    await bot.press('skip')
    expect(bot.lastText()).toContain('Индивидуально')
  })

  it('cancels the wizard', async () => {
    await bot.press('svc:0')
    await bot.press('cancel')
    await bot.text('20')
    expect(bot.lastText()).toContain('Выберите действие')
  })

  it('relays support questions to the admin chat and admin replies back', async () => {
    await bot.press('support')
    await bot.text('Сколько времени занимает заказ?')
    const toAdmin = bot.sentTo(ADMIN_CHAT)
    expect(toAdmin).toHaveLength(1)
    const adminText = String(toAdmin[0].params.text)
    expect(adminText).toContain('#client42')

    await bot.handle({
      update_id: 999,
      message: {
        message_id: 5,
        from: { id: 7, first_name: 'Admin' },
        chat: { id: Number(ADMIN_CHAT), type: 'supergroup' },
        date: 0,
        text: 'Обычно 2–3 дня',
        reply_to_message: { message_id: 4, chat: { id: Number(ADMIN_CHAT), type: 'supergroup' }, date: 0, text: adminText },
      },
    })
    const toClient = bot.sentTo(42)
    expect(String(toClient[toClient.length - 1].params.text)).toContain('Обычно 2–3 дня')
  })

  it('ignores group messages that are not admin replies', async () => {
    await bot.handle({
      update_id: 1,
      message: { message_id: 1, from: user, chat: { id: -1, type: 'group' }, date: 0, text: '/start' },
    })
    expect(bot.calls).toHaveLength(0)
  })
})
