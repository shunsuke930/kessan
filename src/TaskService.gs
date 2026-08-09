/**
 * The task list now lives directly on a spreadsheet tab (CONFIG.TASKS_SHEET_NAME)
 * that staff read and edit by hand - there is no separate web app UI. This
 * file only (a) keeps that sheet's rows in sync with which customers match
 * this month's TASK_RULES (Constants.gs), and (b) sets up the sheet's
 * display (data validation dropdown, conditional-format coloring, hidden
 * helper columns) so it reads like a purpose-built tool rather than a raw
 * data dump. Progress/comments are edited straight in the sheet cells;
 * onEdit (Menu.gs) stamps 更新日時 automatically when they change.
 */

// Internal field name -> the Japanese column header actually written to
// row 1. Field order here is also the sheet's left-to-right column order.
// customerId/taskKey/updatedAt are bookkeeping columns hidden from view
// (see setupSheetFormatting_) - kept as real columns (not a side table)
// so a single row is still the unit of truth for dedup/edit lookups.
var TASK_FIELDS = [
  'targetMonth', 'taskName', 'customerName', 'fiscalInstanceDate', 'staff',
  'progressStatus', 'notes', 'customerId', 'taskKey', 'updatedAt'
];
var TASK_HEADER_LABELS = {
  targetMonth: '対象月',
  taskName: 'タスク',
  customerName: 'クライアント名',
  fiscalInstanceDate: '決算期',
  staff: '担当者',
  progressStatus: 'ステータス',
  notes: 'コメント',
  customerId: '(内部用) customerId',
  taskKey: '(内部用) taskKey',
  updatedAt: '更新日時'
};

// How many rows to keep data validation / conditional formatting applied
// to ahead of time, so new rows appended by future syncs are already
// covered without re-running setupSheetFormatting_ every time.
var TASK_SHEET_PROVISIONED_ROWS = 2000;

function getTasksSpreadsheet_() {
  var id = CONFIG.TASKS_SPREADSHEET_ID || CONFIG.CUSTOMER_SPREADSHEET_ID;
  if (id) return SpreadsheetApp.openById(id);
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error(
    'TASKS_SPREADSHEET_ID (または CUSTOMER_SPREADSHEET_ID) が未設定で、' +
    'このスクリプトが紐づくスプレッドシートも見つかりません。'
  );
}

function getTasksSheet_() {
  var ss = getTasksSpreadsheet_();
  var sheet = ss.getSheetByName(CONFIG.TASKS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.TASKS_SHEET_NAME);
    writeTaskHeaderRow_(sheet);
  }
  return sheet;
}

function writeTaskHeaderRow_(sheet) {
  var labels = TASK_FIELDS.map(function (f) { return TASK_HEADER_LABELS[f]; });
  sheet.getRange(1, 1, 1, labels.length).setValues([labels]);
  sheet.setFrozenRows(1);
}

/**
 * Maps field name -> column index by matching this sheet's actual header
 * row text against TASK_HEADER_LABELS, rather than assuming a fixed
 * column order - so a header row from an older layout with columns in a
 * different order still resolves correctly.
 */
function buildHeaderIndex_(headerRow) {
  var idx = {};
  TASK_FIELDS.forEach(function (field) {
    var col = headerRow.indexOf(TASK_HEADER_LABELS[field]);
    if (col !== -1) idx[field] = col;
  });
  return idx;
}

function getHeaderIndex_(sheet) {
  return buildHeaderIndex_(sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]);
}

function taskRowToObject_(row, colIndex) {
  var obj = {};
  TASK_FIELDS.forEach(function (f) {
    obj[f] = row[colIndex[f]];
  });
  obj.targetMonth = normalizeDate_(obj.targetMonth);
  obj.fiscalInstanceDate = normalizeDate_(obj.fiscalInstanceDate);
  return obj;
}

/**
 * Reads every task row currently stored, keyed by sheet row number so
 * individual rows can be updated later without a full rewrite.
 */
function getAllTaskRecords_() {
  var sheet = getTasksSheet_();
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length < 2) return [];

  var colIndex = buildHeaderIndex_(values[0]);
  var records = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row.every(function (c) { return c === '' || c === null; })) continue;
    var record = taskRowToObject_(row, colIndex);
    record.sheetRow = i + 1;
    records.push(record);
  }
  return records;
}

/**
 * For a given month, finds every (customer, rule) pair whose 決算日 lines
 * up with that rule's monthOffsets - e.g. 申告・納税 (monthOffsets
 * [-1, -2]) matches customers whose fiscal year-end month is 1 or 2
 * months before the target month. `fiscalInstanceDate` is the concrete
 * 決算日 for the matching cycle (shown as-is in the 決算期 column).
 */
