import { escapeHtml } from '../services/telegram.js'
import { rateLimit } from '../lib/rateLimit.js'
import { collectOrderLinks } from '../lib/links.js'
import type { CreateOrderInput, OrderRecord } from '../types/order.js'
import { ORDER_STATUS_LABELS } from '../types/order.js'
import { sendText, type TelegramApi } from './api.js'
import {
  formatServicePrice,
  isPerPiece,
  quantityLimits,
  quantityPresets,
  quoteOrder,
  validateQuantity,
} from './catalog.js'
import type { SessionStore } from './sessions.js'
import type {
  BotService,
  BotSession,
  InlineKeyboard,
  TgCallbackQuery,
  TgMessage,
  TgUpdate,
  TgUser,
} from './types.js'

export interface BotDeps {
  api: TelegramApi
  sessions: SessionStore
  loadCatalog(): Promise<BotService[]>
  createOrder(input: CreateOrderInput): Promise<OrderRecord>
  /** Admin chat notification + Google Sheets sync for a freshly created order. */
  afterOrderCreated(order: OrderRecord): Promise<void>
  listOrders(user: TgUser): Promise<OrderRecord[]>
  adminChatId?: string
  supportUrl: string
  siteUrl?: string
}

const MIN_DESCRIPTION_LENGTH = 10
const MAX_TEXT_LENGTH = 3000
const STATUS_EMOJI: Record<string, string> = {
  new: '🆕',
  in_progress: '⚙️',
  done: '✅',
  cancelled: '✖️',
}

/** Marker in admin-chat messages that lets admins reply to a client by replying to the bot. */
const CLIENT_MARKER = /#client(\d+)/

const btn = (text: string, callback_data: string) => ({ text, callback_data })

function mainMenu(deps: BotDeps): InlineKeyboard {
  const rows: InlineKeyboard = [
    [btn('🛒 Оформить заказ', 'order')],
    [btn('💼 Услуги и цены', 'prices'), btn('📦 Мои заказы', 'my')],
    [btn('💬 Написать менеджеру', 'support')],
  ]
  if (deps.siteUrl) rows.push([{ text: '🌐 Сайт iCL', url: deps.siteUrl }])
  return rows
}

const backToMenu: InlineKeyboard = [[btn('⬅️ В меню', 'menu')]]
const cancelRow = [btn('✖️ Отменить', 'cancel')]

function displayName(user: TgUser) {
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || 'клиент'
}

function clientContact(user: TgUser) {
  return user.username ? `@${user.username}` : `tg id ${user.id} (${displayName(user)})`
}

