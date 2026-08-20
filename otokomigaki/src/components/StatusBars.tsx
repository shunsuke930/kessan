import { PARAM_META, PARAM_ORDER } from '../constants'
import type { Params } from '../types'

const BAR_MAX = 100

interface StatusBarsProps {
  params: Params
}

export function StatusBars({ params }: StatusBarsProps) {
  return (
    <section className="flex flex-col gap-2.5 bg-slate-900 px-4 py-4">
      {PARAM_ORDER.map((key) => {
        const meta = PARAM_META[key]
        const value = params[key]
        const percent = Math.min(100, (value / BAR_MAX) * 100)

        return (
          <div key={key} className="flex items-center gap-2">
            <span className="w-6 text-center text-lg" role="img" aria-hidden>
              {meta.emoji}
            </span>
            <span className="w-16 shrink-0 text-xs text-slate-300">{meta.label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-700">
              <div
                className={`h-full rounded-full ${meta.bar} transition-all duration-300`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-xs tabular-nums text-slate-400">
              {Math.round(value)}
            </span>
          </div>
        )
      })}
    </section>
  )
}
