export interface TankEntity {
  x: number
  y: number
  color: number
  name: string
  hearts: number

  // admin only
  ap?: number
  range?: number
  vote?: string
}
export interface HeartEntity {
  x: number
  y: number
}

export interface GameState {
  width: number
  height: number
  tanks: TankEntity[]
  hearts: HeartEntity[]
  end: boolean
  paused: boolean

  currentDay: number
  endDay: number

  winner?: string

  isEndgame: boolean
  lastVoted?: string
}

export interface MyState extends TankEntity {
  range: number
  ap: number
  vote?: string
}
