import { useEffect, useState } from 'react'
import {
  MAX_ACTIVE_PACKAGES,
  NEGLECT_DAYS_THRESHOLD,
  PACKAGE_COMPLETE_BONUS,
  POINTS_PER_TASK,
  STORAGE_KEY,
} from './constants'
import { dateKey, daysBetween, getStreakMultiplier, isPackageCompleteToday } from './gameLogic'
import { TASKS_BY_ID } from './packages'
import type { Params, SaveData } from './types'

const INITIAL_PARAMS: Params = { look: 0, comm: 0, skill: 0, asset: 0 }

function createEmptySave(today: string): SaveData {
  return {
    params: { ...INITIAL_PARAMS },
    activePackages: [],
    doneToday: [],
    bonusPackagesToday: [],
    todayEarned: 0,
    lastOpenDate: today,
    streak: 0,
    history: [],
  }
}

interface LoadResult {
  data: SaveData
  /** 前回起動日から何日空いたか（今日と同日なら0）。読み込み時点でのみ意味を持つ */
  gapDaysAtLoad: number
}

function loadInitialState(): LoadResult {
  const today = dateKey(new Date())
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { data: createEmptySave(today), gapDaysAtLoad: 0 }

  let saved: SaveData
  try {
    const parsed = JSON.parse(raw) as Partial<SaveData>
    saved = {
      params: { ...INITIAL_PARAMS, ...parsed.params },
      activePackages: parsed.activePackages ?? [],
      doneToday: parsed.doneToday ?? [],
      bonusPackagesToday: parsed.bonusPackagesToday ?? [],
      todayEarned: parsed.todayEarned ?? 0,
      lastOpenDate: parsed.lastOpenDate ?? today,
      streak: parsed.streak ?? 0,
      history: parsed.history ?? [],
    }
  } catch {
    return { data: createEmptySave(today), gapDaysAtLoad: 0 }
  }

  if (saved.lastOpenDate === today) {
    return { data: saved, gapDaysAtLoad: 0 }
  }

  // 日付をまたいだ: 前日の記録をhistoryに積み、streakを判定してから今日分をリセットする
  const gap = daysBetween(saved.lastOpenDate, today)
  const hadActivityYesterday = saved.doneToday.length > 0
  const wasConsecutive = gap === 1
  const nextStreak = wasConsecutive && hadActivityYesterday ? saved.streak + 1 : 0

  const history =
    saved.todayEarned > 0
      ? [...saved.history, { date: saved.lastOpenDate, earned: saved.todayEarned }]
      : saved.history

  const data: SaveData = {
    ...saved,
    doneToday: [],
    bonusPackagesToday: [],
    todayEarned: 0,
    lastOpenDate: today,
    streak: nextStreak,
    history,
  }

  return { data, gapDaysAtLoad: gap }
}

export function useGameState() {
  const [loadResult] = useState(loadInitialState)
  const [state, setState] = useState<SaveData>(loadResult.data)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const isNeglected = loadResult.gapDaysAtLoad >= NEGLECT_DAYS_THRESHOLD && state.doneToday.length === 0

  const toggleTask = (taskId: string) => {
    const task = TASKS_BY_ID[taskId]
    if (!task || !state.activePackages.includes(task.packageId)) return

    setState((prev) => {
      const isDone = prev.doneToday.includes(taskId)
      const multiplier = getStreakMultiplier(prev.streak)
      const delta = POINTS_PER_TASK * multiplier

      if (isDone) {
        const params: Params = {
          ...prev.params,
          [task.param]: Math.max(0, prev.params[task.param] - delta),
        }
        return {
          ...prev,
          params,
          doneToday: prev.doneToday.filter((id) => id !== taskId),
          todayEarned: Math.max(0, prev.todayEarned - delta),
        }
      }

      const streak = prev.streak === 0 ? 1 : prev.streak
      let params: Params = { ...prev.params, [task.param]: prev.params[task.param] + delta }
      const doneToday = [...prev.doneToday, taskId]
      let todayEarned = prev.todayEarned + delta
      let bonusPackagesToday = prev.bonusPackagesToday

      const justCompletedPackage =
        !bonusPackagesToday.includes(task.packageId) && isPackageCompleteToday(task.packageId, doneToday)
      if (justCompletedPackage) {
        params = { ...params, [task.param]: params[task.param] + PACKAGE_COMPLETE_BONUS }
        todayEarned += PACKAGE_COMPLETE_BONUS
        bonusPackagesToday = [...bonusPackagesToday, task.packageId]
      }

      return { ...prev, params, doneToday, todayEarned, streak, bonusPackagesToday }
    })
  }

  const toggleActivePackage = (packageId: string) => {
    setState((prev) => {
      const isActive = prev.activePackages.includes(packageId)
      if (isActive) {
        return { ...prev, activePackages: prev.activePackages.filter((id) => id !== packageId) }
      }
      if (prev.activePackages.length >= MAX_ACTIVE_PACKAGES) return prev
      return { ...prev, activePackages: [...prev.activePackages, packageId] }
    })
  }

  return { state, isNeglected, toggleTask, toggleActivePackage }
}
