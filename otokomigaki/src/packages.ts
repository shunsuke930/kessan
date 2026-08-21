import type { Package, Task } from './types'

export const PACKAGES: Package[] = [
  {
    id: 'body',
    name: '身体をつくる',
    param: 'look',
    tasks: [
      { id: 'body-workout', label: '筋トレ（コンパウンド種目中心）', packageId: 'body', param: 'look', icon: '🏋️', why: 'スクワット・デッドリフトが最もホルモンに効く', pt: 2 },
      { id: 'body-sleep7', label: '7時間以上眠る', packageId: 'body', param: 'look', icon: '😴', why: '睡眠不足はテストステロンを直接下げる', pt: 2 },
      { id: 'body-sunlight', label: '起床後に日光を浴びる', packageId: 'body', param: 'look', icon: '🌞', why: '体内時計が整い、夜の睡眠の質が決まる', pt: 1 },
      { id: 'body-protein', label: 'タンパク質を体重×1.5g摂る', packageId: 'body', param: 'look', icon: '🍗', why: '鍛えても材料がなければ何も起きない', pt: 1 },
      { id: 'body-walk8000', label: '8,000歩あるく', packageId: 'body', param: 'look', icon: '🚶', why: '座りっぱなしが一番身体を鈍らせる', pt: 1 },
      { id: 'body-water2l', label: '水を2L飲む', packageId: 'body', param: 'look', icon: '💧', why: '足りていない状態が普通になっている', pt: 1 },
    ],
  },
  {
    id: 'mind',
    name: '規律をつくる',
    param: 'mind',
    tasks: [
      { id: 'mind-coldshower', label: '冷水シャワーを浴びる', packageId: 'mind', param: 'mind', icon: '🥶', why: '不快を選ぶ訓練。ここが全ての起点', pt: 2 },
      { id: 'mind-dopamine-detox', label: '刺激を断つ（ドーパミンデトックス）', packageId: 'mind', param: 'mind', icon: '🚫', why: '気力と集中を最も安く奪われる場所', pt: 2 },
      { id: 'mind-no-phone-1h', label: '起床後1時間、スマホに触らない', packageId: 'mind', param: 'mind', icon: '📵', why: '朝の集中力は一日で最も価値が高い', pt: 2 },
      { id: 'mind-no-aimless-sns', label: '目的なくSNSを開かない', packageId: 'mind', param: 'mind', icon: '🙅', why: '他人の人生を眺める時間は自分に残らない', pt: 1 },
      { id: 'mind-make-bed', label: 'ベッドを整えてから家を出る', packageId: 'mind', param: 'mind', icon: '🛏️', why: '一日の最初に一つ完了させる', pt: 1 },
      { id: 'mind-journal', label: '今日の目標と感謝を書き出す', packageId: 'mind', param: 'mind', icon: '📝', why: '書かない目標は存在しないのと同じ', pt: 1 },
      { id: 'mind-meditate10', label: '瞑想10分', packageId: 'mind', param: 'mind', icon: '🧘', why: '衝動と行動の間に隙間を作る', pt: 1 },
    ],
  },
  {
    id: 'appearance',
    name: '見た目を整える',
    param: 'look',
    tasks: [
      { id: 'look-skincare', label: 'スキンケア（洗顔・保湿）', packageId: 'appearance', param: 'look', icon: '🧼', why: '肌は最も見られていて、最も差がつく', pt: 1 },
      { id: 'look-sunscreen', label: '日焼け止めを塗る', packageId: 'appearance', param: 'look', icon: '🧴', why: '老け見えの主因は紫外線', pt: 1 },
      { id: 'look-beard', label: '髭を整える', packageId: 'appearance', param: 'look', icon: '🪒', why: '剃り残しは自分だけが気づかない', pt: 1 },
      { id: 'look-posture', label: '姿勢を意識する', packageId: 'appearance', param: 'look', icon: '🧍', why: '同じ顔でも姿勢だけで別人に見える', pt: 1 },
      { id: 'look-mirror-check', label: '鏡の前で全身を確認してから出る', packageId: 'appearance', param: 'look', icon: '🪞', why: '他人が見ているのは顔ではなく全体像', pt: 1 },
    ],
  },
  {
    id: 'social',
    name: '人と向き合う',
    param: 'comm',
    tasks: [
      { id: 'social-talk-stranger', label: '初対面の人に話しかける', packageId: 'social', param: 'comm', icon: '👋', why: '会話は才能ではなく、回数', pt: 2 },
      { id: 'social-eye-contact', label: '目を見て話す', packageId: 'social', param: 'comm', icon: '👀', why: '自信は言葉ではなく視線に出る', pt: 1 },
      { id: 'social-thanks', label: '「ありがとう」を伝える', packageId: 'social', param: 'comm', icon: '🙏', why: '印象に最も効く、コストゼロの行動', pt: 1 },
      { id: 'social-say-no', label: '断るべきことを断る', packageId: 'social', param: 'comm', icon: '✋', why: '全部引き受ける男は信用されない', pt: 2 },
    ],
  },
  {
    id: 'growth',
    name: '積み上げる',
    param: 'skill',
    tasks: [
      { id: 'growth-study60', label: '勉強・スキル習得60分', packageId: 'growth', param: 'skill', icon: '📚', why: '一日1時間で年365時間', pt: 2 },
      { id: 'growth-read20', label: '読書20ページ', packageId: 'growth', param: 'skill', icon: '📖', why: '月1冊、年12冊のペース', pt: 1 },
      { id: 'growth-learn-note', label: '学びを1行で書き出す', packageId: 'growth', param: 'skill', icon: '✍️', why: '言語化しないものは残らない', pt: 1 },
      { id: 'growth-post', label: '発信を1本する', packageId: 'growth', param: 'skill', icon: '📣', why: '出力すると理解の穴が見える', pt: 2 },
      { id: 'growth-record-spending', label: '支出を記録する', packageId: 'growth', param: 'skill', icon: '🧾', why: '把握していない支出は必ず漏れる', pt: 1 },
      { id: 'growth-income-action', label: '収入を増やす行動を1つ', packageId: 'growth', param: 'skill', icon: '💹', why: '節約だけでは天井が来る', pt: 2 },
    ],
  },
]

export const ALL_TASKS: Task[] = PACKAGES.flatMap((pkg) => pkg.tasks)

export const TASKS_BY_ID: Record<string, Task> = Object.fromEntries(
  ALL_TASKS.map((task) => [task.id, task]),
)

export const PACKAGES_BY_ID: Record<string, Package> = Object.fromEntries(
  PACKAGES.map((pkg) => [pkg.id, pkg]),
)
