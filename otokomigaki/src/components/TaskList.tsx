import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { PACKAGES } from '../packages'

interface TaskListProps {
  activePackages: string[]
  doneToday: string[]
  onToggle: (taskId: string) => void
  onGoToPackages: () => void
}

export function TaskList({ activePackages, doneToday, onToggle, onGoToPackages }: TaskListProps) {
  const [openWhyIds, setOpenWhyIds] = useState<Set<string>>(new Set())
  // 閉じたパッケージIDだけを持つ。ここに無いパッケージ（新規解放分も含む）は
  // 常に開いた状態として扱われる（初期状態は全て開く、という要件のため）。
  const [closedPackageIds, setClosedPackageIds] = useState<Set<string>>(new Set())
  // チェックした瞬間だけ、その行に0.4秒の枠光り＋0.8秒の+ptふわっと演出を出す
  const [flashingTaskIds, setFlashingTaskIds] = useState<Set<string>>(new Set())

  const visiblePackages = PACKAGES.filter((pkg) => activePackages.includes(pkg.id))

  const toggleWhy = (taskId: string) => {
    setOpenWhyIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const togglePackageOpen = (packageId: string) => {
    setClosedPackageIds((prev) => {
      const next = new Set(prev)
      if (next.has(packageId)) next.delete(packageId)
      else next.add(packageId)
      return next
    })
  }

  const handleTaskToggle = (taskId: string, alreadyDone: boolean) => {
    onToggle(taskId)
    if (alreadyDone) return
    setFlashingTaskIds((prev) => new Set(prev).add(taskId))
    setTimeout(() => {
      setFlashingTaskIds((prev) => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }, 800)
  }

  if (visiblePackages.length === 0) {
    return (
      <section className="bg-slate-950 px-4 py-6 text-center">
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
    <section className="flex flex-col gap-4 bg-slate-950 px-4 py-4">
      {visiblePackages.map((pkg) => {
        const doneCount = pkg.tasks.filter((task) => doneToday.includes(task.id)).length
        const isOpen = !closedPackageIds.has(pkg.id)

        return (
          <div key={pkg.id}>
            <button
              type="button"
              onClick={() => togglePackageOpen(pkg.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between py-1"
            >
              <h2 className="text-sm font-semibold text-slate-200">{pkg.name}</h2>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                {doneCount}/{pkg.tasks.length}
                <ChevronDown
                  size={16}
                  strokeWidth={2}
                  aria-hidden
                  className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </span>
            </button>

            {isOpen && (
              <ul className="mt-2 flex flex-col gap-2">
                {pkg.tasks.map((task) => {
                  const done = doneToday.includes(task.id)
                  const whyOpen = openWhyIds.has(task.id)
                  const isFlashing = flashingTaskIds.has(task.id)

                  return (
                    <li key={task.id}>
                      <div
                        className={`relative rounded-xl border px-3 py-2.5 transition-colors ${
                          done ? 'border-slate-700 bg-slate-800/60' : 'border-slate-800 bg-slate-900'
                        } ${isFlashing ? 'animate-check-glow' : ''}`}
                      >
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={() => handleTaskToggle(task.id, done)}
                            className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-500"
                          />
                          <task.icon
                            size={18}
                            strokeWidth={1.5}
                            aria-hidden
                            className={`mt-0.5 shrink-0 ${done ? 'text-emerald-400' : 'text-slate-300'}`}
                          />
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
                          <span className="relative shrink-0">
                            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
                              +{task.pt}pt
                            </span>
                            {isFlashing && (
                              <span className="pt-float animate-float-pt absolute -top-1 right-0 text-[11px] font-semibold text-emerald-400">
                                +{task.pt}pt
                              </span>
                            )}
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
            )}
          </div>
        )
      })}
    </section>
  )
}
