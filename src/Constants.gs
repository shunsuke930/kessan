/**
 * Central configuration and constants for the settlement dashboard.
 *
 * CUSTOMER_SPREADSHEET_ID / CUSTOMER_SHEET_NAME point at the existing
 * customer-master spreadsheet, which this app only ever reads from.
 * Set them via Script Properties (File > Project properties > Script
 * properties), not by editing this file, so the deployed script never
 * needs a source change to point at a different sheet.
 */
function getScriptProperty_(key, fallback) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  return value ? value : fallback;
}

// Bumped on every code change and shown in the dashboard's footer, so it's
// possible to check at a glance whether every file was actually pasted
// into this Apps Script project - if the footer doesn't match what the
// setup instructions say it should be, some file was missed.
var APP_VERSION = '2026-08-08.1';

var CONFIG = {
  // ID of the existing customer-management spreadsheet (read-only access).
  CUSTOMER_SPREADSHEET_ID: getScriptProperty_('CUSTOMER_SPREADSHEET_ID', ''),
  CUSTOMER_SHEET_NAME: getScriptProperty_('CUSTOMER_SHEET_NAME', ''),

  // Spreadsheet used as the app's own data store for tasks/progress.
  // Defaults to the same spreadsheet as CUSTOMER_SPREADSHEET_ID, but on a
  // dedicated tab, so the customer-master tab is never written to.
  TASKS_SPREADSHEET_ID: getScriptProperty_('TASKS_SPREADSHEET_ID', ''),
  TASKS_SHEET_NAME: getScriptProperty_('TASKS_SHEET_NAME', '案件タスク'),

  // Days relative to the fiscal year-end date (決算日).
  ENGAGEMENT_START_OFFSET_DAYS: -90, // 対応開始：決算日の90日前
  WARNING_OFFSET_DAYS: -30, // 要注意：決算日の30日前を切った時点
  FILING_DEADLINE_OFFSET_DAYS: 60 // 遅延：申告・納税期限（決算日の2ヶ月後）
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

// Default task template. Day offsets are relative to the fiscal year-end
// date (決算日 = day 0). Kept to just two tasks per case - 決算準備
// (90 days before through 決算日) and 申告・納税 (決算日 through the
// 60-day filing deadline) - each tracked with a simple 未着手/対応中/完了
// status, rather than a finer breakdown of sub-tasks (事前連絡・資料作成
// など). `key` doubles as the フェーズ value shown in the task list UI.
var TASK_TEMPLATE = [
  { key: 'preparation', name: '決算準備', startOffset: -90, endOffset: 0 },
  { key: 'settlement', name: '申告・納税', startOffset: 1, endOffset: 60 }
];

var TASK_STATUS_VALUES = ['未着手', '対応中', '完了'];

var CASE_STATUS = {
  NORMAL: 'normal',
  WARNING: 'warning',
  DELAYED: 'delayed'
};

// Reference milestones shown at the top of the annual calendar view
// (AnnualService.gs). These are general, commonly-applicable compliance
// deadlines for Japanese corporations - actual dates vary by company
// (headcount, insurance union, individual fiscal year, etc.), so treat
// them as a rough orientation guide, not an authoritative deadline list.
var ANNUAL_MILESTONES = [
  { key: 'kakutei_shinkoku', name: '確定申告', startMonth: 1, startDay: 1, endMonth: 3, endDay: 15 },
  { key: 'hotei_chosho', name: '法定調書・給与支払報告書 提出期限', startMonth: 1, startDay: 31, endMonth: 1, endDay: 31 },
  { key: 'shokyaku_shisan', name: '固定資産税(償却資産)申告期限', startMonth: 1, startDay: 31, endMonth: 1, endDay: 31 },
  { key: 'rodohoken_koshin', name: '労働保険 年度更新', startMonth: 6, startDay: 1, endMonth: 7, endDay: 10 },
  { key: 'santei_kiso', name: '社会保険 算定基礎届', startMonth: 7, startDay: 1, endMonth: 7, endDay: 10 },
  { key: 'chukan_nofu_example', name: '法人税等 中間納付（3月決算の場合の目安）', startMonth: 10, startDay: 1, endMonth: 11, endDay: 30 },
  { key: 'nenmatsu_chosei', name: '年末調整', startMonth: 11, startDay: 1, endMonth: 12, endDay: 31 }
];
