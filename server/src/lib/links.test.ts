import { describe, expect, it } from 'vitest'
import { collectOrderLinks, normalizeLink } from './links.js'
import { rateLimit } from './rateLimit.js'

describe('normalizeLink', () => {
  it('adds https to bare domains', () => {
    expect(normalizeLink('t.me/ICLsupport')).toBe('https://t.me/ICLsupport')
  })

  it('rejects junk', () => {
    expect(normalizeLink('not a url')).toBeNull()
  })
})

describe('collectOrderLinks', () => {
  it('merges json, draft and text urls', () => {
    const links = collectOrderLinks({
      linksJson: JSON.stringify(['https://example.com/a']),
      linkDraft: 'https://example.com/b',
      description: 'see https://example.com/c please',
      referencesText: '',
    })
    expect(links).toEqual([
      'https://example.com/a',
      'https://example.com/b',
      'https://example.com/c',
    ])
  })
})

describe('rateLimit', () => {
  it('blocks after limit', () => {
    const key = `test-${Date.now()}`
    expect(rateLimit({ key, limit: 2, windowMs: 60_000 }).ok).toBe(true)
    expect(rateLimit({ key, limit: 2, windowMs: 60_000 }).ok).toBe(true)
    const third = rateLimit({ key, limit: 2, windowMs: 60_000 })
    expect(third.ok).toBe(false)
  })
})
