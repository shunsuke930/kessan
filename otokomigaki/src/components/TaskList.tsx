import { useState } from 'react'
import { getTodaysTasks } from '../gameLogic'
import { PACKAGES } from '../packages'

interface TaskListProps {
  activePackages: string[]
  doneToday: string[]
  onToggle: (taskId: string) => void
  onGoToPackages: () => void
}

export function TaskList({ activePackages, doneToday, onToggle, onGoToPackages }: TaskListProps) {
  const [openWhyIds, setOpenWhyIds] = useState<Set<string>>(new Set())

  const todaysTasks = getTodaysTasks(activePackages)
  const doneCount = todaysTasks.filter((task) => doneToday.includes(task.id)).length
  const visiblePackages = PACKAGES.filter((pkg) =>
    todaysTasks.some((task) => task.packageId === pkg.id),
  )

  const toggleWhy = (taskId: string) => {
    setOpenWhyIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  if (visiblePackages.length === 0) {
    return (
      <section className="flex-1 bg-slate-950 px-4 py-6 text-center">
        <p className="mb-3 text-sm text-slate-400">
          パッケージを選ぶとタスクが始まります
        </p>
        <button
          type="button"
          onClick={onGoToPackages}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white active:bg-emerald-700"
        >
          パッケージを選ぶ
        </button>
      </section>
    )
  }

  return (
    <section className="flex-1 overflow-y-auto bg-slate-950 px-4 py-4">
      <h2 className="mb-3 flex items-baseline justify-between text-sm font-semibold text-slate-200">
        <span>今日のタスク</span>
        <span className="text-slate-400">
          {doneCount}/{todaysTasks.length}
        </span>
      </h2>

      <div className="flex flex-col gap-4">
        {visiblePackages.map((pkg) => (
          <div key={pkg.id}>
            <p className="mb-1.5 text-xs font-medium text-slate-500">{pkg.name}</p>
            <ul className="flex flex-col gap-2">
              {todaysTasks
                .filter((task) => task.packageId === pkg.id)
                .map((task) => {
                  const done = doneToday.includes(task.id)
                  const whyOpen = openWhyIds.has(task.id)

                  return (
                    <li key={task.id}>
                      <div
                        className={`rounded-xl border px-3 py-2.5 transition-colors ${
                          done ? 'border-slate-700 bg-slate-800/60' : 'border-slate-800 bg-slate-900'
                        }`}
                      >
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={() => onToggle(task.id)}
                            className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-500"
                          />
                          <span className="mt-0.5 text-lg" role="img" aria-hidden>
                            {task.icon}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              toggleWhy(task.id)
                            }}
                            className="flex-1 text-left"
                          >
                            <span
                              className={`block text-sm ${done ? 'text-slate-500 line-through' : 'text-slate-100'}`}
                            >
                              {task.label}
                            </span>
                          </button>
                          <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
                            +{task.pt}pt
                          </span>
                        </label>

                        {whyOpen && (
                          <p className="mt-2 ml-8 text-[11px] text-slate-400">💡 {task.why}</p>
                        )}
                      </div>
                    </li>
                  )
                })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
