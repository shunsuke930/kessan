/**
 * Central configuration and constants for the monthly tax-task list tool.
 * There is no web app - the task list lives on a spreadsheet tab
 * (TaskService.gs/Menu.gs), edited directly by staff.
 *
 * CUSTOMER_SPREADSHEET_ID / CUSTOMER_SHEET_NAME point at the existing
 * customer-master spreadsheet, which this script only ever reads from.
 * Set them via Script Properties (Project Settings > Script properties),
 * not by editing this file, so a source change is never needed just to
 * point at a different sheet.
 */
function getScriptProperty_(key, fallback) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  return value ? value : fallback;
}

// Bumped on every code change and shown via the custom menu's "バージョン
// 確認" item (Menu.gs), so it's possible to check at a glance whether
// every file was actually pasted into this Apps Script project - if the
// version shown doesn't match what the setup instructions say it should
// be, some file was missed.
var APP_VERSION = '2026-08-09.1';

var CONFIG = {
  // ID of the existing customer-management spreadsheet (read-only access).
  CUSTOMER_SPREADSHEET_ID: getScriptProperty_('CUSTOMER_SPREADSHEET_ID', ''),
  CUSTOMER_SHEET_NAME: getScriptProperty_('CUSTOMER_SHEET_NAME', ''),

  // Spreadsheet used as the app's own data store for tasks/progress.
  // Defaults to the same spreadsheet as CUSTOMER_SPREADSHEET_ID, but on a
  // dedicated tab, so the customer-master tab is never written to.
  TASKS_SPREADSHEET_ID: getScriptProperty_('TASKS_SPREADSHEET_ID', ''),
  TASKS_SHEET_NAME: getScriptProperty_('TASKS_SHEET_NAME', '案件タスク')
};

// Candidate header names used to auto-detect columns in the customer
// master sheet, since the exact header wording has not been confirmed yet
// (see 要件定義書 7. 次のステップ). Add aliases here if the real sheet
// uses different wording.
var CUSTOMER_COLUMN_ALIASES = {
  customerName: ['顧客名', '法人名', '会社名'],
  fiscalMonth: ['決算月'],
  fiscalDate: ['決算日'],
  staff: ['担当者']
};

// This app generates a fresh task list for one calendar month at a time
// ("月初にその月にやらないといけないタスクを自動で一覧化する"), rather than
// tracking a whole fiscal cycle per customer. Each rule extracts customers
// whose fiscal year-end month sits any of `monthOffsets` calendar months
// away from the month being viewed:
//   - offset > 0: the customer's 決算日 is that many months in the
//     future (upcoming deadline, viewed in advance).
//   - offset < 0: the customer's 決算日 was that many months ago
//     (a deadline that falls due this month).
// 申告準備 = 1 month before 決算日 (prep starts). 申告・納税 = the 2-month
// window after 決算日 (Japan's statutory corporate filing/payment
// deadline is exactly 2 months after 決算日, so both the 1-month and
// 2-month mark stay on the list). 納税予想 = 6 months before 決算日
// (roughly the fiscal year's halfway point, used to forecast 中間納付).
var TASK_RULES = [
  { key: 'preparation', name: '申告準備', monthOffsets: [1] },
  { key: 'filing_payment', name: '申告・納税', monthOffsets: [-1, -2] },
  { key: 'tax_forecast', name: '納税予想', monthOffsets: [6] }
];

var TASK_STATUS_VALUES = ['未着手', '対応中', '完了'];
