import { useEffect, useRef, useState } from 'react'
import { getCharImageSrc, getRoomImageSrc } from '../assetImages'
import { CHARACTER_STAGES, NEGLECTED_CHARACTER } from '../constants'
import { getCharStage, getRoomGrade } from '../gameLogic'
import type { Quote } from '../quotes'
import { QuoteBubble } from './QuoteBubble'

interface RoomViewProps {
  cumulativePoints: number
  look: number
  isNeglected: boolean
  allTasksDoneToday: boolean
  quote: Quote
  onCharacterTap: () => void
}

interface ImageLayer {
  src: string
  key: number
}

/** 部屋グレードの画像が切り替わるとき、直前の画像を残しつつ新しい画像をフェードインしてクロスフェードにする */
function useCrossfadeLayers(src: string | null, durationMs: number): ImageLayer[] {
  const [layers, setLayers] = useState<ImageLayer[]>(src ? [{ src, key: 0 }] : [])
  const keyRef = useRef(0)

  useEffect(() => {
    setLayers((prev) => {
      const currentTop = prev[prev.length - 1]?.src ?? null
      if (currentTop === src) return prev
      if (!src) return []
      keyRef.current += 1
      return [...prev, { src, key: keyRef.current }]
    })
  }, [src])

  useEffect(() => {
    if (layers.length <= 1) return
    const timer = setTimeout(() => {
      setLayers((prev) => prev.slice(-1))
    }, durationMs)
    return () => clearTimeout(timer)
  }, [layers, durationMs])

  return layers
}

export function RoomView({
  cumulativePoints,
  look,
  isNeglected,
  allTasksDoneToday,
  quote,
  onCharacterTap,
}: RoomViewProps) {
  const grade = getRoomGrade(cumulativePoints)
  const charStage = getCharStage(look)
  const roomImageSrc = getRoomImageSrc(grade.level)
  const charImageSrc = getCharImageSrc(charStage)
  const charEmojiFallback = CHARACTER_STAGES[charStage - 1]

  const roomLayers = useCrossfadeLayers(roomImageSrc, 700)

  return (
    <section
      className={`relative flex h-[40vh] min-h-56 items-end justify-center overflow-hidden bg-gradient-to-b pb-6 transition-colors duration-700 ${
        isNeglected ? 'from-stone-800 to-stone-950 grayscale' : roomImageSrc ? '' : grade.bg
      }`}
    >
      {roomLayers.map((layer, i) => (
        <img
          key={layer.key}
          src={layer.src}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover ${
            i === roomLayers.length - 1 ? 'animate-crossfade' : ''
          } ${isNeglected ? 'grayscale' : ''}`}
          style={{ imageRendering: 'pixelated' }}
        />
      ))}

      <QuoteBubble quote={quote} />

      {isNeglected && (
        <div className="absolute top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur">
          おかえり
        </div>
      )}
      {isNeglected && (
        <span className="absolute top-10 left-8 z-10 text-2xl opacity-70" aria-hidden>
          🗑️
        </span>
      )}
      {isNeglected && (
        <span className="absolute top-16 right-10 z-10 text-2xl opacity-70" aria-hidden>
          🪰
        </span>
      )}

      <button
        type="button"
        onClick={onCharacterTap}
        aria-label="キャラクターをタップして名言を切り替える"
        className={`relative z-10 flex flex-col items-center border-0 bg-transparent p-0 ${
          allTasksDoneToday ? 'animate-bounce-once' : ''
        }`}
      >
        {charImageSrc ? (
          <img
            src={charImageSrc}
            alt="キャラクター"
            className={`h-56 w-32 ${isNeglected ? 'grayscale' : ''}`}
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <span className="text-8xl drop-shadow-lg" role="img" aria-label="キャラクター">
            {isNeglected ? NEGLECTED_CHARACTER : charEmojiFallback}
          </span>
        )}
        <div className="mt-1 h-3 w-24 rounded-full bg-black/30 blur-sm" />
      </button>
    </section>
  )
}
