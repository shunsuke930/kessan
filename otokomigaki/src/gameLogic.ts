import { CHARACTER_STAGES, NEGLECTED_CHARACTER, PARAM_ORDER, ROOM_GRADES, STREAK_TIERS } from './constants'
import { PACKAGES_BY_ID } from './packages'
import type { Params } from './types'

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

export function getCharacterEmoji(cumulativePoints: number, isNeglected: boolean): string {
  if (isNeglected) return NEGLECTED_CHARACTER
  return CHARACTER_STAGES[getRoomGradeIndex(cumulativePoints)]
}

export function getCumulativePoints(history: { earned: number }[], todayEarned: number): number {
  return history.reduce((sum, entry) => sum + entry.earned, 0) + todayEarned
}

export function isPackageCompleteToday(packageId: string, doneToday: string[]): boolean {
  const pkg = PACKAGES_BY_ID[packageId]
  if (!pkg) return false
  return pkg.tasks.every((task) => doneToday.includes(task.id))
}

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function daysBetween(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00Z`)
  const to = new Date(`${toKey}T00:00:00Z`)
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}
