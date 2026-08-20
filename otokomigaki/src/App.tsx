import { useEffect, useRef, useState } from 'react'
import { BottomNav, type View } from './components/BottomNav'
import { DebugPanel } from './components/DebugPanel'
import { Header } from './components/Header'
import { HistoryView } from './components/HistoryView'
import { type OverlayState, Overlay } from './components/Overlay'
import { PackageSelect } from './components/PackageSelect'
import { RoomView } from './components/RoomView'
import { StatusBars } from './components/StatusBars'
import { TaskList } from './components/TaskList'
import { getCumulativePoints, getRoomGrade, getRoomGradeIndex, getTotalLevel } from './gameLogic'
import { PACKAGES } from './packages'
import { useGameState } from './useGameState'

function App() {
  const { state, isNeglected, toggleTask, toggleActivePackage, setDebugPointsOverride } = useGameState()
  const [view, setView] = useState<View>(state.activePackages.length === 0 ? 'packages' : 'main')
  const [overlay, setOverlay] = useState<OverlayState | null>(null)

  const totalLevel = getTotalLevel(state.params)
  const cumulativePoints =
    state.debugPointsOverride ?? getCumulativePoints(state.history, state.todayEarned)
  const roomGradeIndex = getRoomGradeIndex(cumulativePoints)
  const roomGrade = getRoomGrade(cumulativePoints)

  const visibleTasks = PACKAGES.filter((pkg) => state.activePackages.includes(pkg.id)).flatMap(
    (pkg) => pkg.tasks,
  )
  const allTasksDoneToday =
    visibleTasks.length > 0 && visibleTasks.every((task) => state.doneToday.includes(task.id))

  const prevLevelRef = useRef(totalLevel)
  const prevGradeIndexRef = useRef(roomGradeIndex)

  useEffect(() => {
    const prevLevel = prevLevelRef.current
    const prevGradeIndex = prevGradeIndexRef.current
    prevLevelRef.current = totalLevel
    prevGradeIndexRef.current = roomGradeIndex

    if (roomGradeIndex > prevGradeIndex) {
      setOverlay({ type: 'moved', grade: roomGrade })
      const timer = setTimeout(() => setOverlay(null), 2400)
      return () => clearTimeout(timer)
    }
    if (totalLevel > prevLevel) {
      setOverlay({ type: 'levelup', level: totalLevel })
      const timer = setTimeout(() => setOverlay(null), 1200)
      return () => clearTimeout(timer)
    }
  }, [totalLevel, roomGradeIndex, roomGrade])

  return (
    <div className="flex min-h-screen justify-center bg-black">
      <div className="relative flex w-full max-w-[375px] flex-col bg-slate-950">
        <Header totalLevel={totalLevel} roomGradeName={roomGrade.name} streak={state.streak} />

        {view === 'main' && (
          <>
            <RoomView
              cumulativePoints={cumulativePoints}
              isNeglected={isNeglected}
              allTasksDoneToday={allTasksDoneToday}
            />
            <StatusBars params={state.params} />
            <TaskList
              activePackages={state.activePackages}
              doneToday={state.doneToday}
              onToggle={toggleTask}
              onGoToPackages={() => setView('packages')}
            />
          </>
        )}

        {view === 'packages' && (
          <PackageSelect
            activePackages={state.activePackages}
            onToggle={toggleActivePackage}
            onDone={() => setView('main')}
          />
        )}

        {view === 'history' && (
          <HistoryView
            history={state.history}
            todayEarned={state.todayEarned}
            streak={state.streak}
            params={state.params}
          />
        )}

        <BottomNav view={view} onChange={setView} />

        <Overlay overlay={overlay} />

        <DebugPanel
          effectivePoints={cumulativePoints}
          isOverridden={state.debugPointsOverride !== null}
          onSetOverride={setDebugPointsOverride}
          onClearOverride={() => setDebugPointsOverride(null)}
        />
      </div>
    </div>
  )
}

export default App
