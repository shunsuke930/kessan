import { CHARACTER_STAGES, PARAM_ORDER, ROOM_GRADES } from './constants'
import type { Params } from './types'

export function getTotalLevel(params: Params): number {
  const total = PARAM_ORDER.reduce((sum, key) => sum + params[key], 0)
  return total / 10
}

function clampGradeIndex(totalLevel: number): number {
  return Math.min(ROOM_GRADES.length, Math.max(1, Math.floor(totalLevel) + 1)) - 1
}

export function getRoomGrade(totalLevel: number) {
  return ROOM_GRADES[clampGradeIndex(totalLevel)]
}

export function getCharacterEmoji(totalLevel: number): string {
  return CHARACTER_STAGES[clampGradeIndex(totalLevel)]
}
