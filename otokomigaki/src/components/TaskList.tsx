import { PARAM_META, POINTS_PER_TASK, TASKS } from '../constants'

interface TaskListProps {
  completedTaskIds: string[]
  onToggle: (taskId: string) => void
}

export function TaskList({ completedTaskIds, onToggle }: TaskListProps) {
  return (
    <section className="flex-1 overflow-y-auto bg-slate-950 px-4 py-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">今日のタスク</h2>
      <ul className="flex flex-col gap-2">
        {TASKS.map((task) => {
          const done = completedTaskIds.includes(task.id)
          const meta = PARAM_META[task.param]

          return (
            <li key={task.id}>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                  done
                    ? 'border-slate-700 bg-slate-800/60'
                    : 'border-slate-800 bg-slate-900 active:bg-slate-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => onToggle(task.id)}
                  className="h-5 w-5 shrink-0 accent-emerald-500"
                />
                <span className="text-lg" role="img" aria-hidden>
                  {task.emoji}
                </span>
                <span
                  className={`flex-1 text-sm ${
                    done ? 'text-slate-500 line-through' : 'text-slate-100'
                  }`}
                >
                  {task.label}
                </span>
                <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
                  {meta.emoji} +{POINTS_PER_TASK}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
