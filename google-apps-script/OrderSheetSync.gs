/**
 * iCL — синхронизация и оформление таблицы заказов
 *
 * После обновления кода: formatOrdersSheet → ▶ Выполнить
 */

const SHEET_NAME = 'Заказы'
const HELP_SHEET_NAME = 'Справка'
const SPREADSHEET_ID = '1LmKZdtXHiuYprbLGNyKZNZr1m6KwAPUTbX-KljU9nb0'

const COLORS = {
  headerBg: '#312E81',
  headerFg: '#FFFFFF',
  zebra: '#F8FAFC',
  border: '#E2E8F0',
  statusNew: '#DBEAFE',
  statusNewText: '#1E40AF',
  statusWork: '#FEF3C7',
  statusWorkText: '#92400E',
  statusDone: '#D1FAE5',
  statusDoneText: '#065F46',
  statusCancel: '#FEE2E2',
  statusCancelText: '#991B1B',
}

const HEADER_ROW = [
  'ID заявки',
  'Создан',
  'Обновлён',
  'Telegram',
  'Услуга',
  'Платформа',
  'Объём',
  'Сумма, $',
  'Цена (подпись)',
  'Статус',
  'Описание',
  'Референсы и стиль',
  'Ссылки',
  'Файлов',
  'Уведомление TG',
  'UUID',
  'User ID',
]

const LAST_COL = 'Q'
const COL_WIDTHS = [120, 130, 130, 130, 180, 120, 110, 90, 120, 110, 280, 220, 200, 70, 120, 80, 80]

/** A1-диапазон: надёжнее, чем getRange(row, col, numRows, numCols) */
function a1_(fromRow, fromColLetter, toRow, toColLetter) {
  return fromColLetter + fromRow + ':' + toColLetter + toRow
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}')
    const expected = PropertiesService.getScriptProperties().getProperty('SHEETS_WEBHOOK_SECRET')
    if (!expected || body.secret !== expected) {
      return json_({ ok: false, error: 'Unauthorized' })
    }

    const sheet = getOrCreateSheet_()
    ensureHeaders_(sheet)

    if (body.action === 'delete') {
      deleteByPublicId_(sheet, String(body.publicId || ''))
      return json_({ ok: true, action: 'delete' })
    }

    if (body.action === 'sync_all' && Array.isArray(body.orders)) {
      body.orders.forEach((order) => upsertOrder_(sheet, order))
      formatDataArea_(sheet)
      return json_({ ok: true, action: 'sync_all', count: body.orders.length })
    }

    if (body.action === 'upsert' && body.order) {
      upsertOrder_(sheet, body.order)
      formatDataArea_(sheet)
      return json_({ ok: true, action: 'upsert', publicId: body.order.publicId })
    }

    return json_({ ok: false, error: 'Unknown action' })
  } catch (error) {
    return json_({ ok: false, error: String(error) })
  }
}

function doGet() {
  return json_({ ok: true, service: 'iCL Order Sheet Sync' })
}

function getSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID)
}

function getOrCreateSheet_() {
  const ss = getSpreadsheet_()
  let sheet = ss.getSheetByName(SHEET_NAME)
  if (sheet) return sheet

  const legacy = ss.getSheetByName('Лист1')
  if (legacy && legacy.getLastRow() === 0) {
    legacy.setName(SHEET_NAME)
    return legacy
  }

  return ss.insertSheet(SHEET_NAME)
}

function ensureHeaders_(sheet) {
  sheet.getRange('A1:' + LAST_COL + '1').setValues([HEADER_ROW])
}

function styleHeader_(sheet) {
  const header = sheet.getRange('A1:' + LAST_COL + '1')
  header
    .setValues([HEADER_ROW])
    .setFontFamily('Arial')
    .setFontWeight('bold')
    .setFontSize(10)
    .setFontColor(COLORS.headerFg)
    .setBackground(COLORS.headerBg)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true)

  sheet.setRowHeight(1, 36)
  sheet.setFrozenRows(1)

  for (let i = 0; i < COL_WIDTHS.length; i++) {
    sheet.setColumnWidth(i + 1, COL_WIDTHS[i])
  }

  sheet.hideColumns(16, 2)
}

