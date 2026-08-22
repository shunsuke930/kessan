import { useEffect, useState } from 'react'
import { NEGLECT_DAYS_THRESHOLD, PACKAGE_COMPLETE_BONUS, STORAGE_KEY } from './constants'
import {
  dateKey,
  daysBetween,
  getMaxActivePackages,
  getStreakMultiplier,
  getTodaysTasks,
  getTotalLevel,
  isPackageCompleteToday,
} from './gameLogic'
import { PACKAGES_BY_ID, TASKS_BY_ID } from './packages'
import type { Params, SaveData } from './types'

const INITIAL_PARAMS: Params = { look: 0, mind: 0, comm: 0, skill: 0 }

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
    debugPointsOverride: null,
  }
}

/** 旧スキーマ（look/comm/skill/asset）からの移行。assetはskillへ統合し、mindは0から開始する */
function migrateParams(raw: Partial<Params> & { asset?: number } | undefined): Params {
  return {
    look: raw?.look ?? 0,
    mind: raw?.mind ?? 0,
    comm: raw?.comm ?? 0,
    skill: (raw?.skill ?? 0) + (raw?.asset ?? 0),
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
      params: migrateParams(parsed.params),
      // 旧パッケージ/タスクIDは現行の定義に存在しないため自然に除外される
      activePackages: (parsed.activePackages ?? []).filter((id) => id in PACKAGES_BY_ID),
      doneToday: (parsed.doneToday ?? []).filter((id) => id in TASKS_BY_ID),
      bonusPackagesToday: (parsed.bonusPackagesToday ?? []).filter((id) => id in PACKAGES_BY_ID),
      todayEarned: parsed.todayEarned ?? 0,
      lastOpenDate: parsed.lastOpenDate ?? today,
      streak: parsed.streak ?? 0,
      history: parsed.history ?? [],
      debugPointsOverride: parsed.debugPointsOverride ?? null,
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
  /** タスクをチェックする(完了にする)たびに増える。演出のトリガー用でlocalStorageには保存しない */
  const [checkPulse, setCheckPulse] = useState(0)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const isNeglected = loadResult.gapDaysAtLoad >= NEGLECT_DAYS_THRESHOLD && state.doneToday.length === 0

  const toggleTask = (taskId: string) => {
    const task = TASKS_BY_ID[taskId]
    if (!task || !state.activePackages.includes(task.packageId)) return

    if (!state.doneToday.includes(taskId)) {
      setCheckPulse((p) => p + 1)
    }

    setState((prev) => {
      const isDone = prev.doneToday.includes(taskId)
      const multiplier = getStreakMultiplier(prev.streak)
      const delta = task.pt * multiplier

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

      const todaysTasks = getTodaysTasks(prev.activePackages)
      const justCompletedPackage =
        !bonusPackagesToday.includes(task.packageId) &&
        isPackageCompleteToday(task.packageId, doneToday, todaysTasks)
      if (justCompletedPackage) {
        params = { ...params, [task.param]: params[task.param] + PACKAGE_COMPLETE_BONUS }
        todayEarned += PACKAGE_COMPLETE_BONUS
        bonusPackagesToday = [...bonusPackagesToday, task.packageId]
      }

      return { ...prev, params, doneToday, todayEarned, streak, bonusPackagesToday }
    })
  }

  const setDebugPointsOverride = (value: number | null) => {
    setState((prev) => ({ ...prev, debugPointsOverride: value }))
  }

  const toggleActivePackage = (packageId: string) => {
    setState((prev) => {
      const isActive = prev.activePackages.includes(packageId)
      if (isActive) {
        return { ...prev, activePackages: prev.activePackages.filter((id) => id !== packageId) }
      }
      const maxActive = getMaxActivePackages(getTotalLevel(prev.params))
      if (prev.activePackages.length >= maxActive) return prev
      return { ...prev, activePackages: [...prev.activePackages, packageId] }
    })
  }

  return { state, isNeglected, checkPulse, toggleTask, toggleActivePackage, setDebugPointsOverride }
}
