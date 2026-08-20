export type ParamKey = 'look' | 'comm' | 'skill' | 'asset'

export type Params = Record<ParamKey, number>

export interface Task {
  id: string
  label: string
  packageId: string
  param: ParamKey
  icon: string
  why: string
}

export interface Package {
  id: string
  name: string
  param: ParamKey
  tasks: Task[]
}

export interface SaveData {
  params: Params
  activePackages: string[]
  doneToday: string[]
  /** このpackageIdは今日すでに全タスク達成ボーナス(+3)を受け取った */
  bonusPackagesToday: string[]
  /** 今日獲得した合計pt（streak倍率込み）。日付が変わるとhistoryに積まれてリセットされる */
  todayEarned: number
  lastOpenDate: string
  streak: number
  history: { date: string; earned: number }[]
}
