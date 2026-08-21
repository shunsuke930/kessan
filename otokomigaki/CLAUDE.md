# otokomigaki（男磨きアプリ モック）

現実の自分磨きタスクをこなすと、ドット絵のキャラと部屋がアップグレードされて
いくWebモック。React + TypeScript + Tailwind (v4) + Vite。状態は localStorage
のみ（サーバー・API・認証なし）。スマホ幅375pxを基準にレイアウト。

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
  `PACKAGE_SLOT_TIERS`）。Lv0〜4:3枠 / Lv5〜14:4枠 / Lv15〜:5枠（全パッケージ）。
  未解放の枠はパッケージ選択画面でグレー表示（`PackageSelect.tsx`）し、解放時は
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

## ドット絵素材

`src/assets/rooms/room_1.png`〜`room_5.png`（768x480、部屋グレード1〜5に対応）と
`src/assets/chars/char_1.png`〜`char_3.png`（128x224、透過PNG、キャラの段階
1〜3に対応）を配置すると自動で使われる。`src/assetImages.ts` が
`import.meta.glob` でこれらを解決していて、ファイルが無い場合は
`getRoomImageSrc`/`getCharImageSrc` が `null` を返し、絵文字ベースの表示
（`RoomView.tsx`のグラデーション背景＋`CHARACTER_STAGES`の絵文字）に自動で
フォールバックする。画像未配置でもビルドは落ちない。

- 部屋グレードの画像切り替えは `RoomView.tsx` 内の `useCrossfadeLayers` で
  クロスフェードする。
- キャラの段階（1〜3）は部屋グレードとは独立に、「見た目(look)」パラメータの
  しきい値（`LOOK_CHAR_STAGE_THRESHOLDS`: 0/30/100）で決まる
  （`gameLogic.ts` の `getCharStage`）。段階が上がると `Overlay.tsx` の
  `charStageUp` でメッセージ（`CHAR_STAGE_UP_MESSAGES`）を表示する。
- 画像には必ず `image-rendering: pixelated` を当てている（ぼやけ防止）。

## 名言（`src/quotes.ts`）

アプリ起動時に `pickRandomQuote()` で1つランダムに選び、キャラ近くの吹き出し
（`QuoteBubble.tsx`）に表示する。キャラをタップすると
`pickRandomQuote(現在の名言)` で切り替わり、同じ名言が連続しないようにしている。

## デバッグパネル

`DebugPanel.tsx`。画面右下の🐛ボタンから常時開閉できる（本番ビルドでも表示）。
累計ポイントの直接入力・部屋グレード1〜5への即切り替えができる。
