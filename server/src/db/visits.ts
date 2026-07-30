import { randomUUID } from 'node:crypto'
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { getSupabase } from './supabase.js'

export type PageVisitInput = {
  visitorId: string
  path: string
  referrer?: string
  userAgent?: string
}

export type PageVisitRow = {
  id: string
  created_at: string
  visitor_id: string
  path: string
}

const LOCAL_FILE =
  process.env.VERCEL === '1'
    ? resolve('/tmp', 'icl-page_visits.jsonl')
    : resolve(process.cwd(), 'server/data/page_visits.jsonl')
let tableAvailable: boolean | null = null

function ensureLocalFile() {
  const dir = dirname(LOCAL_FILE)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  if (!existsSync(LOCAL_FILE)) appendFileSync(LOCAL_FILE, '', 'utf8')
}

function writeLocalVisit(row: PageVisitRow & { referrer: string; user_agent: string }) {
  ensureLocalFile()
  appendFileSync(LOCAL_FILE, `${JSON.stringify(row)}\n`, 'utf8')
}

function readLocalVisits(fromIso: string, toIso: string): PageVisitRow[] {
  ensureLocalFile()
  const from = new Date(fromIso).getTime()
  const to = new Date(toIso).getTime()
  const raw = readFileSync(LOCAL_FILE, 'utf8')
  if (!raw.trim()) return []
  const rows: PageVisitRow[] = []
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue
    try {
      const parsed = JSON.parse(line) as PageVisitRow
      const ts = new Date(parsed.created_at).getTime()
      if (ts >= from && ts <= to) {
        rows.push({
          id: String(parsed.id),
          created_at: String(parsed.created_at),
          visitor_id: String(parsed.visitor_id),
          path: String(parsed.path || '/'),
        })
      }
    } catch {
      // skip bad lines
    }
  }
  return rows
}

function normalizePath(raw: string) {
  try {
    const value = raw.trim() || '/'
    const url = value.startsWith('http') ? new URL(value) : new URL(value, 'https://example.local')
    const path = url.pathname || '/'
    if (path.startsWith('/admin') || path.startsWith('/api')) return ''
    return path.slice(0, 200)
  } catch {
    return '/'
  }
}

function isMissingTableError(message: string) {
  return /relation .*page_visits.* does not exist|Could not find the table|schema cache/i.test(
    message,
  )
}

export async function recordPageVisit(input: PageVisitInput) {
  const path = normalizePath(input.path)
  const visitorId = input.visitorId.trim().slice(0, 80)
  if (!visitorId || !path) {
    throw new Error('Некорректные данные посещения')
  }

  const row = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    visitor_id: visitorId,
    path,
    referrer: String(input.referrer || '').slice(0, 500),
    user_agent: String(input.userAgent || '').slice(0, 400),
  }

  if (tableAvailable === false) {
    writeLocalVisit(row)
    return
  }

  try {
    const supabase = getSupabase()
    const { error } = await supabase.from('page_visits').insert({
      visitor_id: row.visitor_id,
      path: row.path,
      referrer: row.referrer,
      user_agent: row.user_agent,
    })

    if (error) {
      if (isMissingTableError(error.message)) {
        tableAvailable = false
        writeLocalVisit(row)
        return
      }
      throw new Error(error.message)
    }
    tableAvailable = true
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (isMissingTableError(message)) {
      tableAvailable = false
      writeLocalVisit(row)
      return
    }
    throw error instanceof Error ? error : new Error(message)
  }
}

export async function listPageVisits(fromIso: string, toIso: string): Promise<PageVisitRow[]> {
  if (tableAvailable === false) {
    return readLocalVisits(fromIso, toIso)
  }

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('page_visits')
      .select('id, created_at, visitor_id, path')
      .gte('created_at', fromIso)
      .lte('created_at', toIso)
      .order('created_at', { ascending: true })
      .limit(50_000)

    if (error) {
      if (isMissingTableError(error.message)) {
        tableAvailable = false
        return readLocalVisits(fromIso, toIso)
      }
      throw new Error(error.message)
    }

    tableAvailable = true
    const remote = (data || []).map((row) => ({
      id: String(row.id),
      created_at: String(row.created_at),
      visitor_id: String(row.visitor_id),
      path: String(row.path || '/'),
    }))

    // If table was created later, still include any local backlog.
    const local = readLocalVisits(fromIso, toIso)
    if (!local.length) return remote
    const seen = new Set(remote.map((r) => r.id))
    return [...remote, ...local.filter((r) => !seen.has(r.id))].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (isMissingTableError(message)) {
      tableAvailable = false
      return readLocalVisits(fromIso, toIso)
    }
    throw error instanceof Error ? error : new Error(message)
  }
}
