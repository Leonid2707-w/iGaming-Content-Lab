import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password.js'

describe('password hashing', () => {
  it('hashes and verifies', async () => {
    const hash = await hashPassword('secret-pass-123')
    expect(hash).not.toContain('secret-pass-123')
    expect(await verifyPassword('secret-pass-123', hash)).toBe(true)
    expect(await verifyPassword('wrong', hash)).toBe(false)
  })
})
