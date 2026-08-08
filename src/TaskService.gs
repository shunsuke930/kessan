/**
 * The app's own data store for tasks/progress (要件定義書 3.3, 3.4).
 * Lives on a dedicated sheet (CONFIG.TASKS_SHEET_NAME) so the existing
 * customer-master sheet is never written to.
 */

var TASK_HEADERS = [
  'taskId', 'customerId', 'customerName', 'fiscalEndDate', 'taskKey',
  'phase', 'taskName', 'order', 'plannedStart', 'plannedEnd', 'progressStatus',
  'manualOverride', 'notes', 'updatedAt'
];

function getTasksSpreadsheet_() {
  var id = CONFIG.TASKS_SPREADSHEET_ID || CONFIG.CUSTOMER_SPREADSHEET_ID;
  if (!id) {
    throw new Error('TASKS_SPREADSHEET_ID (or CUSTOMER_SPREADSHEET_ID) is not set.');
  }
  return SpreadsheetApp.openById(id);
}

function getTasksSheet_() {
  var ss = getTasksSpreadsheet_();
  var sheet = ss.getSheetByName(CONFIG.TASKS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.TASKS_SHEET_NAME);
    sheet.appendRow(TASK_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function taskRowToObject_(row, colIndex) {
  var obj = {};
  TASK_HEADERS.forEach(function (h) {
    obj[h] = row[colIndex[h]];
  });
  obj.plannedStart = normalizeDate_(obj.plannedStart);
  obj.plannedEnd = normalizeDate_(obj.plannedEnd);
  obj.fiscalEndDate = normalizeDate_(obj.fiscalEndDate);
  return obj;
}

function buildHeaderIndex_(headers) {
  var idx = {};
  headers.forEach(function (h, i) { idx[h] = i; });
  return idx;
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
 * Ensures the given customer has a full set of tasks generated from the
 * template for their current fiscal-year-end cycle. Idempotent: if tasks
 * already exist for this customer + fiscal end date, nothing is created.
 * Returns true if new tasks were generated.
 */
function ensureTasksForCustomer_(customer, existingRecords) {
  var already = existingRecords.some(function (r) {
    return r.customerId === customer.id &&
      r.fiscalEndDate && customer.fiscalEndDate &&
      r.fiscalEndDate.getTime() === customer.fiscalEndDate.getTime();
  });
  if (already) return false;

  var sheet = getTasksSheet_();
  var now = new Date();
  var rows = TASK_TEMPLATE.map(function (tpl) {
    var window = PHASE_DATE_WINDOWS[tpl.phase];
    return [
      Utilities.getUuid(),
      customer.id,
      customer.customerName,
      customer.fiscalEndDate,
      tpl.key,
      tpl.phase,
      tpl.name,
      TASK_TEMPLATE.indexOf(tpl),
      addMonths_(customer.fiscalEndDate, window.startMonths),
      addMonths_(customer.fiscalEndDate, window.endMonths),
      '未着手',
      '',
      '',
      now
    ];
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, TASK_HEADERS.length).setValues(rows);
  return true;
}

/**
 * Generates tasks for every customer that doesn't have a set yet for
 * their current fiscal cycle. Safe to run repeatedly (e.g. on a daily
 * trigger, or manually from the dashboard's "sync" action).
 *
 * This is a shared web app (~10 staff, everyone can trigger 同期), so a
 * script lock serializes concurrent calls: ensureTasksForCustomer_'s
 * idempotency check reads existingRecords once up front, and without a
 * lock, two syncs starting close together (a double-click, or two people
 * clicking around the same time) can both read "not generated yet" before
 * either has written, each appending a full set of tasks - duplicating
 * every task for every affected customer.
 */
function syncTasksFromCustomers() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var customers = getCustomers();
    var existingRecords = getAllTaskRecords_();
    var generatedCount = 0;

    customers.forEach(function (customer) {
      if (ensureTasksForCustomer_(customer, existingRecords)) generatedCount++;
    });

    return {
      customerCount: customers.length,
      generatedCount: generatedCount
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Removes duplicate task rows (same customerId + fiscalEndDate + taskKey),
 * keeping the first occurrence of each and deleting the rest. Unlike
 * `resetAllTasks`, this preserves recorded progress/comments on the row
 * that's kept - use this when duplicates have appeared (e.g. from a sync
 * race before the LockService fix) but you don't want to lose existing
 * data. Run manually once from the Apps Script editor's function picker.
 * Returns the number of rows removed.
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

    var fiscalEndRaw = row[colIndex.fiscalEndDate];
    var fiscalKey = fiscalEndRaw instanceof Date ? fiscalEndRaw.getTime() : fiscalEndRaw;
    var key = row[colIndex.customerId] + '|' + fiscalKey + '|' + row[colIndex.taskKey];

    if (Object.prototype.hasOwnProperty.call(seen, key)) {
      rowsToDelete.push(i + 1); // 1-based sheet row number
    } else {
      seen[key] = true;
    }
  }

  // Delete bottom-to-top so earlier indices stay valid as rows shift up.
  rowsToDelete.sort(function (a, b) { return b - a; });
  rowsToDelete.forEach(function (sheetRow) { sheet.deleteRow(sheetRow); });

  return { removed: rowsToDelete.length };
}

/**
 * Clears every stored task row and rewrites the header row to match the
 * current TASK_HEADERS. `ensureTasksForCustomer_` is idempotent per
 * customer + fiscal cycle, so it will never regenerate tasks for a cycle
 * that already has rows - meaning a TASK_TEMPLATE change has no effect on
 * cycles synced under the old template until those rows are cleared. Run
 * this manually once from the Apps Script editor's function picker after
 * changing TASK_TEMPLATE, then re-run "スプレッドシートと同期" from the
 * dashboard. Intentionally not exposed to the web app UI, since it
 * discards all progress/comments recorded so far.
 *
 * Rewriting the header row (not just clearing data rows) means a
 * TASK_HEADERS change (e.g. a new column) is picked up automatically the
 * next time this runs, instead of silently leaving an old sheet with a
 * stale header that no longer matches the code.
 */
function resetAllTasks() {
  var sheet = getTasksSheet_();
  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), TASK_HEADERS.length);
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
  sheet.getRange(1, 1, 1, TASK_HEADERS.length).setValues([TASK_HEADERS]);
  var extraCols = lastCol - TASK_HEADERS.length;
  if (extraCols > 0) {
    sheet.getRange(1, TASK_HEADERS.length + 1, 1, extraCols).clearContent();
  }
}

