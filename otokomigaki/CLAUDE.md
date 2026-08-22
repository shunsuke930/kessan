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

- **1日のタスク数に上限はない**（`gameLogic.ts` の `getTodaysTasks`）。有効な
  パッケージの全タスクをそのまま返すだけで、やった分だけptが貯まる。
- **同時に有効化できるパッケージ数はレベルで段階解放**（`constants.ts` の
  `PACKAGE_SLOT_TIERS`）。Lv0〜4:3枠 / Lv5〜14:4枠 / Lv15〜:5枠（全パッケージ）。
  未解放の枠はパッケージ選択画面でグレー表示（`PackageSelect.tsx`）し、解放時は
  `Overlay.tsx` の `slotUnlock` で通知する。パッケージ選択画面はカルーセルに
  出す／出さないのON/OFFスイッチとして機能する。
- **日付の切り替えは午前4時基準**（`constants.ts` の `DAY_RESET_HOUR`、
  `gameLogic.ts` の `dateKey`）。深夜0〜4時は前日として扱う。streakの連続判定も
  同じ境目を使う。
- **部屋グレードの必要pt**（`ROOM_GRADES`）: Grade1=0 / Grade2=50 / Grade3=225 /
  Grade4=675 / Grade5=1350。「累計ポイント」（history合計＋今日の獲得pt）で
  判定し、下がることはない。次のグレードまでの残りptと進捗バーは
  `gameLogic.ts` の `getGradeProgress` が計算し、`GradeProgress.tsx` が
  ホーム画面の部屋下に常時表示する（Grade5到達時は「最上階に到達」）。
- **ストリーク倍率**（`STREAK_TIERS`）: 連続日数に応じてタスク獲得ptが
  ×1.0〜×2.0になる。
- **データのバックアップ**: 設定画面（`SettingsView.tsx`）からJSONの書き出し・
  読み込みができる。iOS SafariでのlocalStorage消失に備えた保険。

## 今日のタスク（カルーセル、`TaskList.tsx`）

パッケージごとに1画面のページを横並びにした、CSS scroll-snap
（`overflow-x-auto` + `snap-x snap-mandatory` + 各ページ `snap-start`）による
カルーセル。外部ライブラリは使っていない。

- タッチはブラウザ標準のスクロールに任せ、PC(マウス)向けには
  `onMouseDown`/`onMouseMove` で `scrollLeft` を追従させるドラッグ実装を
  追加している（`scroll-snap-type: mandatory` により、指を離す＝マウスを離す
  と最寄りのページへ自動スナップする）。`touch-action` はあえて指定していない
  （次項参照）。
- 上部にパッケージ名・達成数（例: 3/6）・ドットインジケータを表示し、
  `onScroll` で `scrollLeft / clientWidth` を丸めて現在ページを判定する。
- 全ページが常にDOMに存在する（アンマウントしない）。

## レイアウトはページ全体スクロール

アプリのルート(`App.tsx`)は `min-h-screen` のみで、`h-dvh`/`h-full`や
`overflow: hidden`でページの高さを固定していない。部屋・ステータス・
タスクカルーセルなど全セクションは自然な高さで積み上がり、はみ出した分は
**ページ全体**（`body`/`html`のデフォルトスクロール）でスクロールする。
どのセクションも `position: fixed`/`sticky` にしていない。

- `TaskList`/`PackageSelect`/`HistoryView`/`SettingsView` は
  `flex-1`/`min-h-0`/`overflow-y-auto` を使わず、素直に `<section>` として
  積み上がるだけにしている（以前はセクション単位で内部スクロールさせようと
  していたが、`min-h-screen`とFlexboxの`min-height: auto`が絡んで
  ボトムナビごと画面外に押し出されるバグがあったため撤去した）。
- 横スクロールのカルーセル(`TaskList.tsx`の`overflow-x-auto`)には
  `touch-action: pan-y`を**付けていない**。実機/ヘッドレスブラウザで検証した
  結果、`pan-y`を付けるとタッチでの横スワイプ自体が効かなくなる
  （`touch-action`はそのプロパティの軸のジェスチャーしか許可しないため）。
  ページの高さが正しく自然に伸びていれば、`touch-action: auto`（デフォルト）
  のままでもブラウザが「横方向はカルーセル、縦方向はページ」を自動判別して
  くれる。縦スクロールがカルーセルに奪われる問題の実体は高さの固定（前段落）
  であり、touch-actionでは無かった。
- `DebugPanel.tsx`はページ全体がスクロールするようになったため、
  `absolute`ではなく`fixed`（ビューポート基準）に変更している。`absolute`の
  ままだと「カード最下部から◯px」という指定が、タスクが多いときはページの
  ずっと下（スクロールしないと出てこない位置）になってしまう。
