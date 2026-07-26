/**
 * The app's own data store for tasks/progress (要件定義書 3.3, 3.4).
 * Lives on a dedicated sheet (CONFIG.TASKS_SHEET_NAME) so the existing
 * customer-master sheet is never written to.
 */

var TASK_HEADERS = [
  'taskId', 'customerId', 'customerName', 'fiscalEndDate', 'taskKey',
  'taskName', 'order', 'plannedStart', 'plannedEnd', 'progressStatus',
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
    return [
      Utilities.getUuid(),
      customer.id,
      customer.customerName,
      customer.fiscalEndDate,
      tpl.key,
      tpl.name,
      TASK_TEMPLATE.indexOf(tpl),
      addDays_(customer.fiscalEndDate, tpl.startOffset),
      addDays_(customer.fiscalEndDate, tpl.endOffset),
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
 */
function syncTasksFromCustomers() {
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
