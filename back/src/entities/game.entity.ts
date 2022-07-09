import { instanceToPlain, plainToInstance } from 'class-transformer'
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
  @Column('json', {
    transformer: {
      to: value => instanceToPlain(value, { groups: ['db'] }),
      from: value => plainToInstance(GameState, value, { groups: ['db'] }),
    },
  })
  state: GameState = new GameState()
}
