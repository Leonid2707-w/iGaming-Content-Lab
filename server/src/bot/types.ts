export interface TgUser {
  id: number
  is_bot?: boolean
  first_name: string
  last_name?: string
  username?: string
}

export interface TgChat {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  title?: string
  username?: string
}

export interface TgMessage {
  message_id: number
  from?: TgUser
  chat: TgChat
  date: number
  text?: string
  caption?: string
  photo?: unknown[]
  document?: unknown
  video?: unknown
  reply_to_message?: TgMessage
}

export interface TgCallbackQuery {
  id: string
  from: TgUser
  message?: TgMessage
  data?: string
}

export interface TgUpdate {
  update_id: number
  message?: TgMessage
  callback_query?: TgCallbackQuery
}

export interface InlineButton {
  text: string
  callback_data?: string
  url?: string
}

export type InlineKeyboard = InlineButton[][]

export interface BotService {
  id: string
  title: string
  description: string
  priceMode: 'numeric' | 'text'
  price?: number
  pricePrefix?: string
  priceText?: string
  unitId: string
  unit: 'piece' | 'month' | 'project'
  unitLabel: string
  minimum?: number
  maximum?: number
  step?: number
}

export type BotStep =
  | 'idle'
  | 'await_quantity'
  | 'await_description'
  | 'await_references'
  | 'confirm'
  | 'await_question'

export interface BotSession {
  step: BotStep
  serviceId?: string
  quantity?: number
  description?: string
  references?: string
}
