import { MAX_ACTIVE_PACKAGES, PARAM_META } from '../constants'
import { PACKAGES } from '../packages'

interface PackageSelectProps {
  activePackages: string[]
  onToggle: (packageId: string) => void
  onDone: () => void
}

export function PackageSelect({ activePackages, onToggle, onDone }: PackageSelectProps) {
  const isFull = activePackages.length >= MAX_ACTIVE_PACKAGES

  return (
    <section className="flex-1 overflow-y-auto bg-slate-950 px-4 py-4">
      <h2 className="text-sm font-semibold text-slate-200">パッケージを選ぶ</h2>
      <p className="mt-1 text-xs text-slate-500">
        最大{MAX_ACTIVE_PACKAGES}つまで有効にできます（{activePackages.length}/{MAX_ACTIVE_PACKAGES}）
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {PACKAGES.map((pkg) => {
          const active = activePackages.includes(pkg.id)
          const disabled = !active && isFull
          const meta = PARAM_META[pkg.param]

          return (
            <li key={pkg.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onToggle(pkg.id)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                  active
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : disabled
                      ? 'border-slate-800 bg-slate-900/50 opacity-50'
                      : 'border-slate-800 bg-slate-900 active:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-100">
                    {meta.emoji} {pkg.name}
                  </span>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                      active ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-600 text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {pkg.tasks.map((t) => t.icon).join(' ')} ／ {pkg.tasks.length}タスク ／ {meta.label}が上がる
                </p>
              </button>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        onClick={onDone}
        disabled={activePackages.length === 0}
        className="mt-6 w-full rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white active:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-500"
      >
        これで始める
      </button>
    </section>
  )
}
