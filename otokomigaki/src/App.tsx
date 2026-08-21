import { useEffect, useRef, useState } from 'react'
import { BottomNav, type View } from './components/BottomNav'
import { DebugPanel } from './components/DebugPanel'
import { Header } from './components/Header'
import { HistoryView } from './components/HistoryView'
import { type OverlayState, Overlay } from './components/Overlay'
import { PackageSelect } from './components/PackageSelect'
import { RoomView } from './components/RoomView'
import { SettingsView } from './components/SettingsView'
import { StatusBars } from './components/StatusBars'
import { TaskList } from './components/TaskList'
import { CHAR_STAGE_UP_MESSAGES } from './constants'
import {
  getCharStage,
  getCumulativePoints,
  getMaxActivePackages,
  getRoomGrade,
  getRoomGradeIndex,
  getTodaysTasks,
  getTotalLevel,
} from './gameLogic'
import { pickRandomQuote, type Quote } from './quotes'
import { useGameState } from './useGameState'

function App() {
  const { state, isNeglected, toggleTask, toggleActivePackage, setDebugPointsOverride } = useGameState()
  const [view, setView] = useState<View>(state.activePackages.length === 0 ? 'packages' : 'main')
  const [overlay, setOverlay] = useState<OverlayState | null>(null)
  const [quote, setQuote] = useState<Quote>(() => pickRandomQuote())
  const cycleQuote = () => setQuote((prev) => pickRandomQuote(prev))

  const totalLevel = getTotalLevel(state.params)
  const cumulativePoints =
    state.debugPointsOverride ?? getCumulativePoints(state.history, state.todayEarned)
  const roomGradeIndex = getRoomGradeIndex(cumulativePoints)
  const roomGrade = getRoomGrade(cumulativePoints)
  const maxActivePackages = getMaxActivePackages(totalLevel)
  const charStage = getCharStage(state.params.look)

  const todaysTasks = getTodaysTasks(state.activePackages)
  const allTasksDoneToday =
    todaysTasks.length > 0 && todaysTasks.every((task) => state.doneToday.includes(task.id))

  const prevLevelRef = useRef(totalLevel)
  const prevGradeIndexRef = useRef(roomGradeIndex)
  const prevMaxActivePackagesRef = useRef(maxActivePackages)
  const prevCharStageRef = useRef(charStage)

  useEffect(() => {
    const prevLevel = prevLevelRef.current
    const prevGradeIndex = prevGradeIndexRef.current
    const prevMaxActivePackages = prevMaxActivePackagesRef.current
    const prevCharStage = prevCharStageRef.current
    prevLevelRef.current = totalLevel
    prevGradeIndexRef.current = roomGradeIndex
    prevMaxActivePackagesRef.current = maxActivePackages
    prevCharStageRef.current = charStage

    if (roomGradeIndex > prevGradeIndex) {
      setOverlay({ type: 'moved', grade: roomGrade })
      const timer = setTimeout(() => setOverlay(null), 2400)
      return () => clearTimeout(timer)
    }
    if (charStage > prevCharStage) {
      setOverlay({ type: 'charStageUp', message: CHAR_STAGE_UP_MESSAGES[charStage] ?? '体が変わってきた' })
      const timer = setTimeout(() => setOverlay(null), 2200)
      return () => clearTimeout(timer)
    }
    if (maxActivePackages > prevMaxActivePackages) {
      setOverlay({ type: 'slotUnlock', slots: maxActivePackages })
      const timer = setTimeout(() => setOverlay(null), 2200)
      return () => clearTimeout(timer)
    }
    if (totalLevel > prevLevel) {
      setOverlay({ type: 'levelup', level: totalLevel })
      const timer = setTimeout(() => setOverlay(null), 1200)
      return () => clearTimeout(timer)
    }
  }, [totalLevel, roomGradeIndex, roomGrade, maxActivePackages, charStage])

  return (
    <div className="flex min-h-screen justify-center bg-black">
      <div className="relative flex w-full max-w-[375px] flex-col bg-slate-950">
        <Header totalLevel={totalLevel} roomGradeName={roomGrade.name} streak={state.streak} />

        {view === 'main' && (
          <>
            <RoomView
              cumulativePoints={cumulativePoints}
              look={state.params.look}
              isNeglected={isNeglected}
              allTasksDoneToday={allTasksDoneToday}
              quote={quote}
              onCharacterTap={cycleQuote}
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
            totalLevel={totalLevel}
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

        {view === 'settings' && <SettingsView />}

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
