export interface TankEntity {
  x: number
  y: number
  color: number
  name: string
  hearts: number
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
  started: boolean
}

export interface MyState {
  name: string
  range: number
  ap: number
  vote?: string
}

export type Mode = 'move' | 'giveAp' | 'giveHeart' | 'attack' | null
