import { serve } from '@hono/node-server'
import { app } from './app.js'
import { serverEnv } from './config/env.js'

serve({ fetch: app.fetch, port: serverEnv.port }, (info) => {
  console.log(`[icl-api] http://127.0.0.1:${info.port}`)
})
