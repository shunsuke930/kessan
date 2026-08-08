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
var APP_VERSION = '2026-08-08.3';

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

// Default task template. Each entry is a sub-task (`taskKey`/`name`)
// grouped under one of two top-level phases (`phase`: 'preparation' =
// 決算準備, 'settlement' = 申告・納税), which is what the task list's
// フェーズ column/filter uses (individual sub-tasks are filtered
// separately via the タスク column). Only the initial pre-contact task
// counts as 決算準備 - everything from resulting document prep onward is
// 申告・納税.
var TASK_TEMPLATE = [
  { key: 'pre_contact', phase: 'preparation', name: '問い合わせ先への事前連絡（必要書類依頼など）' },
  { key: 'bs_preparation', phase: 'settlement', name: '貸借対照表・資料作成' },
  { key: 'return_preparation', phase: 'settlement', name: '申告書作成' },
  { key: 'client_approval', phase: 'settlement', name: '問い合わせ先への確認・承認取得' },
  { key: 'filing_payment', phase: 'settlement', name: '申告・納税' }
];

// Every sub-task under a given phase shares that phase's start/end window
// (計算月単位, calendar months relative to 決算日 = month 0), rather than
// each sub-task having its own fine-grained deadline: 決算準備 spans the
// 2 months up to 決算日; 申告・納税 spans the 2 months after it.
var PHASE_DATE_WINDOWS = {
  preparation: { startMonths: -2, endMonths: 0 },
  settlement: { startMonths: 0, endMonths: 2 }
};

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