function clip(text: string) {
  return text.trim().slice(0, MAX_TEXT_LENGTH)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function createBotHandler(deps: BotDeps) {
  const { api, sessions } = deps

  const reply = (chatId: number, text: string, keyboard?: InlineKeyboard) =>
    sendText(api, chatId, text, keyboard)

  async function findService(id?: string) {
    if (!id) return undefined
    const catalog = await deps.loadCatalog()
    return catalog.find((service) => service.id === id)
  }

  async function showMenu(chatId: number, user: TgUser) {
    await sessions.set(chatId, { step: 'idle' })
    await reply(
      chatId,
      [
        `👋 Привет, ${escapeHtml(user.first_name || 'друг')}!`,
        '',
        'Я бот <b>iGaming Content Lab</b> — производим контент для вебмастеров и медиабаинговых команд: видео-креативы, посты, ведение Telegram, Instagram и YouTube.',
        '',
        'Здесь можно посмотреть цены, оформить заказ и следить за его статусом.',
      ].join('\n'),
      mainMenu(deps),
    )
  }

  async function showPrices(chatId: number) {
    const catalog = await deps.loadCatalog()
    const lines = catalog.map(
      (service) =>
        `• <b>${escapeHtml(service.title)}</b> — ${escapeHtml(formatServicePrice(service))}` +
        (service.description ? `\n  <i>${escapeHtml(service.description)}</i>` : ''),
    )
    await reply(chatId, ['💼 <b>Услуги и цены</b>', '', ...lines].join('\n'), [
      [btn('🛒 Оформить заказ', 'order')],
      ...backToMenu,
    ])
  }

  async function startOrder(chatId: number) {
    await sessions.set(chatId, { step: 'idle' })
    const catalog = await deps.loadCatalog()
    const rows: InlineKeyboard = catalog.map((service, index) => [
      btn(`${service.title} · ${formatServicePrice(service)}`, `svc:${index}`),
    ])
    rows.push(cancelRow)
    await reply(chatId, '🛒 <b>Новый заказ</b>\n\nВыберите услугу:', rows)
  }

  async function selectService(chatId: number, index: number) {
    const catalog = await deps.loadCatalog()
    const service = catalog[index]
    if (!service) {
      await reply(chatId, 'Услуга не найдена — каталог мог обновиться. Попробуйте ещё раз.', [
        [btn('🛒 Выбрать услугу', 'order')],
      ])
      return
    }

    const header = `<b>${escapeHtml(service.title)}</b>\n${escapeHtml(formatServicePrice(service))}`

    if (isPerPiece(service)) {
      const { min, max, step } = quantityLimits(service)
      await sessions.set(chatId, { step: 'await_quantity', serviceId: service.id })
      const presets = quantityPresets(service).map((qty) => btn(String(qty), `qty:${qty}`))
      await reply(
        chatId,
        `${header}\n\nСколько штук нужно? Выберите вариант или отправьте число (от ${min} до ${max}${step > 1 ? `, шаг ${step}` : ''}).`,
        [presets, cancelRow],
      )
      return
    }

    await sessions.set(chatId, { step: 'await_description', serviceId: service.id })
    await askDescription(chatId, header)
  }

  async function askDescription(chatId: number, prefix = '') {
    await reply(
      chatId,
      `${prefix ? `${prefix}\n\n` : ''}✍️ Опишите задачу: гео, оффер, площадка, сроки, пожелания по стилю.`,
      [cancelRow],
    )
  }

  async function setQuantity(chatId: number, session: BotSession, quantity: number) {
    const service = await findService(session.serviceId)
    if (!service) return startOrder(chatId)
    const error = validateQuantity(service, quantity)
    if (error) {
      await reply(chatId, `⚠️ ${error} Попробуйте ещё раз.`, [cancelRow])
      return
    }
    await sessions.set(chatId, { ...session, step: 'await_description', quantity })
    const { priceLabel } = quoteOrder(service, quantity)
    await askDescription(chatId, `Количество: <b>${quantity} шт.</b>\nСтоимость: <b>${escapeHtml(priceLabel)}</b>`)
  }

  async function showConfirm(chatId: number, session: BotSession) {
    const service = await findService(session.serviceId)
    if (!service) return startOrder(chatId)
    const quote = quoteOrder(service, session.quantity)
    const lines = [
      '📝 <b>Проверьте заявку</b>',
      '',
      `<b>Услуга:</b> ${escapeHtml(service.title)}`,
      ...(quote.quantityLabel ? [`<b>Объём:</b> ${escapeHtml(quote.quantityLabel)}`] : []),
      `<b>Стоимость:</b> ${escapeHtml(quote.priceLabel)}`,
      '',
      `<b>Задача:</b>\n${escapeHtml(session.description || '—')}`,
      '',
      `<b>Референсы:</b>\n${escapeHtml(session.references || '—')}`,
    ]
    await reply(chatId, lines.join('\n'), [
      [btn('✅ Отправить заявку', 'confirm')],
      [btn('🔄 Заново', 'order'), btn('✖️ Отменить', 'cancel')],
    ])
  }

  async function submitOrder(chatId: number, user: TgUser) {
    const session = await sessions.get(chatId)
    const service = await findService(session.serviceId)
    if (session.step !== 'confirm' || !service || !session.description) {
      await reply(chatId, 'Эта заявка уже отправлена или устарела.', mainMenu(deps))
      return
    }

    const limited = rateLimit({ key: `bot-order:${user.id}`, limit: 5, windowMs: 60 * 60 * 1000 })
    if (!limited.ok) {
      await reply(chatId, `⏳ Слишком много заявок подряд. Попробуйте через ${Math.ceil(limited.retryAfterSec / 60)} мин.`)
      return
    }

    await sessions.set(chatId, { step: 'idle' })
    const quote = quoteOrder(service, session.quantity)
    const description = session.description
    const referencesText = session.references || ''

    let order: OrderRecord
    try {
      order = await deps.createOrder({
        clientTelegram: clientContact(user),
        serviceId: service.id,
        serviceTitle: service.title,
        platform: 'Telegram-бот',
        quantityLabel: quote.quantityLabel,
        price: quote.price,
        priceLabel: quote.priceLabel,
        description,
        referencesText,
        links: collectOrderLinks({ description, referencesText }),
        meta: {
          source: 'telegram_bot',
          telegram_user_id: String(user.id),
          telegram_chat_id: String(chatId),
          telegram_username: user.username || null,
          telegram_name: displayName(user),
          quantity: session.quantity ?? null,
        },
      })
    } catch (error) {
      console.error('[bot.createOrder]', error)
      await sessions.set(chatId, session)
      await reply(chatId, '😔 Не получилось сохранить заявку. Попробуйте ещё раз чуть позже или напишите менеджеру.', [
        [btn('🔁 Повторить', 'confirm')],
        [{ text: '💬 Поддержка', url: deps.supportUrl }],
      ])
      return
    }

    try {
      await deps.afterOrderCreated(order)
    } catch (error) {
      console.error('[bot.afterOrderCreated]', error)
    }

    await reply(
      chatId,
      [
        '🎉 <b>Заявка принята!</b>',
        '',
        `Номер: <code>${escapeHtml(order.public_id)}</code>`,
        'Менеджер свяжется с вами в Telegram в ближайшее время. Об изменениях статуса я сообщу здесь.',
      ].join('\n'),
      mainMenu(deps),
    )
  }

  async function showMyOrders(chatId: number, user: TgUser) {
    let orders: OrderRecord[]
    try {
      orders = await deps.listOrders(user)
    } catch (error) {
      console.error('[bot.listOrders]', error)
      await reply(chatId, 'Не удалось загрузить заказы. Попробуйте позже.', backToMenu)
      return
    }
    if (!orders.length) {
      await reply(chatId, '📦 У вас пока нет заказов.', [[btn('🛒 Оформить заказ', 'order')], ...backToMenu])
      return
    }
    const lines = orders.slice(0, 10).map((order) =>
      [
        `${STATUS_EMOJI[order.status] ?? '•'} <code>${escapeHtml(order.public_id)}</code> — ${escapeHtml(ORDER_STATUS_LABELS[order.status] ?? order.status)}`,
        `   ${escapeHtml(order.service_title)}${order.price_label ? ` · ${escapeHtml(order.price_label)}` : ''} · ${formatDate(order.created_at)}`,
      ].join('\n'),
    )
    await reply(chatId, ['📦 <b>Ваши заказы</b>', '', ...lines].join('\n'), backToMenu)
  }

  async function startSupport(chatId: number) {
    if (!deps.adminChatId) {
      await reply(chatId, 'Напишите нашему менеджеру напрямую:', [
        [{ text: '💬 Открыть чат поддержки', url: deps.supportUrl }],
        ...backToMenu,
      ])
      return
    }
    await sessions.set(chatId, { step: 'await_question' })
    await reply(chatId, '💬 Напишите вопрос одним сообщением — я передам его менеджеру, ответ придёт сюда.', [cancelRow])
  }

  async function forwardQuestion(chatId: number, user: TgUser, text: string) {
    await sessions.set(chatId, { step: 'idle' })
    try {
      await sendText(
        api,
        deps.adminChatId!,
        [
          '💬 <b>Вопрос из бота</b>',
          `От: ${escapeHtml(clientContact(user))}`,
          '',
          escapeHtml(text),
          '',
          `<i>Ответьте реплаем на это сообщение — ответ уйдёт клиенту.</i> #client${chatId}`,
        ].join('\n'),
      )
      await reply(chatId, '✅ Вопрос отправлен менеджеру. Ответ придёт в этот чат.', mainMenu(deps))
    } catch (error) {
      console.error('[bot.forwardQuestion]', error)
      await reply(chatId, 'Не удалось передать вопрос. Напишите менеджеру напрямую:', [
        [{ text: '💬 Поддержка', url: deps.supportUrl }],
      ])
    }
  }

  async function handleAdminReply(message: TgMessage) {
    const original = message.reply_to_message
    const source = original?.text || original?.caption || ''
    const match = source.match(CLIENT_MARKER)
    const text = message.text?.trim()
    if (!match || !text) return
    try {
      await sendText(api, Number(match[1]), `💬 <b>Ответ менеджера iCL</b>\n\n${escapeHtml(text)}`, [
        [btn('↩️ Ответить', 'support')],
      ])
      await sendText(api, message.chat.id, '✅ Ответ отправлен клиенту.')
    } catch (error) {
      await sendText(
        api,
        message.chat.id,
        `⚠️ Не удалось отправить ответ: ${escapeHtml(error instanceof Error ? error.message : String(error))}`,
      )
    }
  }

  async function handleText(message: TgMessage, user: TgUser) {
    const chatId = message.chat.id
    const text = (message.text ?? message.caption ?? '').trim()
    const command = text.startsWith('/') ? text.split(/[\s@]/)[0].toLowerCase() : ''

    switch (command) {
      case '/start':
        if (text.split(/\s+/)[1] === 'order') return startOrder(chatId)
        return showMenu(chatId, user)
      case '/menu':
      case '/help':
        return showMenu(chatId, user)
      case '/order':
        return startOrder(chatId)
      case '/prices':
        return showPrices(chatId)
      case '/my':
        return showMyOrders(chatId, user)
      case '/support':
        return startSupport(chatId)
      case '/cancel':
        await sessions.set(chatId, { step: 'idle' })
        return reply(chatId, 'Действие отменено.', mainMenu(deps))
    }

    const session = await sessions.get(chatId)

    if (!text) {
      if (session.step === 'idle') return showMenu(chatId, user)
      return reply(
        chatId,
        '📎 Файлы через бот пока не принимаются — пришлите ссылку (Google Drive, Dropbox, t.me) текстом, а исходники менеджер запросит отдельно.',
      )
    }

    switch (session.step) {
      case 'await_quantity': {
        const quantity = Number(text.replace(/\s/g, ''))
        return setQuantity(chatId, session, quantity)
      }
      case 'await_description':
        if (text.length < MIN_DESCRIPTION_LENGTH) {
          return reply(chatId, 'Опишите задачу чуть подробнее — хотя бы пару предложений.', [cancelRow])
        }
        await sessions.set(chatId, { ...session, step: 'await_references', description: clip(text) })
        return reply(
          chatId,
          '🔗 Есть референсы или ссылки (канал, примеры креативов, ТЗ)? Пришлите их сообщением или нажмите «Пропустить».',
          [[btn('⏭ Пропустить', 'skip')], cancelRow],
        )
      case 'await_references': {
        const next: BotSession = { ...session, step: 'confirm', references: clip(text) }
        await sessions.set(chatId, next)
        return showConfirm(chatId, next)
      }
      case 'confirm':
        return showConfirm(chatId, session)
      case 'await_question':
        return forwardQuestion(chatId, user, clip(text))
      default:
        return reply(chatId, 'Выберите действие в меню 👇', mainMenu(deps))
    }
  }

  async function handleCallback(query: TgCallbackQuery) {
    await api.call('answerCallbackQuery', { callback_query_id: query.id }).catch(() => undefined)
    const chatId = query.message?.chat.id
    if (!chatId || query.message?.chat.type !== 'private') return
    const data = query.data || ''
    const user = query.from

    if (data === 'menu') return showMenu(chatId, user)
    if (data === 'order') return startOrder(chatId)
    if (data === 'prices') return showPrices(chatId)
    if (data === 'my') return showMyOrders(chatId, user)
    if (data === 'support') return startSupport(chatId)
    if (data === 'confirm') return submitOrder(chatId, user)
    if (data === 'cancel') {
      await sessions.set(chatId, { step: 'idle' })
      return reply(chatId, 'Заказ отменён. Возвращайтесь, когда будете готовы 🙌', mainMenu(deps))
    }
    if (data.startsWith('svc:')) return selectService(chatId, Number(data.slice(4)))

    const session = await sessions.get(chatId)
    if (data.startsWith('qty:') && session.step === 'await_quantity') {
      return setQuantity(chatId, session, Number(data.slice(4)))
    }
    if (data === 'skip' && session.step === 'await_references') {
      const next: BotSession = { ...session, step: 'confirm', references: '' }
      await sessions.set(chatId, next)
      return showConfirm(chatId, next)
    }
  }

  return async function handleUpdate(update: TgUpdate) {
    try {
      if (update.callback_query) return await handleCallback(update.callback_query)

      const message = update.message
      if (!message?.from || message.from.is_bot) return

      if (message.chat.type === 'private') return await handleText(message, message.from)

      if (deps.adminChatId && String(message.chat.id) === deps.adminChatId && message.reply_to_message) {
        return await handleAdminReply(message)
      }
    } catch (error) {
      console.error('[bot.update]', update.update_id, error)
    }
  }
}

export type BotUpdateHandler = ReturnType<typeof createBotHandler>

export function formatStatusChangeMessage(order: OrderRecord, note?: string) {
  const status = ORDER_STATUS_LABELS[order.status] ?? order.status
  return [
    `${STATUS_EMOJI[order.status] ?? '🔔'} <b>Статус заказа обновлён</b>`,
    '',
    `<code>${escapeHtml(order.public_id)}</code> · ${escapeHtml(order.service_title)}`,
    `Новый статус: <b>${escapeHtml(status)}</b>`,
    note?.trim() ? `\n${escapeHtml(note.trim())}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}
