# 決算対応ダッシュボード

税理士事務所向けの決算対応スケジュール可視化ダッシュボード（Google Apps Script製）。
要件は `要件定義書.md` を参照。既存の顧客管理スプレッドシートを読み取り専用で参照し、
タスク・進捗はアプリ専用のシート（既定では `案件タスク` タブ）で管理する。

## ディレクトリ構成

```
src/
  appsscript.json      GASマニフェスト（Webアプリ設定）
  Constants.gs          設定・タスクテンプレート・色分け閾値
  DateUtils.gs          日付ユーティリティ
  CustomerService.gs    顧客マスタシートの読み取り（読み取り専用）
  TaskService.gs        タスク用シートのCRUD・テンプレートからの自動生成
  StatusService.gs      通常/要注意/遅延の判定ロジック
  Code.gs                doGet、クライアントから呼ばれる関数群
  Index.html / Stylesheet.html / JavaScript.html
                         ダッシュボードUI（Frappe Ganttでガントチャート表示）
```

## セットアップ

### 1. Apps Scriptプロジェクトの作成とpush

```bash
npm install -g @google/clasp
clasp login

# 新規にGASプロジェクトを作る場合
clasp create --title "決算対応ダッシュボード" --type webapp --rootDir src

# 既存のGASプロジェクトに紐づける場合は、生成された .clasp.json の
# scriptId を書き換えるか、.clasp.json.example をコピーして使う
cp .clasp.json.example .clasp.json  # scriptId を実際の値に置き換える

clasp push
```

### 2. スクリプトプロパティの設定

Apps Scriptエディタで「プロジェクトの設定」→「スクリプト プロパティ」から設定する
（`clasp open` でエディタを開ける）。

| プロパティ名 | 必須 | 内容 |
|---|---|---|
| `CUSTOMER_SPREADSHEET_ID` | 必須 | 既存の顧客管理スプレッドシートのID（URLの `/d/` と `/edit` の間） |
| `CUSTOMER_SHEET_NAME` | 任意 | 顧客一覧のシート名。未設定時は先頭シートを使用 |
| `TASKS_SPREADSHEET_ID` | 任意 | タスクデータの保存先スプレッドシートID。未設定時は `CUSTOMER_SPREADSHEET_ID` と同じファイル内に専用タブを作成 |
| `TASKS_SHEET_NAME` | 任意 | タスク用タブ名。既定値 `案件タスク` |

### 3. 顧客マスタの列名の確認・調整

現状、顧客シートの列名（見出し）は未確定（要件定義書 7. 次のステップ）。
`src/Constants.gs` の `CUSTOMER_COLUMN_ALIASES` は以下の見出し候補を自動検出する：

- 顧客名: `顧客名`
- 法人名: `法人名` / `会社名`
- 決算月: `決算月`
- 決算日: `決算日`
- 担当税理士: `担当税理士`
- 担当者: `担当者`

実際のシートの見出しがこれと異なる場合は、`CUSTOMER_COLUMN_ALIASES` に候補を追加する。
`決算日`列が空でも`決算月`列があれば、その月の末日を決算日として自動計算する。

### 4. Webアプリとしてデプロイ

```bash
clasp deploy --description "初回デプロイ"
```

「デプロイ」→「新しいデプロイ」→種類「ウェブアプリ」を選択し、
- 実行するユーザー: 「アクセスしているユーザー」
- アクセスできるユーザー: 「全員」（既定。`src/appsscript.json` の `webapp.access` は `ANYONE`）
  - Google Workspaceの組織アカウントで運用しており、組織内のみに限定したい場合は
    `access` を `DOMAIN` に変更した上で「組織内」を選択する。
    ただし個人のGmailアカウント（Workspace未加入）では `DOMAIN` を選ぶと
    「この操作を行う権限がありません」というデプロイエラーになるため、
    その場合は `ANYONE` のままにすること。

を選んで発行する（`src/appsscript.json` の `webapp` 設定に対応）。
「全員」でも、実際にスプレッドシートを読み書きできるのはそのシートを共有されている
メンバーのみ（`executeAs: USER_ACCESSING` のため各自の権限で実行される）。
アクセス範囲の厳密化（ドメイン制限の詳細など）は今後の検討事項。

### 5. 初回のタスク生成

デプロイ後、ダッシュボード右上の「スプレッドシートと同期」ボタンを押すと、
顧客マスタの各社について、現在の決算サイクル分のタスクがテンプレートから自動生成される。
既に生成済みの決算サイクルはスキップされるため、何度実行しても重複生成されない。

## 主要ロジックのメモ

- **タスクテンプレート**（`Constants.gs` の `TASK_TEMPLATE`）: 決算日を基準日（day 0）とした
  オフセットで5タスクを定義。決算日の90日前〜申告納税期限（決算日+60日）を均等割りした
  初期値であり、タスク間の日数配分は要件定義書6.の未確定事項のため暫定値。
  生成後は案件ごとに個別編集できる（テンプレート＋個別調整のハイブリッド方式）。
- **色分け判定**（`StatusService.gs`）: 案件全体のステータスは決算日基準の3段階判定
  （通常/要注意/遅延、要件定義書3.5）に加え、各タスク自身の期限による判定の中で
  最も深刻なステータスを採用する。タスクごとに手動上書き（`manualOverride`）も可能。

## ローカル開発

`clasp push` で `src/` 配下の `.gs` / `.html` / `appsscript.json` のみが同期される
（`.claspignore` 参照）。Claude Codeでコードを編集し、`clasp push` でGASに反映する運用を想定。
