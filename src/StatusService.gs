/**
 * Status / color-coding rules (要件定義書 3.5).
 *
 *   通常（グレー）  ... today is before 決算日 - 30日
 *   要注意（黄色）  ... today is on/after 決算日 - 30日, up to the filing
 *                      deadline (決算日 + 60日)
 *   遅延（赤）      ... today is after the filing deadline
 *
 * A manual override set on a task always wins over the computed value;
 * a case's overall status is then the worst status among its tasks
 * (see getDashboardData in Code.gs), so a task-level override also
 * affects the case-level badge.
 */

function computeCaseStatus_(fiscalEndDate, today) {
  var warningStart = addDays_(fiscalEndDate, CONFIG.WARNING_OFFSET_DAYS);
  var filingDeadline = addDays_(fiscalEndDate, CONFIG.FILING_DEADLINE_OFFSET_DAYS);

  if (today.getTime() > filingDeadline.getTime()) return CASE_STATUS.DELAYED;
  if (today.getTime() >= warningStart.getTime()) return CASE_STATUS.WARNING;
  return CASE_STATUS.NORMAL;
}

/**
 * Per-task status. Completed tasks are never shown as delayed. Otherwise
 * falls back to the same case-level thresholds, evaluated against the
 * task's own planned end date rather than the fiscal year-end, so a task
 * scheduled well before 決算日 can still turn red if its own deadline
 * passes.
 */
function computeTaskStatus_(plannedEndDate, taskProgressStatus, manualOverride, today) {
  if (manualOverride && CASE_STATUS[manualOverride.toUpperCase()]) {
    return manualOverride;
  }
  if (taskProgressStatus === '完了') return CASE_STATUS.NORMAL;

  // Warning once within 30 days of the task's own due date; delayed once past it.
  if (today.getTime() > plannedEndDate.getTime()) return CASE_STATUS.DELAYED;
  if (daysBetween_(today, plannedEndDate) <= 30) return CASE_STATUS.WARNING;
  return CASE_STATUS.NORMAL;
}
