import { PARAM_META } from '../constants'
import { MAX_POSSIBLE_PACKAGE_SLOTS, getMaxActivePackages, getSlotUnlockLevel } from '../gameLogic'
import { PACKAGES, PACKAGES_BY_ID } from '../packages'

interface PackageSelectProps {
  activePackages: string[]
  totalLevel: number
  onToggle: (packageId: string) => void
  onDone: () => void
}

export function PackageSelect({ activePackages, totalLevel, onToggle, onDone }: PackageSelectProps) {
  const maxActive = getMaxActivePackages(totalLevel)
  const isFull = activePackages.length >= maxActive

  return (
    <section className="flex-1 overflow-y-auto bg-slate-950 px-4 py-4">
      <h2 className="text-sm font-semibold text-slate-200">パッケージを選ぶ</h2>
      <p className="mt-1 text-xs text-slate-500">
        今は{maxActive}つまで有効にできます（{activePackages.length}/{maxActive}）
      </p>

      <div className="mt-3 flex gap-1.5">
        {Array.from({ length: MAX_POSSIBLE_PACKAGE_SLOTS }).map((_, i) => {
          const filledPackageId = activePackages[i]
          const unlockLevel = getSlotUnlockLevel(i)
          const unlocked = i < maxActive

          if (filledPackageId) {
            const pkg = PACKAGES_BY_ID[filledPackageId]
            return (
              <div
                key={i}
                className="flex flex-1 items-center justify-center rounded-lg border border-emerald-500 bg-emerald-500/10 py-2 text-center text-[11px] text-emerald-300"
              >
                {pkg?.name ?? ''}
              </div>
            )
          }

          if (unlocked) {
            return (
              <div
                key={i}
                className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-700 py-2 text-center text-[11px] text-slate-600"
              >
                空き
              </div>
            )
          }

          return (
            <div
              key={i}
              className="flex flex-1 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 py-2 text-center text-[11px] text-slate-600"
            >
              Lv{unlockLevel}で解放
            </div>
          )
        })}
      </div>

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
