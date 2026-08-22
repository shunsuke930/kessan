import {
  CHARACTER_STAGES,
  DAY_RESET_HOUR,
  LOOK_CHAR_STAGE_THRESHOLDS,
  NEGLECTED_CHARACTER,
  PACKAGE_SLOT_TIERS,
  PARAM_ORDER,
  ROOM_GRADES,
  type RoomGrade,
  STREAK_TIERS,
} from './constants'
import { PACKAGES } from './packages'
import type { Params, Task } from './types'

export function getParamSum(params: Params): number {
  return PARAM_ORDER.reduce((sum, key) => sum + params[key], 0)
}

export function getTotalLevel(params: Params): number {
  return Math.floor(getParamSum(params) / 20)
}

export function getStreakMultiplier(streak: number): number {
  const effectiveStreak = Math.max(streak, 1)
  let multiplier = STREAK_TIERS[0].multiplier
  for (const tier of STREAK_TIERS) {
    if (effectiveStreak >= tier.minStreak) multiplier = tier.multiplier
  }
  return multiplier
}

export function getRoomGradeIndex(cumulativePoints: number): number {
  let index = 0
  for (let i = 0; i < ROOM_GRADES.length; i++) {
    if (cumulativePoints >= ROOM_GRADES[i].requiredPt) index = i
  }
  return index
}

export function getRoomGrade(cumulativePoints: number) {
  return ROOM_GRADES[getRoomGradeIndex(cumulativePoints)]
}

export interface GradeProgress {
  currentGrade: RoomGrade
  /** 次のグレード。既に最上位なら null */
  nextGrade: RoomGrade | null
  /** 次のグレードまでの残りpt。最上位なら0 */
  remainingPt: number
  /** 現グレード開始pt〜次グレード閾値までの進捗(0〜100) */
  percent: number
}

export function getGradeProgress(cumulativePoints: number): GradeProgress {
  const index = getRoomGradeIndex(cumulativePoints)
  const currentGrade = ROOM_GRADES[index]
  const nextGrade = ROOM_GRADES[index + 1] ?? null

  if (!nextGrade) {
    return { currentGrade, nextGrade: null, remainingPt: 0, percent: 100 }
  }

  const span = nextGrade.requiredPt - currentGrade.requiredPt
  const progressed = cumulativePoints - currentGrade.requiredPt
  const percent = Math.min(100, Math.max(0, (progressed / span) * 100))
  const remainingPt = Math.max(0, nextGrade.requiredPt - cumulativePoints)

  return { currentGrade, nextGrade, remainingPt, percent }
}

/** 「見た目(look)」パラメータで決まるキャラの段階(1〜3) */
export function getCharStage(look: number): number {
  let stage = LOOK_CHAR_STAGE_THRESHOLDS[0].stage
  for (const tier of LOOK_CHAR_STAGE_THRESHOLDS) {
    if (look >= tier.minLook) stage = tier.stage
  }
  return stage
}

export function getCharacterEmoji(charStage: number, isNeglected: boolean): string {
  if (isNeglected) return NEGLECTED_CHARACTER
  return CHARACTER_STAGES[charStage - 1]
}

export function getCumulativePoints(history: { earned: number }[], todayEarned: number): number {
  return history.reduce((sum, entry) => sum + entry.earned, 0) + todayEarned
}

/** 今日の表示タスクの中で、そのパッケージに割り当てられた分だけを見て完了判定する */
export function isPackageCompleteToday(
  packageId: string,
  doneToday: string[],
  todaysTasks: Task[],
): boolean {
  const tasksForPackage = todaysTasks.filter((task) => task.packageId === packageId)
  if (tasksForPackage.length === 0) return false
  return tasksForPackage.every((task) => doneToday.includes(task.id))
}

/** 午前4時を日付の境目として扱う（例: 8/21 深夜2時 → まだ8/20扱い） */
export function dateKey(date: Date): string {
  const shifted = new Date(date.getTime() - DAY_RESET_HOUR * 60 * 60 * 1000)
  const year = shifted.getFullYear()
  const month = String(shifted.getMonth() + 1).padStart(2, '0')
  const day = String(shifted.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function daysBetween(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00Z`)
  const to = new Date(`${toKey}T00:00:00Z`)
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

/** 有効なパッケージの全タスクを、パッケージ順・タスク定義順に並べて返す。上限はない */
export function getTodaysTasks(activePackageIds: string[]): Task[] {
  return PACKAGES.filter((pkg) => activePackageIds.includes(pkg.id)).flatMap((pkg) => pkg.tasks)
}

/** レベルに応じて解放されている、同時有効化できるパッケージ数の上限 */
export function getMaxActivePackages(level: number): number {
  let slots = PACKAGE_SLOT_TIERS[0].slots
  for (const tier of PACKAGE_SLOT_TIERS) {
    if (level >= tier.minLevel) slots = tier.slots
  }
  return slots
}

/** 全レベル帯を通じて最終的に解放されうる枠の総数 */
export const MAX_POSSIBLE_PACKAGE_SLOTS = Math.max(...PACKAGE_SLOT_TIERS.map((tier) => tier.slots))

/** slotIndex(0始まり)番目の枠が解放されるレベル */
export function getSlotUnlockLevel(slotIndex: number): number {
  let unlockLevel = 0
  let prevSlots = 0
  for (const tier of PACKAGE_SLOT_TIERS) {
    if (slotIndex >= prevSlots && slotIndex < tier.slots) {
      unlockLevel = tier.minLevel
      break
    }
    prevSlots = tier.slots
  }
  return unlockLevel
}
