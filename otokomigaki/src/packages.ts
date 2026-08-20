import type { Package, Task } from './types'

export const PACKAGES: Package[] = [
  {
    id: 'cleanliness',
    name: '清潔感パック',
    param: 'look',
    tasks: [
      { id: 'wash-face', label: '洗顔・保湿', packageId: 'cleanliness', param: 'look', icon: '🧼', why: '肌の印象は清潔感の8割を決める' },
      { id: 'sunscreen', label: '日焼け止め', packageId: 'cleanliness', param: 'look', icon: '🧴', why: '老け見えの主因は紫外線。曇りの日も降っている' },
      { id: 'beard', label: '髭を整える', packageId: 'cleanliness', param: 'look', icon: '🪒', why: '剃り残しは一番見られている' },
      { id: 'nails', label: '爪を確認する', packageId: 'cleanliness', param: 'look', icon: '💅', why: '手元は近距離で必ず視界に入る' },
    ],
  },
  {
    id: 'workout',
    name: '筋トレパック',
    param: 'look',
    tasks: [
      { id: 'workout-15', label: '筋トレ15分', packageId: 'workout', param: 'look', icon: '🏋️', why: '週2回でも体型は変わる' },
      { id: 'walk-8000', label: '8,000歩あるく', packageId: 'workout', param: 'look', icon: '🚶', why: '見た目より先に体調が変わる' },
      { id: 'protein', label: 'タンパク質を意識', packageId: 'workout', param: 'look', icon: '🍗', why: '鍛えても材料がなければ増えない' },
      { id: 'sleep-7', label: '睡眠7時間', packageId: 'workout', param: 'look', icon: '😴', why: '筋肉は寝ている間に作られる' },
    ],
  },
  {
    id: 'communication',
    name: 'コミュ力パック',
    param: 'comm',
    tasks: [
      { id: 'extra-word', label: '誰かに一言多く話す', packageId: 'communication', param: 'comm', icon: '💬', why: '会話は技術。回数がすべて' },
      { id: 'thanks', label: '「ありがとう」を伝える', packageId: 'communication', param: 'comm', icon: '🙏', why: '印象に最も効くコストゼロの行動' },
      { id: 'posture', label: '姿勢を正す', packageId: 'communication', param: 'comm', icon: '🧍', why: '声の通りと自信の見え方が変わる' },
      { id: 'listen', label: '人の話を最後まで聞く', packageId: 'communication', param: 'comm', icon: '👂', why: '話し上手より聞き上手が好かれる' },
    ],
  },
  {
    id: 'skill',
    name: 'スキルパック',
    param: 'skill',
    tasks: [
      { id: 'study-30', label: '勉強30分', packageId: 'skill', param: 'skill', icon: '✏️', why: '1日30分で年180時間' },
      { id: 'read-10', label: '読書10ページ', packageId: 'skill', param: 'skill', icon: '📖', why: '月1冊のペースになる' },
      { id: 'memo', label: '学んだことを1行メモ', packageId: 'skill', param: 'skill', icon: '📝', why: '言語化しないと定着しない' },
    ],
  },
  {
    id: 'asset',
    name: '資産パック',
    param: 'asset',
    tasks: [
      { id: 'record-spending', label: '支出を記録する', packageId: 'asset', param: 'asset', icon: '🧾', why: '把握していない支出は必ず漏れる' },
      { id: 'no-waste', label: '無駄遣いゼロで過ごす', packageId: 'asset', param: 'asset', icon: '🚫', why: '減らす方が増やすより確実' },
      { id: 'check-savings', label: '積立の状況を確認', packageId: 'asset', param: 'asset', icon: '📊', why: '見る習慣が判断力を作る' },
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
