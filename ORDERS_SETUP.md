# Система заявок iCL

## Стек
- Frontend: React + Vite (без смены дизайна)
- API: Hono (`server/`)
- DB/Storage: Supabase
- Уведомления: Telegram Bot API

## 1. Supabase
1. Создайте проект на https://supabase.com
2. SQL Editor → выполните `supabase/migrations/001_orders.sql`
3. Project Settings → API:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (service_role, не anon)
4. Вставьте значения в `.env`

## 2. Telegram
В `.env`:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ADMIN_ID`

Важно: если токен светился в чате/репозитории — перевыпустите его у @BotFather.

## 3. Запуск
```bash
npm run dev
```
Поднимает Vite + API (порт 8787), прокси `/api` → API.

Только API:
```bash
npm run dev:server
```

## 4. Проверка
1. Отправьте заказ с сайта
2. Заявка появится в `/admin/orders`
3. Сообщение придёт в Telegram

## Безопасность
Секреты только в `.env` (файл в `.gitignore`).
