/**
 * Custom menu (shown whenever the spreadsheet is opened) and the two
 * trigger handlers that make the 案件タスク sheet self-maintaining:
 * onEdit stamps 更新日時 automatically, and an optional monthly
 * time-driven trigger keeps the task list current without anyone having
 * to remember to click anything.
 *
 * onOpen/onEdit are "simple triggers" - Apps Script runs them
 * unauthorized, so they may only touch the spreadsheet they're bound to
 * (no SpreadsheetApp.openById on a different file, no email, etc). That's
 * why onOpen only builds the menu here rather than also running a sync:
 * if CUSTOMER_SPREADSHEET_ID points at a different file, that sync would
 * silently fail. Menu clicks and installable time triggers run with the
 * full authorization of whoever set them up, so syncCurrentMonth() is
 * only ever called from those two places.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('決算タスク管理')
    .addItem('今月のタスクを更新', 'syncCurrentMonthFromMenu_')
    .addSeparator()
    .addItem('重複を削除', 'deduplicateTasksFromMenu_')
    .addItem('シートの表示設定を初期化', 'setupSheetFormattingFromMenu_')
    .addItem('抽出ルールの説明を表示', 'showRulesLegendFromMenu_')
    .addSeparator()
    .addItem('毎月1日の自動更新を有効にする', 'enableMonthlyAutoSync')
    .addItem('毎月1日の自動更新を無効にする', 'disableMonthlyAutoSync')
    .addSeparator()
    .addItem('バージョン確認', 'showVersion_')
    .addItem('【注意】全データをリセット', 'resetAllTasksFromMenu_')
    .addToUi();
}

/**
 * Auto-stamps 更新日時 when ステータス or コメント is edited by hand, so
 * that column stays meaningful without staff having to touch it
 * themselves. Handles multi-cell edits (e.g. pasting into several rows
 * at once), not just single-cell ones.
 */
function onEdit(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  if (sheet.getName() !== CONFIG.TASKS_SHEET_NAME) return;

  var colIndex = getHeaderIndex_(sheet);
  var trackedCols = [colIndex.progressStatus + 1, colIndex.notes + 1];
  var startCol = e.range.getColumn();
  var endCol = startCol + e.range.getNumColumns() - 1;
  if (!trackedCols.some(function (c) { return c >= startCol && c <= endCol; })) return;

  var startRow = Math.max(e.range.getRow(), 2);
  var endRow = e.range.getRow() + e.range.getNumRows() - 1;
  if (endRow < startRow) return;

  var now = new Date();
  for (var row = startRow; row <= endRow; row++) {
    sheet.getRange(row, colIndex.updatedAt + 1).setValue(now);
  }
}

function syncCurrentMonthFromMenu_() {
  try {
    var result = syncCurrentMonth();
    SpreadsheetApp.getActiveSpreadsheet().toast(
      '今月の対象: ' + result.matchCount + '件（新規追加: ' + result.createdCount + '件）',
      '更新完了', 5
    );
  } catch (err) {
    SpreadsheetApp.getUi().alert('エラーが発生しました: ' + err.message);
  }
}

function deduplicateTasksFromMenu_() {
  try {
    var result = deduplicateTasks();
    SpreadsheetApp.getActiveSpreadsheet().toast(result.removed + '件の重複行を削除しました。', '重複削除', 5);
  } catch (err) {
    SpreadsheetApp.getUi().alert('エラーが発生しました: ' + err.message);
  }
}

function setupSheetFormattingFromMenu_() {
  try {
    setupSheetFormatting_();
    SpreadsheetApp.getActiveSpreadsheet().toast('表示設定を適用しました。', '初期設定', 5);
  } catch (err) {
    SpreadsheetApp.getUi().alert('エラーが発生しました: ' + err.message);
  }
}

function showRulesLegendFromMenu_() {
  try {
    writeRulesLegend_();
    var sheet = getTasksSpreadsheet_().getSheetByName(RULES_LEGEND_SHEET_NAME);
    if (sheet) sheet.activate();
  } catch (err) {
    SpreadsheetApp.getUi().alert('エラーが発生しました: ' + err.message);
  }
}

function showVersion_() {
  SpreadsheetApp.getUi().alert('バージョン: ' + APP_VERSION);
}

function resetAllTasksFromMenu_() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    '全データをリセットしますか？',
    'これまで入力した進捗・コメントもすべて消えます。この操作は取り消せません。',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) return;

  try {
    resetAllTasks();
    ui.alert('リセットしました。「今月のタスクを更新」で作り直してください。');
  } catch (err) {
    ui.alert('エラーが発生しました: ' + err.message);
  }
}

var MONTHLY_SYNC_TRIGGER_HANDLER = 'syncCurrentMonthTrigger_';

// Entry point for the installable time trigger only (see file header for
// why this can't just be onOpen).
function syncCurrentMonthTrigger_() {
  syncCurrentMonth();
}

function removeMonthlySyncTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === MONTHLY_SYNC_TRIGGER_HANDLER) ScriptApp.deleteTrigger(t);
  });
}

function enableMonthlyAutoSync() {
  removeMonthlySyncTriggers_();
  ScriptApp.newTrigger(MONTHLY_SYNC_TRIGGER_HANDLER).timeBased().onMonthDay(1).atHour(6).create();
  SpreadsheetApp.getUi().alert('毎月1日 6時ごろに自動で更新されるよう設定しました。');
}

function disableMonthlyAutoSync() {
  removeMonthlySyncTriggers_();
  SpreadsheetApp.getUi().alert('自動更新を停止しました。');
}
