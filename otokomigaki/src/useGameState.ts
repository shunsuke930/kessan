import { useEffect, useState } from 'react'
import { INITIAL_PARAMS, POINTS_PER_TASK, STORAGE_KEY, TASKS } from './constants'
import type { Params, SaveData } from './types'

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function loadInitialState(): SaveData {
  const today = getTodayKey()
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return { date: today, params: { ...INITIAL_PARAMS }, completedTaskIds: [] }
  }

  try {
    const parsed = JSON.parse(raw) as SaveData
    const params = { ...INITIAL_PARAMS, ...parsed.params }
    // 日付が変わっていたら今日分のチェック状態だけリセットする
    if (parsed.date !== today) {
      return { date: today, params, completedTaskIds: [] }
    }
    return { date: today, params, completedTaskIds: parsed.completedTaskIds ?? [] }
  } catch {
    return { date: today, params: { ...INITIAL_PARAMS }, completedTaskIds: [] }
  }
}

export function useGameState() {
  const [state, setState] = useState<SaveData>(loadInitialState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const toggleTask = (taskId: string) => {
    const task = TASKS.find((t) => t.id === taskId)
    if (!task) return

    setState((prev) => {
      const isDone = prev.completedTaskIds.includes(taskId)
      const delta = isDone ? -POINTS_PER_TASK : POINTS_PER_TASK
      const params: Params = {
        ...prev.params,
        [task.param]: Math.max(0, prev.params[task.param] + delta),
      }
      const completedTaskIds = isDone
        ? prev.completedTaskIds.filter((id) => id !== taskId)
        : [...prev.completedTaskIds, taskId]

      return { ...prev, params, completedTaskIds }
    })
  }

  return { params: state.params, completedTaskIds: state.completedTaskIds, toggleTask }
}
