/**
 * The app's own data store for tasks/progress. Rows are keyed by
 * customer + task rule + target month (this app generates one task list
 * per calendar month, not per fiscal cycle - see TASK_RULES in
 * Constants.gs). Lives on a dedicated sheet (CONFIG.TASKS_SHEET_NAME) so
 * the existing customer-master sheet is never written to.
 */

var TASK_HEADERS = [
  'taskId', 'customerId', 'customerName', 'targetMonth', 'taskKey',
  'taskName', 'order', 'progressStatus', 'notes', 'updatedAt'
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
  obj.targetMonth = normalizeDate_(obj.targetMonth);
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
 * For a given month, finds every (customer, rule) pair whose 決算日 lines
 * up with that rule's monthOffset - e.g. 申告・納税 (monthOffset -2)
 * matches customers whose fiscal year-end month is 2 months before the
 * target month. `fiscalInstanceDate` is the concrete 決算日 for the
 * matching cycle (used only for display, e.g. the 決算期 column).
 */
function getMonthlyMatches_(customers, targetMonthDate) {
  var matches = [];
  TASK_RULES.forEach(function (rule) {
    // Each offset names one candidate 決算月/決算年 for this rule; a
    // customer matches the rule if their fiscal month equals any of them
    // (e.g. 申告・納税 covers both the 1-month and 2-month mark after
    // 決算日).
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

function monthKey_(monthDate) {
  return monthDate.getTime();
}

/**
 * Ensures a stored row exists for every matched (customer, rule) pair in
 * this target month, so inline edits always have a real taskId to save
 * against. Idempotent - already-existing rows are left untouched. This
 * is called every time the list is viewed (see getMonthlyTaskList), not
 * just from an explicit "sync" action, so the list is always current
 * without the user having to remember to sync first.
 *
 * This is a shared web app (~10 staff), so a script lock serializes
 * concurrent calls - without it, two people opening the same month at
 * once could both see "not created yet" and both append, duplicating
 * rows.
 */
function ensureMonthlyTasks_(matches, targetMonthDate, existingRecords) {
  var existingKeys = {};
  existingRecords.forEach(function (r) {
    if (!r.targetMonth) return;
    existingKeys[r.customerId + '|' + r.taskKey + '|' + monthKey_(r.targetMonth)] = true;
  });

  var sheet = getTasksSheet_();
  var now = new Date();
  var newRows = [];
  var targetKey = monthKey_(targetMonthDate);

  matches.forEach(function (m) {
    var key = m.customer.id + '|' + m.rule.key + '|' + targetKey;
    if (existingKeys[key]) return;
    existingKeys[key] = true;

    newRows.push([
      Utilities.getUuid(),
      m.customer.id,
      m.customer.customerName,
      targetMonthDate,
      m.rule.key,
      m.rule.name,
      TASK_RULES.indexOf(m.rule),
      '未着手',
      '',
      now
    ]);
  });

  if (newRows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, TASK_HEADERS.length).setValues(newRows);
  }
  return newRows.length;
}

/**
 * Returns this month's task list: every customer matching one of
 * TASK_RULES for `targetMonthDate`, joined with its stored progress/notes
 * (creating the stored row first if this is the first time it's been
 * viewed). Locked so concurrent viewers never race on row creation.
 */
function getMonthlyTasks_(targetMonthDate) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var customers = getCustomers();
    var matches = getMonthlyMatches_(customers, targetMonthDate);
    var existingRecords = getAllTaskRecords_();
    ensureMonthlyTasks_(matches, targetMonthDate, existingRecords);

    // Re-read so freshly-created rows are included with their real taskId.
    var records = getAllTaskRecords_();
    var recordByKey = {};
    records.forEach(function (r) {
      if (!r.targetMonth) return;
      recordByKey[r.customerId + '|' + r.taskKey + '|' + monthKey_(r.targetMonth)] = r;
    });

    var targetKey = monthKey_(targetMonthDate);
    return matches.map(function (m) {
      var record = recordByKey[m.customer.id + '|' + m.rule.key + '|' + targetKey];
      return {
        taskId: record ? record.taskId : null,
        customerId: m.customer.id,
        customerName: m.customer.customerName,
        staff: m.customer.staff,
        taskKey: m.rule.key,
        taskName: m.rule.name,
        fiscalEndDate: toIsoDateString_(m.fiscalInstanceDate),
        progressStatus: record ? record.progressStatus : '未着手',
        notes: record ? (record.notes || '') : ''
      };
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Removes duplicate task rows (same customerId + taskKey + targetMonth),
 * keeping the first occurrence of each and deleting the rest. Unlike
 * `resetAllTasks`, this preserves recorded progress/comments on the row
 * that's kept - use this when duplicates have appeared but you don't want
 * to lose existing data. Run manually once from the Apps Script editor's
 * function picker. Returns the number of rows removed.
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
 * current TASK_HEADERS. Run this manually once from the Apps Script
 * editor's function picker after changing TASK_HEADERS/TASK_RULES so an
 * old sheet's column layout doesn't go stale, then reload the dashboard.
 * Intentionally not exposed to the web app UI, since it discards all
 * progress/comments recorded so far.
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

var TASK_EDITABLE_FIELDS = ['progressStatus', 'notes'];

/**
 * Updates editable fields (progressStatus, notes) on a single task row.
 */
function updateTask(taskId, updates) {
  var sheet = getTasksSheet_();
  var values = sheet.getDataRange().getValues();
  var colIndex = buildHeaderIndex_(values[0]);

  for (var i = 1; i < values.length; i++) {
    if (values[i][colIndex.taskId] !== taskId) continue;

    TASK_EDITABLE_FIELDS.forEach(function (field) {
      if (!Object.prototype.hasOwnProperty.call(updates, field)) return;
      sheet.getRange(i + 1, colIndex[field] + 1).setValue(updates[field]);
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

  var byTaskId = {};
  updatesList.forEach(function (item) { byTaskId[item.taskId] = item.updates; });

  for (var i = 1; i < values.length; i++) {
    var taskId = values[i][colIndex.taskId];
    var updates = byTaskId[taskId];
    if (!updates) continue;

    TASK_EDITABLE_FIELDS.forEach(function (field) {
      if (!Object.prototype.hasOwnProperty.call(updates, field)) return;
      values[i][colIndex[field]] = updates[field];
    });
    values[i][colIndex.updatedAt] = new Date();
  }

  range.setValues(values);
}
