import { getCharacterEmoji, getRoomGrade } from '../gameLogic'

interface RoomViewProps {
  cumulativePoints: number
  isNeglected: boolean
  allTasksDoneToday: boolean
}

export function RoomView({ cumulativePoints, isNeglected, allTasksDoneToday }: RoomViewProps) {
  const grade = getRoomGrade(cumulativePoints)
  const characterEmoji = getCharacterEmoji(cumulativePoints, isNeglected)

  return (
    <section
      className={`relative flex h-[40vh] min-h-56 items-center justify-center overflow-hidden bg-gradient-to-b transition-colors duration-700 ${
        isNeglected ? 'from-stone-800 to-stone-950 grayscale' : grade.bg
      }`}
    >
      {isNeglected && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur">
          おかえり
        </div>
      )}

      {isNeglected && (
        <span className="absolute top-10 left-8 text-2xl opacity-70" aria-hidden>
          🗑️
        </span>
      )}
      {isNeglected && (
        <span className="absolute top-16 right-10 text-2xl opacity-70" aria-hidden>
          🪰
        </span>
      )}

      <div className="flex flex-col items-center">
        <span
          key={allTasksDoneToday ? 'done' : 'normal'}
          className={`text-8xl drop-shadow-lg ${allTasksDoneToday ? 'animate-bounce-once' : ''}`}
          role="img"
          aria-label="キャラクター"
        >
          {characterEmoji}
        </span>
        <div className="mt-2 h-3 w-24 rounded-full bg-black/30 blur-sm" />
      </div>
    </section>
  )
}
