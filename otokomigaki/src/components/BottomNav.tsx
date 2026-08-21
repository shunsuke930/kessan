export type View = 'main' | 'packages' | 'history' | 'settings'

interface BottomNavProps {
  view: View
  onChange: (view: View) => void
}

const ITEMS: { key: View; label: string; icon: string }[] = [
  { key: 'main', label: 'ホーム', icon: '🏠' },
  { key: 'packages', label: 'パッケージ', icon: '📦' },
  { key: 'history', label: '記録', icon: '📅' },
  { key: 'settings', label: '設定', icon: '⚙️' },
]

export function BottomNav({ view, onChange }: BottomNavProps) {
  return (
    <nav className="flex border-t border-slate-800 bg-slate-900">
      {ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
            view === item.key ? 'text-emerald-400' : 'text-slate-500'
          }`}
        >
          <span className="text-lg" aria-hidden>
            {item.icon}
          </span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}