function applyFilter_(sheet) {
  const existing = sheet.getFilter()
  if (existing) existing.remove()
  const lastRow = Math.max(sheet.getLastRow(), 2)
  sheet.getRange(a1_(1, 'A', lastRow, LAST_COL)).createFilter()
}

function applyStatusRules_(sheet) {
  const statusRange = sheet.getRange('J2:J1000')
  const makeRule = (text, bg, fg) =>
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(text)
      .setBackground(bg)
      .setFontColor(fg)
      .setBold(true)
      .setRanges([statusRange])
      .build()

  sheet.setConditionalFormatRules([
    makeRule('Новая', COLORS.statusNew, COLORS.statusNewText),
    makeRule('В работе', COLORS.statusWork, COLORS.statusWorkText),
    makeRule('Выполнена', COLORS.statusDone, COLORS.statusDoneText),
    makeRule('Отменена', COLORS.statusCancel, COLORS.statusCancelText),
  ])
}

function formatDataArea_(sheet) {
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) return

  const range = sheet.getRange(a1_(2, 'A', lastRow, LAST_COL))
  range
    .setFontFamily('Arial')
    .setFontSize(10)
    .setVerticalAlignment('top')
    .setBorder(true, true, true, true, true, true, COLORS.border, SpreadsheetApp.BorderStyle.SOLID)

  for (let row = 2; row <= lastRow; row++) {
    sheet
      .getRange(a1_(row, 'A', row, LAST_COL))
      .setBackground(row % 2 === 0 ? COLORS.zebra : '#FFFFFF')
  }

  sheet.getRange(a1_(2, 'K', lastRow, 'M')).setWrap(true)
  sheet.getRange(a1_(2, 'H', lastRow, 'H')).setNumberFormat('0.##')
  sheet.getRange(a1_(2, 'A', lastRow, 'A')).setFontWeight('bold')
  sheet.getRange(a1_(2, 'J', lastRow, 'J')).setHorizontalAlignment('center')
  sheet.getRange(a1_(2, 'N', lastRow, 'N')).setHorizontalAlignment('center')
}

function buildHelpSheet_(ss) {
  let help = ss.getSheetByName(HELP_SHEET_NAME)
  if (!help) help = ss.insertSheet(HELP_SHEET_NAME)

  help.clear()
  help.setColumnWidth(1, 180)
  help.setColumnWidth(2, 420)

  help.getRange('A1:B1').merge()
  help
    .getRange('A1')
    .setValue('iCL — как читать таблицу заказов')
    .setFontFamily('Arial')
    .setFontSize(16)
    .setFontWeight('bold')
    .setFontColor(COLORS.headerFg)
    .setBackground(COLORS.headerBg)
    .setVerticalAlignment('middle')
  help.setRowHeight(1, 44)

  const rows = [
    ['', ''],
    ['Лист «Заказы»', 'Сюда автоматически попадают заявки с сайта.'],
    ['ID заявки', 'Публичный номер заказа — по нему ищем и общаемся с клиентом.'],
    ['Создан / Обновлён', 'Когда заявка пришла и когда последний раз менялась.'],
    ['Telegram', 'Контакт клиента для связи.'],
    ['Услуга / Платформа / Объём', 'Что заказали и в каком количестве.'],
    ['Сумма, $', 'Предварительная стоимость (число).'],
    ['Цена (подпись)', 'Как показали цену клиенту, например «120$ / мес».'],
    ['Статус', 'Новая → В работе → Выполнена (или Отменена).'],
    ['Описание', 'ТЗ от клиента.'],
    ['Референсы и стиль', 'Примеры и пожелания по стилю.'],
    ['Ссылки / Файлов', 'Материалы к заказу.'],
    ['Уведомление TG', 'Ушло ли оповещение администратору в Telegram.'],
    ['', ''],
    ['Цвета статусов', ''],
    ['Новая', 'Только поступила — нужно взять в работу.'],
    ['В работе', 'Сейчас делается.'],
    ['Выполнена', 'Готово, можно закрывать.'],
    ['Отменена', 'Заказ отменён.'],
    ['', ''],
    ['Важно', 'Не удаляйте строку шапки и не переименовывайте колонки — синхронизация сломается.'],
    ['Фильтр', 'Стрелки в шапке: фильтруйте по статусу, услуге, Telegram.'],
  ]

  const startRow = 2
  const endRow = startRow + rows.length - 1
  const block = help.getRange('A' + startRow + ':B' + endRow)
  block.setValues(rows)
  help.getRange('A' + startRow + ':A' + endRow).setFontWeight('bold').setFontFamily('Arial')
  help.getRange('B' + startRow + ':B' + endRow).setFontFamily('Arial').setWrap(true)

  const labels = block.getValues()
  for (let i = 0; i < labels.length; i++) {
    const label = String(labels[i][0])
    const cell = help.getRange('A' + (startRow + i))
    if (label === 'Новая') {
      cell.setBackground(COLORS.statusNew).setFontColor(COLORS.statusNewText)
    } else if (label === 'В работе') {
      cell.setBackground(COLORS.statusWork).setFontColor(COLORS.statusWorkText)
    } else if (label === 'Выполнена') {
      cell.setBackground(COLORS.statusDone).setFontColor(COLORS.statusDoneText)
    } else if (label === 'Отменена') {
      cell.setBackground(COLORS.statusCancel).setFontColor(COLORS.statusCancelText)
    }
  }

  help.getRange('A1').setNote('Служебный лист — можно читать, менять не обязательно.')
}

