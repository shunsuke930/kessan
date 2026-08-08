/**
 * Web app entry point and the functions exposed to the client via
 * google.script.run.
 */

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('決算対応ダッシュボード')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Returns the task list for one calendar month: every customer whose
 * fiscal year-end matches one of TASK_RULES (Constants.gs) relative to
 * `referenceMonthIso` ("yyyy-MM", e.g. from a month-picker input),
 * together with each task's stored progress/notes. Creates the
 * underlying stored row on first view of a given month, so this alone is
 * enough to keep the list current - there's no separate "sync" step.
 * Defaults to the current month when `referenceMonthIso` is omitted or
 * unparseable.
 */
function getMonthlyTaskList(referenceMonthIso) {
  var targetMonthDate = normalizeMonth_(referenceMonthIso);
  var rows = getMonthlyTasks_(targetMonthDate);

  rows.sort(function (a, b) {
    if (a.taskName !== b.taskName) return a.taskName < b.taskName ? -1 : 1;
    return a.customerName < b.customerName ? -1 : (a.customerName > b.customerName ? 1 : 0);
  });

  return {
    referenceMonth: toIsoDateString_(targetMonthDate).slice(0, 7),
    rowCount: rows.length,
    rows: rows,
    version: APP_VERSION
  };
}

/**
 * Applies an edit made from the dashboard UI to a single task, then
 * returns the refreshed task list so the client can re-render.
 */
function saveTaskUpdate(taskId, updates, referenceMonthIso) {
  updateTask(taskId, updates);
  return getMonthlyTaskList(referenceMonthIso);
}

/**
 * Applies a batch of task edits (see updateTasksBatch_ in TaskService.gs)
 * in one read/write round trip, then returns the refreshed task list.
 * Used by the dashboard's debounced inline-edit queue so a burst of
 * status/comment changes across several rows becomes a single request
 * instead of one per field.
 */
function saveTaskUpdatesBatch(updatesList, referenceMonthIso) {
  updateTasksBatch_(updatesList);
  return getMonthlyTaskList(referenceMonthIso);
}
