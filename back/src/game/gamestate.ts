import { Expose, plainToInstance, Type } from 'class-transformer'

export abstract class Entity {
  x!: number
  y!: number
}

export class TankEntity extends Entity {
  constructor(
    public x: number,
    public y: number,
    public color: number,
    public name: string,
    public userId: string,
  ) {
    super()
  }

  hearts: number = 3

  @Expose({ groups: ['me', 'db', 'admin'] })
  ap: number = 1
  @Expose({ groups: ['me', 'db', 'admin'] })
  range: number = 2
  @Expose({ groups: ['me', 'db', 'admin'] })
  vote?: string // name of the player
}
export class HeartEntity extends Entity {
  constructor(public x: number, public y: number) {
    super()
  }
}

export class GameState {
  width: number = 20
  height: number = 12
  @Type(() => TankEntity)
  tanks: TankEntity[] = []
  @Type(() => HeartEntity)
  hearts: HeartEntity[] = []
  end: boolean = false
  paused: boolean = true

  currentDay: number = 1
  endDay: number = 14

  winner?: string
  lastVoted?: string

  @Expose()
  get isEndgame() {
    return this.currentDay > this.endDay
  }

  canPlay(): boolean {
    return !this.end && !this.paused
  }

  getEntity(x: number, y: number): Entity | undefined {
    const heart = this.hearts.find(h => h.x === x && h.y === y)
    if (heart) return heart
    return this.tanks.find(h => h.x === x && h.y === y)
  }

  getTankByName(name: string): TankEntity | undefined {
    return this.tanks.find(t => t.name === name)
  }
  getTankById(id: string): TankEntity | undefined {
    return this.tanks.find(t => t.userId === id)
  }
}

export class PersonalizedGameState {}
