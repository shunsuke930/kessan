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
  Grade4=675 / Grade5(海の見える家)=1200 / Grade6(タワーマンション)=1900。
  「累計ポイント」（history合計＋今日の獲得pt）で判定し、下がることはない。
  次のグレードまでの残りptと進捗バーは `gameLogic.ts` の `getGradeProgress`
  が計算し、`GradeProgress.tsx` がホーム画面の部屋下に常時表示する（Grade6
  到達時は「最上階に到達」）。累計ポイントは通常時、4パラメータの合計
  （`getParamSum`）と常に一致する（タスクのcheck/uncheckが`todayEarned`と
  対応するparamを同じ量だけ増減させるため）。デバッグパネルで上書きしている
  間だけ意図的に一致しなくなる。
- **ストリーク倍率**（`STREAK_TIERS`）: 連続日数に応じてタスク獲得ptが
  ×1.0〜×2.0になる。
- **データのバックアップ**: 設定画面（`SettingsView.tsx`）からJSONの書き出し・
  読み込みができる。iOS SafariでのlocalStorage消失に備えた保険。

## 今日のタスク（カルーセル、`TaskList.tsx`）

パッケージごとに1画面のページを横並びにした、CSS scroll-snap
（`overflow-x-auto` + `snap-x snap-mandatory` + 各ページ `snap-start`）による
カルーセル。外部ライブラリは使っていない。

- スクロールコンテナには `touch-action: pan-y` を指定し、縦方向のジェスチャー
  はブラウザのネイティブ処理（ページの縦スクロール）に明け渡す。その代わり
  横方向は自前で処理する必要があるため、`onMouseDown`/`onMouseMove`
  （PC）と `onTouchStart`/`onTouchMove`（タッチ）の両方で同じロジック
  （`el.scrollLeft`をドラッグ量ぶん動かす）を使っている。
  `scroll-snap-type: mandatory` により、指/マウスを離すと最寄りのページへ
  自動スナップする。（`touch-action: pan-y`だけ付けて自前のタッチハンドラを
  用意しないと、横方向のジェスチャーがブラウザにもJSにも処理されず何も
  起きなくなる点に注意。ヘッドレスブラウザでCDPレベルの実タッチイベントを
  使って、横スワイプでカルーセルが切り替わること・カルーセル上での縦スワイプ
  がページをスクロールすることの両方を確認済み。）
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
- `DebugPanel.tsx`はページ全体がスクロールするようになったため、
  `absolute`ではなく`fixed`（ビューポート基準）に変更している。`absolute`の
  ままだと「カード最下部から◯px」という指定が、タスクが多いときはページの
  ずっと下（スクロールしないと出てこない位置）になってしまう。
- `BottomNav.tsx`は最後尾の要素として
  `padding-bottom: calc(env(safe-area-inset-bottom) + 24px)` を持たせ、
  iOS Safariの下部バー（ホームインジケータ）に隠れないようにしている。

## ドット絵素材

**`public/assets/rooms/` と `public/assets/chars/` に置く**（`src/assets/`
ではない）。Viteの`public/`配下はビルド時に一切変換されず、ビルド出力の
ルートにそのままコピーされてルート絶対パスで配信される。かつては
`src/assets/`に置いて`import.meta.glob`で動的importしていたが、本番で
壊れた画像アイコンになる不具合があり、`public/`＋絶対パス文字列＋明示的な
マップという最もシンプルで壊れにくい方式に統一した。パスは
テンプレート文字列で組み立てず、`src/assetImages.ts` の
`ROOM_IMAGES`/`ROOM_WAVE_IMAGES`/`ROOM_FLICKER_IMAGES`/`CHAR_IMAGES`という
明示的なマップ（グレード番号/段階番号→パス文字列）で持つ。マップに無い
グレード/段階は`null`が返り、`RoomView.tsx`は絵文字ベースの表示
（グラデーション背景＋`CHARACTER_STAGES`の絵文字）にフォールバックする。
`public/`はビルド時にファイルの実在チェックをしないため、画像未配置でも
ビルドは落ちない。

