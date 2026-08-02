# Production deploy — iGaming Content Lab

## Stack
- Frontend: Vite + React (static `dist/`)
- API: Hono, bundled to `api/index.mjs` for Vercel
- DB/Auth/Storage: Supabase

## Required env (Vercel Production)
- `SUPABASE_URL` — `https://xxxx.supabase.co` (real project, with `https://`)
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_LOGIN` / `ADMIN_PASSWORD`
- `ADMIN_API_SECRET` — random ≥24 chars (not a placeholder)
- `PUBLIC_SITE_URL=https://igamingcontentlab.pro`
- `ALLOWED_ORIGINS=https://www.igamingcontentlab.pro,https://igamingcontentlab.pro`
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_ADMIN_ID`
- Optional: `GOOGLE_SHEETS_WEBHOOK_URL` / `GOOGLE_SHEETS_WEBHOOK_SECRET`

Do **not** set `VITE_API_URL` for same-origin `/api`.

## Supabase SQL
Run in order from `supabase/migrations/`:
1. `001_orders.sql`
2. `002_auth_profiles.sql`
3. `003_orders_rls_insert.sql`
4. `004_page_visits.sql`
5. `005_site_services_partners.sql`
6. `006_order_rpcs.sql` — transactional create/status + history index
7. `007_admin_users.sql` — multi-admin RBAC (owner `leonid` seeded from `ADMIN_PASSWORD`)

Ensure Storage bucket `order-files` exists (private).

Note: Order files upload directly to Supabase via signed URLs (up to 50 MB each), so Vercel’s ~4.5 MB request body limit does not block attachments.

## Local
```bash
npm install
npm run dev
```
Open http://127.0.0.1:5173/

## Build / Vercel
```bash
npm run build
```
`vercel.json` serves `dist/` and rewrites `/api/*` → `api/index.mjs`.

After env changes: Redeploy the latest deployment.

## Smoke checks
- `GET /api/health` → `{ ok: true, supabaseConfigured: true }`
- `GET /api/auth/status` → `{ configured: true }`
- Login, order with file, admin orders + Telegram resend
- Partner form → `/api/partners`
