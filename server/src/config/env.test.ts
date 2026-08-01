import { afterEach, describe, expect, it, vi } from 'vitest'

describe('assertAdminConfig', () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('rejects weak admin secret in production-like env', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key')
    vi.stubEnv('ADMIN_PASSWORD', 'strong-password')
    vi.stubEnv('ADMIN_API_SECRET', 'change-me')
    vi.stubEnv('NODE_ENV', 'test')

    const { assertAdminConfig } = await import('./env.js')
    expect(() => assertAdminConfig()).toThrow(/ADMIN_API_SECRET/)
  })
})
