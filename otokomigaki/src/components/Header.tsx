interface HeaderProps {
  totalLevel: number
  streak: number
}

export function Header({ totalLevel, streak }: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-2 bg-slate-900 px-4 py-2.5 text-sm text-slate-100">
      <span className="font-semibold">Lv.{totalLevel}</span>
      <span className="flex items-center gap-1 font-medium">
        🔥{streak}日
      </span>
    </header>
  )
}