function getMonthlyMatches_(customers, targetMonthDate) {
  var matches = [];
  TASK_RULES.forEach(function (rule) {
    var candidates = rule.monthOffsets.map(function (offset) {
      var d = addMonths_(targetMonthDate, offset);
      return { month: d.getMonth() + 1, year: d.getFullYear() };
    });

    customers.forEach(function (customer) {
      var candidate = candidates.filter(function (c) { return c.month === customer.fiscalMonth; })[0];
      if (!candidate) return;
      matches.push({
        customer: customer,
        rule: rule,
        fiscalInstanceDate: fiscalDateInYear_(customer.fiscalMonth, customer.fiscalDay, candidate.year)
      });
    });
  });
  return matches;
}

// Deliberately compares by year/month only, not monthDate.getTime() - a
// value read back from a sheet cell can differ by hours from the value
// that was written (see asSheetDate_ in DateUtils.gs), and this key is
// what ensureMonthlyTasks_ uses to decide "does this row already exist",
// so it must stay stable regardless of exact time-of-day.
function monthKey_(monthDate) {
  return monthDate.getFullYear() * 12 + monthDate.getMonth();
}

function currentMonthStart_() {
  var today = startOfDay_(new Date());
  return startOfDay_(new Date(today.getFullYear(), today.getMonth(), 1));
}

/**
 * Ensures a stored row exists for every matched (customer, rule) pair in
 * this target month. Idempotent - already-existing rows (matched by
 * customerId + taskKey + targetMonth) are left untouched, so re-running
 * this never duplicates or overwrites progress/comments already entered.
 * Returns the number of rows created.
 */
function ensureMonthlyTasks_(matches, targetMonthDate, existingRecords) {
  var existingKeys = {};
  existingRecords.forEach(function (r) {
    if (!r.targetMonth) return;
    existingKeys[r.customerId + '|' + r.taskKey + '|' + monthKey_(r.targetMonth)] = true;
  });

  var sheet = getTasksSheet_();
  var colIndex = getHeaderIndex_(sheet);
  var now = new Date();
  var newRows = [];
  var targetKey = monthKey_(targetMonthDate);

  matches.forEach(function (m) {
    var key = m.customer.id + '|' + m.rule.key + '|' + targetKey;
    if (existingKeys[key]) return;
    existingKeys[key] = true;

    var row = new Array(TASK_FIELDS.length);
    row[colIndex.targetMonth] = asSheetDate_(targetMonthDate);
    row[colIndex.taskName] = m.rule.name;
    row[colIndex.customerName] = m.customer.customerName;
    row[colIndex.fiscalInstanceDate] = asSheetDate_(m.fiscalInstanceDate);
    row[colIndex.staff] = m.customer.staff;
    row[colIndex.progressStatus] = '未着手';
    row[colIndex.notes] = '';
    row[colIndex.customerId] = m.customer.id;
    row[colIndex.taskKey] = m.rule.key;
    row[colIndex.updatedAt] = now;
    newRows.push(row);
  });

  if (newRows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, TASK_FIELDS.length).setValues(newRows);
  }
  return newRows.length;
}

/**
 * Re-sorts the data rows so the current/most-recent 対象月 floats to the
 * top (older months sink down but are never deleted), then by タスク and
 * クライアント名. Keeps "what matters right now" visible without
 * scrolling, without needing a separate filtered view sheet to keep in
 * sync.
 */
function sortByRecency_() {
  var sheet = getTasksSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 3) return;

  var colIndex = getHeaderIndex_(sheet);
  sheet.getRange(2, 1, lastRow - 1, TASK_FIELDS.length).sort([
    { column: colIndex.targetMonth + 1, ascending: false },
    { column: colIndex.taskName + 1, ascending: true },
    { column: colIndex.customerName + 1, ascending: true }
  ]);
}

/**
 * The main entry point: makes sure this month's task rows exist, then
 * re-sorts. Safe to call repeatedly (e.g. from the menu, or a monthly
 * time trigger) - existing rows/progress are never touched.
 */
function syncMonth_(targetMonthDate) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var customers = getCustomers();
    var matches = getMonthlyMatches_(customers, targetMonthDate);
    var existingRecords = getAllTaskRecords_();
    var createdCount = ensureMonthlyTasks_(matches, targetMonthDate, existingRecords);
    sortByRecency_();
    return { matchCount: matches.length, createdCount: createdCount };
  } finally {
    lock.releaseLock();
  }
}

function syncCurrentMonth() {
  return syncMonth_(currentMonthStart_());
}

/**
 * Removes duplicate task rows (same customerId + taskKey + targetMonth),
 * keeping the first occurrence of each and deleting the rest. Unlike
 * `resetAllTasks`, this preserves recorded progress/comments on the row
 * that's kept - use this when duplicates have appeared but you don't want
 * to lose existing data. Returns the number of rows removed.
 */
