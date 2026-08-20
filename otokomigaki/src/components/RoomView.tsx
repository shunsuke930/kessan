import { getCharacterEmoji, getRoomGrade } from '../gameLogic'

interface RoomViewProps {
  totalLevel: number
}

export function RoomView({ totalLevel }: RoomViewProps) {
  const grade = getRoomGrade(totalLevel)
  const characterEmoji = getCharacterEmoji(totalLevel)

  return (
    <section
      className={`relative flex h-64 items-center justify-center overflow-hidden bg-gradient-to-b ${grade.bg}`}
    >
      <div className="absolute top-3 left-3 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur">
        {grade.emoji} Lv{grade.level} ・ {grade.name}
      </div>
      <div className="absolute top-3 right-3 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur">
        総合Lv {totalLevel.toFixed(1)}
      </div>

      <div className="flex flex-col items-center">
        <span className="text-8xl drop-shadow-lg" role="img" aria-label="キャラクター">
          {characterEmoji}
        </span>
        <div className="mt-2 h-3 w-24 rounded-full bg-black/30 blur-sm" />
      </div>
    </section>
  )
}
