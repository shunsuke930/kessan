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

var CASE_STATUS_SEVERITY = { normal: 0, warning: 1, delayed: 2 };

/**
 * Assembles everything the dashboard needs in one call: every customer's
 * current fiscal cycle, its generated tasks, and computed status colors.
 * Called from the client on load and after any sync/edit action.
 *
 * `referenceDateIso` (optional, "yyyy-MM-dd") lets the caller evaluate
 * every status as of a date other than today - e.g. to check "would this
 * case already be in the warning zone a month from now?". Defaults to
 * today when omitted or unparseable.
 */
function getDashboardData(referenceDateIso) {
  var customers = getCustomers();
  var allTasks = getAllTaskRecords_();
  var today = (referenceDateIso && normalizeDate_(referenceDateIso)) || startOfDay_(new Date());

  var cases = customers.map(function (customer) {
    var tasks = allTasks
      .filter(function (t) {
        return t.customerId === customer.id &&
          t.fiscalEndDate && customer.fiscalEndDate &&
          t.fiscalEndDate.getTime() === customer.fiscalEndDate.getTime();
      })
      .sort(function (a, b) { return a.order - b.order; });

    var taskViews = tasks.map(function (t) {
      return {
        taskId: t.taskId,
        taskKey: t.taskKey,
        name: t.taskName,
        start: toIsoDateString_(t.plannedStart),
        end: toIsoDateString_(t.plannedEnd),
        progressStatus: t.progressStatus,
        manualOverride: t.manualOverride,
        notes: t.notes,
        status: computeTaskStatus_(t.plannedEnd, t.progressStatus, t.manualOverride, today)
      };
    });

    var caseStatus = computeCaseStatus_(customer.fiscalEndDate, today);
    taskViews.forEach(function (tv) {
      if (CASE_STATUS_SEVERITY[tv.status] > CASE_STATUS_SEVERITY[caseStatus]) {
        caseStatus = tv.status;
      }
    });

    return {
      customerId: customer.id,
      customerName: customer.customerName,
      staff: customer.staff,
      fiscalEndDate: customer.fiscalEndDateIso,
      status: caseStatus,
      tasks: taskViews
    };
  });

  cases.sort(function (a, b) { return a.fiscalEndDate < b.fiscalEndDate ? -1 : 1; });

  return {
    referenceDate: toIsoDateString_(today),
    caseCount: cases.length,
    cases: cases
  };
}

/**
 * Generates any missing tasks for customers on their current fiscal
 * cycle, then returns the refreshed dashboard data.
 */
function runSyncAndGetDashboardData(referenceDateIso) {
  syncTasksFromCustomers();
  return getDashboardData(referenceDateIso);
}

/**
 * Applies an edit made from the dashboard UI to a single task, then
 * returns the refreshed dashboard data so the client can re-render.
 */
function saveTaskUpdate(taskId, updates, referenceDateIso) {
  updateTask(taskId, updates);
  return getDashboardData(referenceDateIso);
}