function deduplicateTasks() {
  var sheet = getTasksSheet_();
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return { removed: 0 };

  var colIndex = buildHeaderIndex_(values[0]);
  var seen = {};
  var rowsToDelete = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row.every(function (c) { return c === '' || c === null; })) continue;

    var targetMonthRaw = row[colIndex.targetMonth];
    var monthKey = targetMonthRaw instanceof Date ? targetMonthRaw.getTime() : targetMonthRaw;
    var key = row[colIndex.customerId] + '|' + row[colIndex.taskKey] + '|' + monthKey;

    if (Object.prototype.hasOwnProperty.call(seen, key)) {
      rowsToDelete.push(i + 1);
    } else {
      seen[key] = true;
    }
  }

  rowsToDelete.sort(function (a, b) { return b - a; });
  rowsToDelete.forEach(function (sheetRow) { sheet.deleteRow(sheetRow); });

  return { removed: rowsToDelete.length };
}

/**
 * Clears every stored task row and rewrites the header row, for use
 * after a TASK_FIELDS/TASK_RULES change makes the existing sheet layout
 * stale. Re-applies the display setup afterward. Discards all recorded
 * progress/comments - intentionally only reachable via the menu's
 * confirmation dialog (Menu.gs), never automatically.
 */
function resetAllTasks() {
  var sheet = getTasksSheet_();
  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), TASK_FIELDS.length);
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
  writeTaskHeaderRow_(sheet);
  var extraCols = lastCol - TASK_FIELDS.length;
  if (extraCols > 0) {
    sheet.getRange(1, TASK_FIELDS.length + 1, 1, extraCols).clearContent();
  }
  setupSheetFormatting_();
}

function columnToLetter_(col) {
  var letter = '';
  while (col > 0) {
    var rem = (col - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

/**
 * Configures the sheet so it reads like a purpose-built tool: a
 * dropdown for ステータス, date-only formatting for 対象月/決算期, row
 * coloring (grey = 完了 only - no overdue/red highlight), the internal
 * bookkeeping columns hidden, and a plain column filter on the header
 * row. Safe to re-run any time (e.g. after adding rows beyond the
 * previously-provisioned range) - every step just reapplies the same
 * rule to a fixed row range. Also (re)builds the 抽出ルールの説明 sheet.
 */
function setupSheetFormatting_() {
  var sheet = getTasksSheet_();
  if (sheet.getMaxRows() < TASK_SHEET_PROVISIONED_ROWS) {
    sheet.insertRowsAfter(sheet.getMaxRows(), TASK_SHEET_PROVISIONED_ROWS - sheet.getMaxRows());
  }
  var colIndex = getHeaderIndex_(sheet);
  var dataRowCount = sheet.getMaxRows() - 1;

  var statusRange = sheet.getRange(2, colIndex.progressStatus + 1, dataRowCount, 1);
  statusRange.setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(TASK_STATUS_VALUES, true).setAllowInvalid(false).build()
  );

  sheet.getRange(2, colIndex.targetMonth + 1, dataRowCount, 1).setNumberFormat('yyyy"年"m"月"');
  sheet.getRange(2, colIndex.fiscalInstanceDate + 1, dataRowCount, 1).setNumberFormat('yyyy"年"m"月期"');

  var fullRowRange = sheet.getRange(2, 1, dataRowCount, TASK_FIELDS.length);
  var statusLetter = columnToLetter_(colIndex.progressStatus + 1);

  var doneRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$' + statusLetter + '2="完了"')
    .setBackground('#c9c9c9')
    .setFontColor('#595959')
    .setRanges([fullRowRange])
    .build();
  sheet.setConditionalFormatRules([doneRule]);

  ['customerId', 'taskKey', 'updatedAt'].forEach(function (field) {
    if (colIndex[field] !== undefined) sheet.hideColumns(colIndex[field] + 1);
  });

  var existingFilter = sheet.getFilter();
  if (existingFilter) existingFilter.remove();
  sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 2), TASK_FIELDS.length).createFilter();

  sheet.setFrozenRows(1);

  writeRulesLegend_();
}

var RULES_LEGEND_SHEET_NAME = '抽出ルールの説明';

/**
 * Writes/refreshes a small reference sheet listing each TASK_RULES entry
 * and a plain-Japanese description of when it's extracted, so anyone
 * looking at 案件タスク can find out why a company showed up without
 * reading the code. Regenerated from TASK_RULES every time this runs, so
 * it can't go stale after a rule change (as long as `description` is
 * kept in sync by hand in Constants.gs).
 */
function writeRulesLegend_() {
  var ss = getTasksSpreadsheet_();
  var sheet = ss.getSheetByName(RULES_LEGEND_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(RULES_LEGEND_SHEET_NAME);
  sheet.clear();
  if (sheet.getFilter()) sheet.getFilter().remove();

  var header = ['タスク', '表示される条件'];
  var rows = TASK_RULES.map(function (rule) { return [rule.name, rule.description || '']; });
  var values = [header].concat(rows);

  var range = sheet.getRange(1, 1, values.length, 2);
  range.setValues(values);
  range.setBorder(true, true, true, true, true, true);
  sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#f2f3f5');
  sheet.setColumnWidth(1, 140);
  sheet.setColumnWidth(2, 420);
  sheet.getRange(2, 2, rows.length, 1).setWrap(true);
  sheet.setFrozenRows(1);
}
