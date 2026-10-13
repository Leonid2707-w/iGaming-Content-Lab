import type { SupabaseClient } from '@supabase/supabase-js'
import type { BotSession } from './types.js'

export interface SessionStore {
  get(chatId: number): Promise<BotSession>
  set(chatId: number, session: BotSession): Promise<void>
}

const IDLE: BotSession = { step: 'idle' }

export function createMemorySessionStore(): SessionStore {
  const sessions = new Map<number, BotSession>()
  return {
    async get(chatId) {
      return { ...(sessions.get(chatId) ?? IDLE) }
    },
    async set(chatId, session) {
      sessions.set(chatId, { ...session })
    },
  }
}

const MISSING_TABLE = /relation .*telegram_bot_sessions.* does not exist|schema cache|PGRST205/i

/**
 * Serverless invocations don't share memory, so wizard state lives in Supabase.
 * Falls back to memory (fine for local polling) until migration 008 is applied.
 */
export function createSupabaseSessionStore(getClient: () => SupabaseClient): SessionStore {
  const memory = createMemorySessionStore()
  let useMemory = false

  const fallback = (error: { message: string }) => {
    if (!MISSING_TABLE.test(error.message)) throw new Error(error.message)
    if (!useMemory) {
      console.warn(
        '[bot] table telegram_bot_sessions not found — apply supabase/migrations/008_telegram_bot.sql. Using in-memory sessions.',
      )
    }
    useMemory = true
  }

  return {
    async get(chatId) {
      if (useMemory) return memory.get(chatId)
      const { data, error } = await getClient()
        .from('telegram_bot_sessions')
        .select('state')
        .eq('chat_id', chatId)
        .maybeSingle()
      if (error) {
        fallback(error)
        return memory.get(chatId)
      }
      const state = data?.state as BotSession | undefined
      return state?.step ? state : { ...IDLE }
    },
    async set(chatId, session) {
      if (useMemory) return memory.set(chatId, session)
      const { error } = await getClient()
        .from('telegram_bot_sessions')
        .upsert(
          { chat_id: chatId, state: session, updated_at: new Date().toISOString() },
          { onConflict: 'chat_id' },
        )
      if (error) {
        fallback(error)
        await memory.set(chatId, session)
      }
    },
  }
}