function cleanupLegacySheets_(ss) {
  const legacy = ss.getSheetByName('Лист1')
  if (legacy && legacy.getLastRow() === 0 && ss.getSheets().length > 1) {
    ss.deleteSheet(legacy)
  }
}

/** Ручной запуск: полное оформление */
function formatOrdersSheet() {
  const ss = getSpreadsheet_()
  const sheet = getOrCreateSheet_()

  ensureHeaders_(sheet)
  styleHeader_(sheet)
  applyFilter_(sheet)
  applyStatusRules_(sheet)
  formatDataArea_(sheet)
  buildHelpSheet_(ss)
  cleanupLegacySheets_(ss)

  ss.setActiveSheet(sheet)
  ss.moveActiveSheet(1)
}

function setupSheet() {
  formatOrdersSheet()
}

function findRowByPublicId_(sheet, publicId) {
  if (!publicId) return -1
  const last = sheet.getLastRow()
  if (last < 2) return -1
  const ids = sheet.getRange('A2:A' + last).getValues()
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === publicId) return i + 2
  }
  return -1
}

function orderToRow_(order) {
  return [
    order.publicId || '',
    order.createdAt || '',
    order.updatedAt || '',
    order.clientTelegram || '',
    order.serviceTitle || '',
    order.platform || '',
    order.quantityLabel || '',
    order.price == null || order.price === '' ? '' : order.price,
    order.priceLabel || '',
    order.statusLabel || order.status || '',
    order.description || '',
    order.referencesText || '',
    Array.isArray(order.links) ? order.links.join('\n') : order.links || '',
    order.filesCount == null ? '' : order.filesCount,
    order.telegramSent ? 'Да' : order.telegramError || 'Нет',
    order.id || '',
    order.userId || '',
  ]
}

function upsertOrder_(sheet, order) {
  const row = orderToRow_(order)
  const existing = findRowByPublicId_(sheet, String(order.publicId || ''))
  if (existing > 0) {
    sheet.getRange('A' + existing + ':' + LAST_COL + existing).setValues([row])
  } else {
    sheet.appendRow(row)
  }
}

function deleteByPublicId_(sheet, publicId) {
  const row = findRowByPublicId_(sheet, publicId)
  if (row > 0) sheet.deleteRow(row)
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  )
}
