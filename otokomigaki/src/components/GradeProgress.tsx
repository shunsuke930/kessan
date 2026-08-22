import { getGradeProgress } from '../gameLogic'

interface GradeProgressProps {
  cumulativePoints: number
}

export function GradeProgress({ cumulativePoints }: GradeProgressProps) {
  const progress = getGradeProgress(cumulativePoints)

  return (
    <div className="bg-slate-900 px-4 py-2.5">
      <p className="text-xs text-slate-300">
        {progress.nextGrade
          ? `${progress.nextGrade.name}まで あと ${Math.ceil(progress.remainingPt)}pt`
          : '最上階に到達'}
      </p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-300"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  )
}
