import { classToPlain, plainToClass } from 'class-transformer'
import { GameState } from 'src/game/gamestate'
import {
  AfterLoad,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  Unique,
} from 'typeorm'
import { BaseEntity } from './base.entity'

@Entity()
export class GameEntity extends BaseEntity {
  @Column('json', { name: 'state' })
  get rawState(): object {
    return classToPlain(this.state, { groups: ['db'] })
  }
  set rawState(obj: object) {
    this.state = plainToClass(GameState, obj)
  }

  state: GameState = new GameState()
}
