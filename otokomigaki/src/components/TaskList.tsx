import { useRef, useState } from 'react'
import { PACKAGES } from '../packages'

interface TaskListProps {
  activePackages: string[]
  doneToday: string[]
  onToggle: (taskId: string) => void
  onGoToPackages: () => void
}

interface DragState {
  startX: number
  startScrollLeft: number
  dragging: boolean
}

export function TaskList({ activePackages, doneToday, onToggle, onGoToPackages }: TaskListProps) {
  const [openWhyIds, setOpenWhyIds] = useState<Set<string>>(new Set())
  const [pageIndex, setPageIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)

  const visiblePackages = PACKAGES.filter((pkg) => activePackages.includes(pkg.id))

  const toggleWhy = (taskId: string) => {
    setOpenWhyIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const handleScroll = () => {
    const el = containerRef.current
    if (!el || el.clientWidth === 0) return
    const index = Math.round(el.scrollLeft / el.clientWidth)
    setPageIndex((prev) => (prev === index ? prev : index))
  }

  const scrollToIndex = (index: number) => {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
  }

  // タッチはブラウザ標準のスクロールに任せ、PC(マウス)向けにドラッグでのスワイプだけ追加する
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current
    if (!el) return
    dragRef.current = { startX: e.pageX, startScrollLeft: el.scrollLeft, dragging: true }
  }
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current
    const drag = dragRef.current
    if (!el || !drag?.dragging) return
    el.scrollLeft = drag.startScrollLeft - (e.pageX - drag.startX)
  }
  const endDrag = () => {
    if (dragRef.current) dragRef.current.dragging = false
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

  const currentPackage = visiblePackages[Math.min(pageIndex, visiblePackages.length - 1)]
  const currentDoneCount = currentPackage.tasks.filter((task) => doneToday.includes(task.id)).length

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-950">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-slate-200">{currentPackage.name}</h2>
          <span className="text-xs text-slate-400">
            {currentDoneCount}/{currentPackage.tasks.length}
          </span>
        </div>

        {visiblePackages.length > 1 && (
          <div className="mt-2 flex justify-center gap-1.5">
            {visiblePackages.map((pkg, i) => (
              <button
                key={pkg.id}
                type="button"
                aria-label={`${pkg.name}に切り替える`}
                onClick={() => scrollToIndex(i)}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === pageIndex ? 'bg-emerald-400' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden select-none"
      >
        {visiblePackages.map((pkg) => (
          <div key={pkg.id} className="w-full shrink-0 snap-start overflow-y-auto px-4 pb-4">
            <ul className="flex flex-col gap-2">
              {pkg.tasks.map((task) => {
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
