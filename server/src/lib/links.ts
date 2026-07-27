/** Collect and normalize order links from form fields. */
export function normalizeLink(raw: string): string | null {
  let value = raw.trim()
  if (!value) return null

  // Strip wrapping punctuation often pasted from chats
  value = value.replace(/^[<\["'(]+/, '').replace(/[>\]"'),.]+$/, '')

  if (!/^https?:\/\//i.test(value)) {
    if (/^(t\.me|telegram\.me|www\.|docs\.google\.|drive\.google\.|youtu\.be|youtube\.com)/i.test(value)) {
      value = `https://${value}`
    } else if (/^[a-z0-9.-]+\.[a-z]{2,}([/:].*)?$/i.test(value)) {
      value = `https://${value}`
    } else {
      return null
    }
  }

  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

const URL_IN_TEXT =
  /(?:https?:\/\/|www\.|t\.me\/|telegram\.me\/)[^\s<>"']+/gi

export function extractLinksFromText(text: string): string[] {
  if (!text?.trim()) return []
  const matches = text.match(URL_IN_TEXT) || []
  const result: string[] = []
  for (const match of matches) {
    const normalized = normalizeLink(match)
    if (normalized && !result.includes(normalized)) result.push(normalized)
  }
  return result
}

export function collectOrderLinks(input: {
  linksJson?: string
  referencesText?: string
  description?: string
  linkDraft?: string
}): string[] {
  const collected: string[] = []

  const push = (value: string | null) => {
    if (value && !collected.includes(value)) collected.push(value)
  }

  if (input.linksJson) {
    try {
      const parsed = JSON.parse(input.linksJson) as unknown
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === 'string') push(normalizeLink(item))
        }
      }
    } catch {
      // plain text fallback
      for (const line of input.linksJson.split(/[\n,;\s]+/)) {
        push(normalizeLink(line))
      }
    }
  }

  push(normalizeLink(input.linkDraft || ''))

  for (const link of extractLinksFromText(input.referencesText || '')) push(link)
  for (const link of extractLinksFromText(input.description || '')) push(link)

  return collected
}
