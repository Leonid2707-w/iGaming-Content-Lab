export const COMPANY_ROLES = [
  'Affiliate',
  'Operator',
  'Agency',
  'Advertiser',
  'Other',
] as const

export type CompanyRole = (typeof COMPANY_ROLES)[number]

export const COMPANY_ROLE_LABELS: Record<CompanyRole, string> = {
  Affiliate: 'Affiliate',
  Operator: 'Operator',
  Agency: 'Agency',
  Advertiser: 'Advertiser',
  Other: 'Other',
}

export type ConsentType = 'terms' | 'privacy_personal_data'

export type AccountStatus = 'active' | 'blocked'

export interface UserProfile {
  id: string
  user_id: string
  email: string
  full_name: string
  telegram_username: string
  company_name: string | null
  company_role: CompanyRole | null
  account_status: AccountStatus
  created_at: string
  updated_at: string
}

export function normalizeTelegramUsername(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function isValidPassword(value: string) {
  return value.length >= 8
}

export const REMEMBER_ME_KEY = 'icl-auth-remember'
