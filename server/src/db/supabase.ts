import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { assertSupabaseConfig, serverEnv } from '../config/env.js'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (client) return client
  assertSupabaseConfig()

  const url = serverEnv.supabaseUrl!
  const serviceKey = serverEnv.supabaseServiceRoleKey!

  // Force service_role on every request so RLS never blocks API inserts
  // (even if something later tries to attach a user JWT).
  client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
    },
  })
  return client
}
