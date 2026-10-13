# Telegram-бот iCL

Клиентский бот работает внутри того же API (Hono) и использует тот же токен,
что и уведомления о заказах (`TELEGRAM_BOT_TOKEN`).

## Что умеет
- `/start` — главное меню (кнопки).
- **Услуги и цены** — каталог из админки (`site_services`), без него — встроенный список.
- **Оформить заказ** — услуга → количество (для штучных услуг, с проверкой мин/макс/шага и расчётом цены)
  → описание → референсы/ссылки → подтверждение. Заявка сохраняется в `orders`
  (`meta.source = telegram_bot`), появляется в `/admin/orders`, уходит в админ-чат и Google Sheets.
- **Мои заказы** — заявки из бота + заявки с сайта, где указан тот же @username.
- **Написать менеджеру** — вопрос уходит в админ-чат (`TELEGRAM_ADMIN_ID`).
  Менеджер отвечает **реплаем** на сообщение бота — ответ приходит клиенту.
  (Для группы: бот должен видеть реплаи на свои сообщения — это работает и с privacy mode.)
- Смена статуса заказа в админке → клиенту приходит уведомление в бот.

## Настройка
1. Supabase SQL Editor → выполнить `supabase/migrations/008_telegram_bot.sql`
   (хранение шагов диалога между serverless-вызовами).
2. Переменные окружения (локально `.env`, на Vercel — Settings → Environment Variables):
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_ID` — уже используются для уведомлений;
   - `TELEGRAM_WEBHOOK_SECRET` — случайная строка ≥16 символов `[A-Za-z0-9_-]`;
   - `TELEGRAM_SUPPORT_URL` — необязательно, по умолчанию `https://t.me/ICLsupport`.
3. После деплоя зарегистрировать webhook и команды:
   ```bash
   npm run bot:setup                       # URL из PUBLIC_SITE_URL
   npm run bot:setup -- https://preview.example.com
   npm run bot:setup -- --info             # проверить состояние webhook
   ```
4. Проверка: `GET /api/health` → `botWebhookConfigured: true`, затем `/start` в боте.

## Локальная разработка
```bash
npm run bot:dev
```
Запускает long polling (webhook не нужен). **Внимание:** команда снимает webhook у бота —
после локальной отладки снова выполните `npm run bot:setup`. Удобнее завести отдельного
тестового бота в @BotFather и указать его токен в локальном `.env`.

## Код
- `server/src/bot/handler.ts` — логика диалога (тесты: `handler.test.ts`);
- `server/src/bot/catalog.ts` — каталог и расчёт цены;
- `server/src/bot/sessions.ts` — состояние диалога (Supabase / память);
- `server/src/routes/telegramBot.ts` — `POST /api/telegram/webhook`.
