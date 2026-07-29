# Синхронизация заказов с Google Таблицей

Таблица: [Таблица заказов iCL](https://docs.google.com/spreadsheets/d/1LmKZdtXHiuYprbLGNyKZNZr1m6KwAPUTbX-KljU9nb0/edit)

## Что происходит автоматически

После настройки webhook:

- новый заказ с сайта → строка в таблице;
- смена статуса в админке → строка обновляется;
- удаление заказа → строка удаляется;
- можно один раз выгрузить все заказы: `POST /api/admin/orders/sync-sheets`.

## Настройка (один раз)

1. Откройте таблицу → **Расширения → Apps Script**.
2. Удалите содержимое `Code.gs` и вставьте код из `google-apps-script/OrderSheetSync.gs`.
3. Сохраните проект.
4. Слева **⚙ Project settings → Script properties → Add script property**:
   - Property: `SHEETS_WEBHOOK_SECRET`
   - Value: любой длинный секрет (например `openssl rand -hex 24`)
5. **Deploy → New deployment**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Скопируйте URL вида `https://script.google.com/macros/s/.../exec`
7. В `.env` сервера добавьте:

```env
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/XXXX/exec
GOOGLE_SHEETS_WEBHOOK_SECRET=тот_же_секрет_что_в_Script_properties
```

8. Перезапустите API (`npm run dev` / production process).
9. В Apps Script запустите функцию `setupSheet` (один раз) — создаст лист **«Заказы»** с шапкой.
10. (Опционально) Вызовите синхронизацию всех существующих заказов из админки/через API:

```bash
curl -X POST http://127.0.0.1:8787/api/admin/orders/sync-sheets \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Колонки

| Колонка | Описание |
|---|---|
| ID заявки | Публичный ID |
| Дата создания / Обновлено | Время |
| Telegram | Username клиента |
| Услуга / Платформа / Количество | Параметры заказа |
| Сумма / Сумма (текст) | Число и подпись |
| Статус | Новая / В работе / … |
| Описание, референсы, ссылки, файлы | Детали |
| TG уведомление | Ушло ли в Telegram |
| UUID / User ID | Внутренние ID |
