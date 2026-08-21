# otokomigaki（男磨きアプリ モック）

現実の自分磨きタスクをこなすと、ドット絵（絵文字）のキャラと部屋がアップグレード
されていくWebモック。React + TypeScript + Tailwind (v4) + Vite。状態は
localStorage のみ（サーバー・API・認証なし）。スマホ幅375pxを基準にレイアウト。

## パラメータ（4つ）

`src/types.ts` の `ParamKey`。表示名・絵文字・バー色は `src/constants.ts` の
`PARAM_META` で定義。

| キー | 表示名 |
|---|---|
| `look` | 見た目 |
| `mind` | 規律 |
| `comm` | 対人 |
| `skill` | 知性 |

総合レベル = `floor(全パラメータ合計 / 20)`（`gameLogic.ts` の `getTotalLevel`）。

## パッケージ定義（`src/packages.ts`）

5パッケージ・全28タスク。各タスクは `pt`（1 or 2）と `why`（説明文。タスク行を
タップすると開閉表示）を持つ。パッケージ全体を書き換える場合は、パッケージ数や
タスク数が変わってもロジック側（ラウンドロビン抽出・スロット表示）は自動追従する。

| パッケージID | 名前 | param | タスク数 |
|---|---|---|---|
| `body` | 身体をつくる | look | 6 |
| `mind` | 規律をつくる | mind | 7 |
| `appearance` | 見た目を整える | look | 5 |
| `social` | 人と向き合う | comm | 4 |
| `growth` | 積み上げる | skill | 6 |

## 主要な仕組み

- **1日の表示タスクは最大8個**（`MAX_DAILY_TASKS`、`gameLogic.ts` の
  `getTodaysTasks`）。有効化されたパッケージからラウンドロビンで1個ずつ均等に
  抽出する。日付には依存しないため、有効パッケージの組み合わせが同じなら毎日
  同じ8個になる。
- **同時に有効化できるパッケージ数はレベルで段階解放**（`constants.ts` の
  `PACKAGE_SLOT_TIERS`）。Lv0〜4:2枠 / Lv5〜14:3枠 / Lv15〜:4枠。未解放の枠は
  パッケージ選択画面でグレー表示（`PackageSelect.tsx`）し、解放時は
  `Overlay.tsx` の `slotUnlock` で通知する。
- **日付の切り替えは午前4時基準**（`constants.ts` の `DAY_RESET_HOUR`、
  `gameLogic.ts` の `dateKey`）。深夜0〜4時は前日として扱う。streakの連続判定も
  同じ境目を使う。
- **部屋グレード**（`ROOM_GRADES`）は「累計ポイント」（history合計＋今日の
  獲得pt）で判定し、下がることはない。
- **ストリーク倍率**（`STREAK_TIERS`）: 連続日数に応じてタスク獲得ptが
  ×1.0〜×2.0になる。
- **データのバックアップ**: 設定画面（`SettingsView.tsx`）からJSONの書き出し・
  読み込みができる。iOS SafariでのlocalStorage消失に備えた保険。

## デバッグパネル

`DebugPanel.tsx`。画面右下の🐛ボタンから常時開閉できる（本番ビルドでも表示）。
累計ポイントの直接入力・部屋グレード1〜5への即切り替えができる。
