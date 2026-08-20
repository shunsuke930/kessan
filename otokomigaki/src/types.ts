export type ParamKey = 'appearance' | 'communication' | 'skill' | 'assets'

export interface Task {
  id: string
  label: string
  emoji: string
  param: ParamKey
}

export type Params = Record<ParamKey, number>

export interface SaveData {
  date: string
  params: Params
  completedTaskIds: string[]
}