| 種類 | ファイル | 用途 |
|---|---|---|
| 部屋 | `room_1.png`〜`room_6.png`（768x480） | 部屋グレード1〜6の背景 |
| 波 | `room_5_wave_1〜3.png`（768x480、透過） | Grade5(海の見える家)専用、波アニメの3フレーム |
| 夜景 | `room_6_flicker.png`（768x480、透過） | Grade6(タワーマンション)専用、きらめきレイヤー |
| キャラ | `char_1.png`〜`char_5.png`（128x224、透過） | キャラの段階1〜5 |

- 部屋グレードの画像切り替えは `RoomView.tsx` 内の `useCrossfadeLayers` で
  クロスフェードする（`getRoomImageSrc`は同期関数なので、動的importの
  読み込み待ちは無い）。
- キャラの段階（1〜5）は部屋グレードとは独立に、「見た目(look)」パラメータの
  しきい値（`LOOK_CHAR_STAGE_THRESHOLDS`: 0/25/60/120/220。段階が増えた分の
  しきい値は明示的な指定が無かったための暫定値なので、感触を見て調整して
  よい）で決まる（`gameLogic.ts` の `getCharStage`）。段階が上がると
  `Overlay.tsx` の `charStageUp` でメッセージ（`CHAR_STAGE_UP_MESSAGES`）を
  表示する。
- 画像には必ず `image-rendering: pixelated` を当てている（ぼやけ防止）。
- **Grade5の波アニメーション**: `room_5_wave_1〜3.png` を
  `useWaveFrame`（`RoomView.tsx`）で約0.9秒おきに巡回し、
  `useCrossfadeLayers`で滑らかに切り替える。`prefers-reduced-motion: reduce`
  のときは巡回を止めて先頭フレーム固定にする。
- **Grade6の夜景きらめき**: `room_6_flicker.png` を room_6.png の上に
  不規則な周期（`animate-twinkle`、4.5秒ループ）でopacityが揺らぐレイヤーと
  して重ねる。`pointer-events: none` 付きでクリックは妨げない。Grade6以外
  では表示しない（`getRoomFlickerImageSrc`）。

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
累計ポイントの直接入力・部屋グレード1〜6への即切り替えができる。

**上書き値(`debugPointsOverride`)はlocalStorageに保存しない**
（`useGameState.ts`内の素のReact state。`SaveData`型の一部にしていない）。
以前は`SaveData`の一部として永続化していたため、デバッグ用に大きい値へ
上書きした後リロードしても値が残り続け、「実際の進捗は0ptなのに部屋は
最高グレードのまま」という不具合の原因になっていた。毎回のロードで
必ず`null`に戻る設計にすることで、この種の不具合を構造的に防いでいる。

## パフォーマンス / PWA

- 画像には `width`/`height` を明示してレイアウトシフトを防いでいる。
- `vite-plugin-pwa`（`vite.config.ts`）。`display: 'standalone'` により
  ホーム画面に追加するとブラウザバーなしで起動する。アイコン
  （`public/pwa-*.png`）は仮素材なので、実際のブランドアイコンに差し替える
  とよい。
- **JS/CSS/HTMLはプリキャッシュしない**（`workbox.globPatterns`は画像拡張子
  のみ）。開発が活発でデプロイ頻度が高い間、app shell(index.html→ハッシュ付き
  JS)を丸ごとプリキャッシュすると、古いservice workerが古いapp shellを
  配り続け「直したはずなのに反映されない」不具合の温床になる
  （実際、複数の不具合報告がこれで説明がつく状態になっていた）。代わりに
  `runtimeCaching`で`document`/`script`/`style`宛てのリクエストは
  `NetworkFirst`にし、オンラインなら常に最新を取りに行き、オフライン時のみ
  直近のキャッシュにフォールバックする。画像は変更頻度が低く重いので、
  従来どおりプリキャッシュしてオフライン表示に使う。
- ドット絵PNGは `optipng -o7` でロス無し圧縮済み（画質・透過は変化しない）。
  素材を差し替えたら同様に圧縮しておくと軽量に保てる。
