/** Session keys for admin panel (credentials live only on the server). */
export const adminConfig = {
  sessionKey: 'icl-admin-session',
  sessionTtlMs: 1000 * 60 * 60 * 8,
} as const
