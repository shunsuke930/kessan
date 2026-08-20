import { RoomView } from './components/RoomView'
import { StatusBars } from './components/StatusBars'
import { TaskList } from './components/TaskList'
import { getTotalLevel } from './gameLogic'
import { useGameState } from './useGameState'

function App() {
  const { params, completedTaskIds, toggleTask } = useGameState()
  const totalLevel = getTotalLevel(params)

  return (
    <div className="flex min-h-screen justify-center bg-black">
      <div className="flex w-full max-w-[375px] flex-col bg-slate-950">
        <RoomView totalLevel={totalLevel} />
        <StatusBars params={params} />
        <TaskList completedTaskIds={completedTaskIds} onToggle={toggleTask} />
      </div>
    </div>
  )
}

export default App
