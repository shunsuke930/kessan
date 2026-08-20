import { dateKey } from '../gameLogic'
import { StatusBars } from './StatusBars'
import type { Params } from '../types'

interface HistoryViewProps {
  history: { date: string; earned: number }[]
  todayEarned: number
  streak: number
  params: Params
}

const DAYS_TO_SHOW = 35

function levelColor(earned: number): string {
  if (earned <= 0) return 'bg-slate-800'
  if (earned < 3) return 'bg-emerald-900'
  if (earned < 6) return 'bg-emerald-700'
  if (earned < 9) return 'bg-emerald-500'
  return 'bg-emerald-400'
}

export function HistoryView({ history, todayEarned, streak, params }: HistoryViewProps) {
  const today = dateKey(new Date())
  const earnedByDate = new Map(history.map((entry) => [entry.date, entry.earned]))
  earnedByDate.set(today, todayEarned)

  const days: { date: string; earned: number }[] = []
  for (let i = DAYS_TO_SHOW - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = dateKey(d)
    days.push({ date: key, earned: earnedByDate.get(key) ?? 0 })
  }

  return (
    <section className="flex-1 overflow-y-auto bg-slate-950 px-4 py-4">
      <h2 className="text-sm font-semibold text-slate-200">記録</h2>
      <p className="mt-1 text-xs text-slate-500">🔥 連続{streak}日達成中</p>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {days.map((day) => (
          <div
            key={day.date}
            title={`${day.date}: ${Math.round(day.earned)}pt`}
            className={`aspect-square rounded ${levelColor(day.earned)}`}
          />
        ))}
      </div>

      <h3 className="mt-6 mb-2 text-xs font-semibold text-slate-400">パラメータ推移（現在値）</h3>
      <div className="-mx-4">
        <StatusBars params={params} />
      </div>
    </section>
  )
}
