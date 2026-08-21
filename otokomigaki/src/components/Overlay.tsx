import type { RoomGrade } from '../constants'

export type OverlayState =
  | { type: 'levelup'; level: number }
  | { type: 'moved'; grade: RoomGrade }
  | { type: 'slotUnlock'; slots: number }

interface OverlayProps {
  overlay: OverlayState | null
}

export function Overlay({ overlay }: OverlayProps) {
  if (!overlay) return null

  if (overlay.type === 'levelup') {
    return (
      <div className="absolute inset-0 z-50 flex animate-flash items-center justify-center bg-white/20 backdrop-blur-sm">
        <span className="text-5xl font-bold text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]">
          Lv.{overlay.level}
        </span>
      </div>
    )
  }

  if (overlay.type === 'slotUnlock') {
    return (
      <div className="absolute inset-x-4 top-16 z-50 animate-toast rounded-xl border border-emerald-400/50 bg-slate-950/95 px-4 py-3 text-center shadow-xl">
        <p className="text-2xl">📦✨</p>
        <p className="mt-1 text-sm font-bold text-emerald-300">パッケージ枠が解放されました！</p>
        <p className="text-xs text-slate-400">同時に{overlay.slots}つまで有効化できます</p>
      </div>
    )
  }

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-gradient-to-b text-center text-white ${overlay.grade.bg}`}
    >
      <span className="text-6xl">{overlay.grade.emoji}</span>
      <p className="text-lg font-bold tracking-wide">引っ越し完了</p>
      <p className="text-sm text-white/80">{overlay.grade.name}</p>
    </div>
  )
}
