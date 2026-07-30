import { handle } from 'hono/vercel'
import { app } from '../server/src/app'

export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
  memory: 1024,
}

export default handle(app)
