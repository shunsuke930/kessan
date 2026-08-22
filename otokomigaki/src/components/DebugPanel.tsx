import { useState } from 'react'
import { ROOM_GRADES } from '../constants'

interface DebugPanelProps {
  effectivePoints: number
  isOverridden: boolean
  onSetOverride: (value: number) => void
  onClearOverride: () => void
}

export function DebugPanel({
  effectivePoints,
  isOverridden,
  onSetOverride,
  onClearOverride,
}: DebugPanelProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(String(effectivePoints))

  const applyInput = () => {
    const value = Number(inputValue)
    if (Number.isFinite(value)) onSetOverride(Math.max(0, Math.round(value)))
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setInputValue(String(effectivePoints))
          setOpen((v) => !v)
        }}
        aria-label="デバッグパネルを開閉"
        className="fixed right-3 bottom-16 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-base text-white shadow-lg backdrop-blur"
      >
        🐛
      </button>

      {open && (
        <div className="fixed inset-x-2 bottom-28 z-30 mx-auto max-w-[calc(375px-1rem)] rounded-xl border border-amber-500/40 bg-slate-950/95 p-3 text-slate-100 shadow-xl backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-400">デバッグパネル</p>
            {isOverridden && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300">
                上書き中
              </span>
            )}
          </div>

          <label className="mb-2 flex items-center gap-2 text-xs text-slate-300">
            累計ポイント
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyInput()}
              className="w-24 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-right text-slate-100"
            />
            <button
              type="button"
              onClick={applyInput}
              className="rounded-md bg-amber-600 px-2 py-1 text-[11px] font-medium text-white active:bg-amber-700"
            >
              設定
            </button>
          </label>

          <p className="mb-1 text-[11px] text-slate-500">部屋グレードに即切り替え</p>
          <div className="mb-2 grid grid-cols-5 gap-1.5">
            {ROOM_GRADES.map((grade) => (
              <button
                key={grade.level}
                type="button"
                onClick={() => {
                  setInputValue(String(grade.requiredPt))
                  onSetOverride(grade.requiredPt)
                }}
                className="rounded-md bg-slate-800 py-1.5 text-xs font-medium text-slate-100 active:bg-slate-700"
              >
                Lv{grade.level}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClearOverride}
            disabled={!isOverridden}
            className="w-full rounded-md border border-slate-700 py-1.5 text-xs text-slate-300 disabled:opacity-40"
          >
            上書きを解除（実データに戻す）
          </button>
        </div>
      )}
    </>
  )
}