/**
 * Updates editable fields on a single task row (要件定義書 3.2: generated
 * tasks can be individually adjusted). `updates` may include taskName,
 * plannedStart, plannedEnd, progressStatus, manualOverride, notes.
 */
function updateTask(taskId, updates) {
  var sheet = getTasksSheet_();
  var values = sheet.getDataRange().getValues();
  var colIndex = buildHeaderIndex_(values[0]);

  for (var i = 1; i < values.length; i++) {
    if (values[i][colIndex.taskId] !== taskId) continue;

    var editableFields = ['taskName', 'plannedStart', 'plannedEnd', 'progressStatus', 'manualOverride', 'notes'];
    editableFields.forEach(function (field) {
      if (!Object.prototype.hasOwnProperty.call(updates, field)) return;
      var value = updates[field];
      if ((field === 'plannedStart' || field === 'plannedEnd') && value) {
        value = normalizeDate_(value);
      }
      sheet.getRange(i + 1, colIndex[field] + 1).setValue(value);
    });
    sheet.getRange(i + 1, colIndex.updatedAt + 1).setValue(new Date());

    return { success: true, taskId: taskId };
  }

  throw new Error('Task not found: ' + taskId);
}

/**
 * Same as updateTask, but applies a whole batch of {taskId, updates} items
 * in a single read + single write of the sheet's data range, instead of
 * one read/write pair per task. Used by the dashboard's debounced
 * inline-edit queue so a burst of status/comment edits (possibly across
 * several rows) becomes one round trip instead of many, avoiding a
 * disruptive loading state per keystroke/change.
 */
function updateTasksBatch_(updatesList) {
  var sheet = getTasksSheet_();
  var range = sheet.getDataRange();
  var values = range.getValues();
  var colIndex = buildHeaderIndex_(values[0]);
  var editableFields = ['taskName', 'plannedStart', 'plannedEnd', 'progressStatus', 'manualOverride', 'notes'];

  var byTaskId = {};
  updatesList.forEach(function (item) { byTaskId[item.taskId] = item.updates; });

  for (var i = 1; i < values.length; i++) {
    var taskId = values[i][colIndex.taskId];
    var updates = byTaskId[taskId];
    if (!updates) continue;

    editableFields.forEach(function (field) {
      if (!Object.prototype.hasOwnProperty.call(updates, field)) return;
      var value = updates[field];
      if ((field === 'plannedStart' || field === 'plannedEnd') && value) {
        value = normalizeDate_(value);
      }
      values[i][colIndex[field]] = value;
    });
    values[i][colIndex.updatedAt] = new Date();
  }

  range.setValues(values);
}
