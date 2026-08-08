/**
 * Read-only access to the existing customer-management spreadsheet.
 * This service never writes to that spreadsheet, per 要件定義書 3.3.
 */

function getCustomerSpreadsheet_() {
  if (!CONFIG.CUSTOMER_SPREADSHEET_ID) {
    throw new Error(
      'CUSTOMER_SPREADSHEET_ID is not set. Configure it in ' +
      'Project Settings > Script properties.'
    );
  }
  return SpreadsheetApp.openById(CONFIG.CUSTOMER_SPREADSHEET_ID);
}

function getCustomerSheet_() {
  var ss = getCustomerSpreadsheet_();
  var sheet = CONFIG.CUSTOMER_SHEET_NAME
    ? ss.getSheetByName(CONFIG.CUSTOMER_SHEET_NAME)
    : ss.getSheets()[0];
  if (!sheet) {
    throw new Error('Customer sheet "' + CONFIG.CUSTOMER_SHEET_NAME + '" was not found.');
  }
  return sheet;
}

function buildColumnMap_(headerRow) {
  var map = {};
  var normalizedHeaders = headerRow.map(function (h) {
    return String(h).trim();
  });
  Object.keys(CUSTOMER_COLUMN_ALIASES).forEach(function (field) {
    var aliases = CUSTOMER_COLUMN_ALIASES[field];
    for (var i = 0; i < normalizedHeaders.length; i++) {
      if (aliases.indexOf(normalizedHeaders[i]) !== -1) {
        map[field] = i;
        return;
      }
    }
  });
  return map;
}

function readCell_(row, colMap, field) {
  var idx = colMap[field];
  return idx === undefined ? '' : row[idx];
}

/**
 * Returns all customers from the master sheet, with their recurring
 * fiscal year-end month/day resolved. Rows missing a fiscal month/date,
 * or entirely blank, are skipped.
 */
function getCustomers() {
  var sheet = getCustomerSheet_();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var colMap = buildColumnMap_(data[0]);
  var missing = ['customerName'].filter(function (f) { return colMap[f] === undefined; });
  if (colMap.fiscalMonth === undefined && colMap.fiscalDate === undefined) {
    missing.push('fiscalMonth または fiscalDate');
  }
  if (missing.length) {
    throw new Error(
      '顧客シートに必要な列が見つかりません: ' + missing.join(', ') +
      '。CUSTOMER_COLUMN_ALIASES (Constants.gs) を実際の見出しに合わせて調整してください。'
    );
  }

  var today = startOfDay_(new Date());
  var customers = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var isBlank = row.every(function (cell) { return cell === '' || cell === null; });
    if (isBlank) continue;

    var customerName = String(readCell_(row, colMap, 'customerName') || '').trim();
    if (!customerName) continue;

    var fiscalDateRaw = readCell_(row, colMap, 'fiscalDate');
    var fiscalMonthRaw = readCell_(row, colMap, 'fiscalMonth');

    var monthDay = resolveFiscalMonthDay_(fiscalDateRaw, fiscalMonthRaw, today);
    if (!monthDay) continue;

    customers.push({
      id: 'row' + (i + 1),
      rowIndex: i + 1,
      customerName: customerName,
      staff: String(readCell_(row, colMap, 'staff') || '').trim(),
      fiscalMonth: monthDay.month,
      fiscalDay: monthDay.day
    });
  }

  return customers;
}

/**
 * Resolves the fiscal year-end month/day to use for scheduling. Prefers
 * an explicit 決算日 value; falls back to the last day of 決算月 when
 * only the month is given. Kept independent of any particular calendar
 * year so callers can place it in whichever year they need (the nearest
 * upcoming occurrence for task generation, or a specific year for the
 * annual calendar view).
 */
function resolveFiscalMonthDay_(fiscalDateRaw, fiscalMonthRaw, today) {
  var explicitDate = normalizeDate_(fiscalDateRaw);
  if (explicitDate) {
    return { month: explicitDate.getMonth() + 1, day: explicitDate.getDate() };
  }

  var monthNum = parseInt(fiscalMonthRaw, 10);
  if (!monthNum || monthNum < 1 || monthNum > 12) return null;
  return { month: monthNum, day: new Date(today.getFullYear(), monthNum, 0).getDate() };
}
