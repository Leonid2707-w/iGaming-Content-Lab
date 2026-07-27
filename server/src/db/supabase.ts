import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { assertServerConfig, serverEnv } from '../config/env.js'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (client) return client
  assertServerConfig()
  client = createClient(serverEnv.supabaseUrl!, serverEnv.supabaseServiceRoleKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return client
}