- `BottomNav.tsx`は最後尾の要素として
  `padding-bottom: calc(env(safe-area-inset-bottom) + 24px)` を持たせ、
  iOS Safariの下部バー（ホームインジケータ）に隠れないようにしている。

## ドット絵素材

`src/assets/rooms/room_1.png`〜`room_5.png`（768x480、部屋グレード1〜5に対応）と
`src/assets/chars/char_1.png`〜`char_3.png`（128x224、透過PNG、キャラの段階
1〜3に対応）を配置すると自動で使われる。`src/assetImages.ts` が
`import.meta.glob`（**遅延**import。`eager: true` は使わない）でこれらを解決
していて、ファイルが無い場合は `loadRoomImage`/`loadCharImage` が
`Promise<null>` を返し、絵文字ベースの表示（`RoomView.tsx`のグラデーション
背景＋`CHARACTER_STAGES`の絵文字）に自動でフォールバックする。画像未配置でも
ビルドは落ちない。

現在表示中のグレード/段階の画像だけを動的import（=そのファイルだけを
ネットワーク取得）し、他の画像は実際に必要になるまで読み込まない
（`RoomView.tsx` の `useRoomImage`/`useCharImage`/`useRoomFlickerImage`）。
読み込みが終わるまでは前の画像（または絵文字フォールバック）をそのまま表示し
続けるため、グレード変更時のクロスフェードも自然につながる。

- 部屋グレードの画像切り替えは `RoomView.tsx` 内の `useCrossfadeLayers` で
  クロスフェードする。
- キャラの段階（1〜3）は部屋グレードとは独立に、「見た目(look)」パラメータの
  しきい値（`LOOK_CHAR_STAGE_THRESHOLDS`: 0/30/100）で決まる
  （`gameLogic.ts` の `getCharStage`）。段階が上がると `Overlay.tsx` の
  `charStageUp` でメッセージ（`CHAR_STAGE_UP_MESSAGES`）を表示する。
- 画像には必ず `image-rendering: pixelated` を当てている（ぼやけ防止）。
- **Grade5専用の夜景きらめき**: `src/assets/rooms/room_5_flicker.png`
  （768x480、透過PNG）を置くと、room_5.pngの上に不規則な周期（`animate-twinkle`、
  4.5秒ループ）でopacityが揺らぐレイヤーとして重なる。`pointer-events: none`
  付きでクリックは妨げない。Grade5以外では表示しない
  （`getRoomFlickerImageSrc`）。

## キャラの動き

- **呼吸アニメーション**: `.animate-breathe`（`translateY`のみ、3.2秒ループ、
  `prefers-reduced-motion: reduce`で無効化）を常時適用。
- **チェック演出**: タスクを1つチェックするたびに`useGameState`の`checkPulse`
  カウンタが増え、`RoomView.tsx`がそれをkeyにして`.animate-check-bounce`
  （0.3秒、上に4px）を再生する。全タスク達成時は既存の`.animate-bounce-once`
  （大きめのお祝い演出）を優先する。呼吸アニメーションと衝突しないよう、
  呼吸用のラッパーとバウンス用のラッパーを別のdivに分けて`transform`を合成
  している。

## 名言（`src/quotes.ts`）

アプリ起動時に `pickRandomQuote()` で1つランダムに選び、キャラ近くの吹き出し
（`QuoteBubble.tsx`）に表示する。キャラをタップすると
`pickRandomQuote(現在の名言)` で切り替わり、同じ名言が連続しないようにしている。

## デバッグパネル

`DebugPanel.tsx`。画面右下の🐛ボタンから常時開閉できる（本番ビルドでも表示）。
累計ポイントの直接入力・部屋グレード1〜5への即切り替えができる。

## パフォーマンス / PWA

- 画像には `width`/`height` を明示してレイアウトシフトを防いでいる。
- `vite-plugin-pwa`（`vite.config.ts`）でオフライン起動・2回目以降の高速化を
  実現。`registerType: 'autoUpdate'` でService Workerの登録・manifestへの
  リンクはビルド時に自動注入される（`index.html`を手動編集する必要はない）。
  `display: 'standalone'` によりホーム画面に追加するとブラウザバーなしで
  起動する。アイコン（`public/pwa-*.png`）は仮素材なので、実際のブランド
  アイコンに差し替えるとよい。
- ドット絵PNGは `optipng -o7` でロス無し圧縮済み（画質・透過は変化しない）。
  素材を差し替えたら同様に圧縮しておくと軽量に保てる。
