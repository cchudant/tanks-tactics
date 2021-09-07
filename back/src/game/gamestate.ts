import { Expose } from 'class-transformer'

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

  @Expose({ groups: ['me', 'db'] })
  ap: number = 1
  @Expose({ groups: ['me', 'db'] })
  range: number = 2
  @Expose({ groups: ['me', 'db'] })
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
  tanks: TankEntity[] = []
  hearts: HeartEntity[] = []
  end: boolean = false
  started: boolean = true

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
