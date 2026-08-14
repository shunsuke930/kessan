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

// Deliberately reads only the first TASK_FIELDS.length columns, not
// sheet.getLastColumn() - the 抽出ルールの説明 legend block now lives in
// this same sheet, off to the right (see RULES_LEGEND_START_COLUMN), and
// its own header row also says "タスク" in column 1 of ITS block; reading
// the whole row width risks matching that instead of the real header.
function getHeaderIndex_(sheet) {
  return buildHeaderIndex_(sheet.getRange(1, 1, 1, TASK_FIELDS.length).getValues()[0]);
}

/**
 * The last row containing actual task data, scanning ONLY the task
 * columns (1..TASK_FIELDS.length) - never sheet.getLastRow(), which
 * reflects the whole sheet width and would be thrown off by the 抽出
 * ルールの説明 legend block sitting in far-right columns of a few
 * near-the-top rows that otherwise have no task data of their own.
 */
function getTaskDataLastRow_(sheet) {
  var upperBound = sheet.getLastRow();
  if (upperBound < 1) return 0;
  var values = sheet.getRange(1, 1, upperBound, TASK_FIELDS.length).getValues();
  for (var r = values.length - 1; r >= 0; r--) {
    if (values[r].some(function (c) { return c !== '' && c !== null; })) return r + 1;
  }
  return 0;
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
  var lastRow = getTaskDataLastRow_(sheet);
  if (lastRow < 2) return [];

  var values = sheet.getRange(1, 1, lastRow, TASK_FIELDS.length).getValues();
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
 *
 * A `fixedMonth` rule (e.g. 年末調整) isn't tied to any customer at all -
 * it produces exactly one customer-less match when the target month
 * equals that fixed month, once a year.
 *
 * `rules` is the effective rule set for this run (see loadTaskRules_),
 * not necessarily the raw TASK_RULES constant - the numbers can be
 * overridden per-deployment via the 抽出ルールの説明 sheet.
 */
function getMonthlyMatches_(customers, targetMonthDate, rules) {
  var matches = [];
  rules.forEach(function (rule) {
    if (rule.fixedMonth) {
      if (targetMonthDate.getMonth() + 1 === rule.fixedMonth) {
        matches.push({ customer: null, rule: rule, fiscalInstanceDate: null });
      }
      return;
    }

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

var RULES_LEGEND_HEADERS = [
  'タスク', '表示される条件',
  '月（決算日より前ならプラス、後ろならマイナス。複数はカンマ区切り）',
  '固定月（クライアントに紐づかないタスクのみ。1〜12で指定）'
];

// Column the 抽出ルールの説明 block starts at, within 案件タスク itself
// (not a separate sheet) - a couple of columns to the right of the task
// data (TASK_FIELDS.length) so it reads as a clearly separate box when
// scrolling right, matching how it was originally sketched out.
var RULES_LEGEND_START_COLUMN = TASK_FIELDS.length + 2;
var RULES_LEGEND_MAX_ROWS = 30; // generous fixed block size; TASK_RULES is short

/**
 * Builds the effective rule set for a sync: starts from TASK_RULES
 * (Constants.gs) for the key/name/description of every known task type,
 * then overrides monthOffsets/fixedMonth with whatever is currently
 * written in the 抽出ルールの説明 block's 月/固定月 columns (in 案件タスク,
 * see RULES_LEGEND_START_COLUMN), so staff can tune "何ヶ月前か" without
 * touching code. Falls back to the Constants.gs default whenever a cell
 * is blank/unparseable or the block hasn't been written yet (e.g. before
 * the first "シートの表示設定を初期化").
 */
function loadTaskRules_() {
  var sheet = getTasksSheet_();
  var overridesByName = {};
  var values = sheet.getRange(2, RULES_LEGEND_START_COLUMN, RULES_LEGEND_MAX_ROWS, 4).getValues();
  values.forEach(function (row) {
    if (!row[0]) return;
    overridesByName[row[0]] = { monthOffsets: parseMonthOffsets_(row[2]), fixedMonth: parseFixedMonth_(row[3]) };
  });

  return TASK_RULES.map(function (rule) {
    var override = overridesByName[rule.name];
    var effective = { key: rule.key, name: rule.name };

    if (override && override.fixedMonth) {
      effective.fixedMonth = override.fixedMonth;
    } else if (override && override.monthOffsets) {
      effective.monthOffsets = override.monthOffsets;
    } else if (rule.fixedMonth) {
      effective.fixedMonth = rule.fixedMonth;
    } else {
      effective.monthOffsets = rule.monthOffsets;
    }
    effective.description = describeRule_(effective.monthOffsets, effective.fixedMonth);
    return effective;
  });
}

/**
 * Plain-Japanese description of a rule's actual, currently-effective
 * numbers (not the Constants.gs default) - used both for the legend
 * sheet's "表示される条件" column and loadTaskRules_'s in-memory rule
 * objects, so the wording can never say something different from what
 * the numbers actually do.
 */
function describeRule_(monthOffsets, fixedMonth) {
  if (fixedMonth) {
    return 'クライアント名はなし。毎年' + fixedMonth + '月に自動で1件だけ表示';
  }
  var parts = (monthOffsets || []).map(function (offset) {
    if (offset > 0) return offset + 'ヶ月前';
    if (offset < 0) return Math.abs(offset) + 'ヶ月後';
    return '決算月';
  });
  if (!parts.length) return '';
  return '決算日の' + parts.join('・') + 'になった月に表示';
}

function parseMonthOffsets_(cellValue) {
  if (cellValue === '' || cellValue === null || cellValue === undefined) return null;
  var parts = String(cellValue).split(',')
    .map(function (s) { return parseInt(s.trim(), 10); })
    .filter(function (n) { return !isNaN(n); });
  return parts.length ? parts : null;
}

function parseFixedMonth_(cellValue) {
  var n = parseInt(cellValue, 10);
  return (!isNaN(n) && n >= 1 && n <= 12) ? n : null;
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
    // Firm-wide rules (m.customer === null, e.g. 年末調整) aren't tied to
    // any customer row, so they use a fixed placeholder id instead - at
    // most one such row can ever exist per rule per target month anyway,
    // since the rule only matches once a year.
    var customerId = m.customer ? m.customer.id : 'firm:' + m.rule.key;
    var key = customerId + '|' + m.rule.key + '|' + targetKey;
    if (existingKeys[key]) return;
    existingKeys[key] = true;

    var row = new Array(TASK_FIELDS.length);
    row[colIndex.targetMonth] = asSheetDate_(targetMonthDate);
    row[colIndex.taskName] = m.rule.name;
    row[colIndex.customerName] = m.customer ? m.customer.customerName : '';
    row[colIndex.fiscalInstanceDate] = m.fiscalInstanceDate ? asSheetDate_(m.fiscalInstanceDate) : '';
    row[colIndex.staff] = m.customer ? m.customer.staff : '';
    row[colIndex.progressStatus] = '未着手';
    row[colIndex.notes] = '';
    row[colIndex.customerId] = customerId;
    row[colIndex.taskKey] = m.rule.key;
    row[colIndex.updatedAt] = now;
    newRows.push(row);
  });

  if (newRows.length) {
    sheet.getRange(getTaskDataLastRow_(sheet) + 1, 1, newRows.length, TASK_FIELDS.length).setValues(newRows);
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
  var lastRow = getTaskDataLastRow_(sheet);
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
    var rules = loadTaskRules_();
    var customers = getCustomers();
    var matches = getMonthlyMatches_(customers, targetMonthDate, rules);
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
  var lastRow = getTaskDataLastRow_(sheet);
  if (lastRow < 2) return { removed: 0 };
  var values = sheet.getRange(1, 1, lastRow, TASK_FIELDS.length).getValues();

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
 * Clears every stored task row (columns 1..TASK_FIELDS.length only -
 * never touches the 抽出ルールの説明 legend block further right, so a
 * reset never discards a tuned 月/固定月 value) and rewrites the header
 * row. Re-applies the display setup afterward. Discards all recorded
 * progress/comments - intentionally only reachable via the menu's
 * confirmation dialog (Menu.gs), never automatically.
 */
function resetAllTasks() {
  var sheet = getTasksSheet_();
  var lastRow = getTaskDataLastRow_(sheet);
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, TASK_FIELDS.length).clearContent();
  }
  writeTaskHeaderRow_(sheet);
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
  sheet.getRange(1, 1, Math.max(getTaskDataLastRow_(sheet), 2), TASK_FIELDS.length).createFilter();

  sheet.setFrozenRows(1);

  writeRulesLegend_();
}

// Name of an older layout's separate legend tab - writeRulesLegend_
// migrates any values still sitting there into the new in-sheet block
// (see below) the first time it runs, then deletes it, so upgrading
// from that version doesn't lose a tuned 月/固定月 value.
var LEGACY_RULES_LEGEND_SHEET_NAME = '抽出ルールの説明';

/**
 * Writes/refreshes the 抽出ルールの説明 reference block directly in
 * 案件タスク (columns starting at RULES_LEGEND_START_COLUMN, to the
 * right of the task data) - not a separate sheet, so it stays visible
 * right alongside the task list when scrolling right. Lists each
 * TASK_RULES entry, the actual 月/固定月 numbers driving it (editable -
 * see loadTaskRules_, which reads these two columns back on every
 * sync), and a "表示される条件" description generated from those SAME
 * effective numbers (describeRule_), so editing 月/固定月 and re-running
 * this (e.g. via "シートの表示設定を初期化") updates the description to
 * match instead of leaving stale wording behind. タスク name is always
 * reset to match Constants.gs; the 月/固定月 columns preserve whatever
 * staff last typed there - this only fills in the Constants.gs default
 * the first time a task type appears (first run, or a newly-added
 * rule), so re-running this never clobbers a tuned value.
 */
function writeRulesLegend_() {
  var sheet = getTasksSheet_();
  var startCol = RULES_LEGEND_START_COLUMN;
  var existingOverrides = {};

  sheet.getRange(2, startCol, RULES_LEGEND_MAX_ROWS, 4).getValues().forEach(function (row) {
    if (row[0]) existingOverrides[row[0]] = { monthOffsets: row[2], fixedMonth: row[3] };
  });

  // One-time migration from the older separate-tab layout, if present.
  var ss = getTasksSpreadsheet_();
  var legacySheet = ss.getSheetByName(LEGACY_RULES_LEGEND_SHEET_NAME);
  if (legacySheet) {
    if (Object.keys(existingOverrides).length === 0 && legacySheet.getLastRow() > 1) {
      legacySheet.getRange(2, 1, legacySheet.getLastRow() - 1, 4).getValues().forEach(function (row) {
        if (row[0] && !existingOverrides[row[0]]) existingOverrides[row[0]] = { monthOffsets: row[2], fixedMonth: row[3] };
      });
    }
    ss.deleteSheet(legacySheet);
  }

  sheet.getRange(1, startCol, RULES_LEGEND_MAX_ROWS, RULES_LEGEND_HEADERS.length).clearContent().clearFormat();

  var rows = TASK_RULES.map(function (rule) {
    var existing = existingOverrides[rule.name];
    var effectiveFixedMonth = (existing && parseFixedMonth_(existing.fixedMonth)) || rule.fixedMonth || null;
    var effectiveOffsets = !effectiveFixedMonth
      ? ((existing && parseMonthOffsets_(existing.monthOffsets)) || rule.monthOffsets || null)
      : null;

    var monthOffsetsCell = effectiveFixedMonth ? '' : (effectiveOffsets ? effectiveOffsets.join(',') : '');
    var fixedMonthCell = effectiveFixedMonth || '';
    var description = describeRule_(effectiveOffsets, effectiveFixedMonth);
    return [rule.name, description, monthOffsetsCell, fixedMonthCell];
  });
  var values = [RULES_LEGEND_HEADERS].concat(rows);

  var range = sheet.getRange(1, startCol, values.length, RULES_LEGEND_HEADERS.length);
  range.setValues(values);
  range.setBorder(true, true, true, true, true, true);
  sheet.getRange(1, startCol, 1, RULES_LEGEND_HEADERS.length).setFontWeight('bold').setBackground('#f2f3f5');
  sheet.setColumnWidth(startCol, 140);
  sheet.setColumnWidth(startCol + 1, 340);
  sheet.setColumnWidth(startCol + 2, 260);
  sheet.setColumnWidth(startCol + 3, 200);
  sheet.getRange(2, startCol + 1, rows.length, 1).setWrap(true);
}
