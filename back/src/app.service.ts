import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { Cron } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { classToPlain } from 'class-transformer'
import { EntityManager, Repository } from 'typeorm'
import { UserSession } from './auth/user.session'
import { GameEntity } from './entities/game.entity'
import { UserEntity } from './entities/user.entity'
import { GameGateway } from './game.gateway'
import { GameState, HeartEntity, TankEntity } from './game/gamestate'

export class GameStateEvent {
  constructor(public gameState: GameState) {}
}

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name)

  constructor(
    @InjectRepository(GameEntity)
    private gameRepository: Repository<GameEntity>,
    private eventEmitter: EventEmitter2,
    private entityManager: EntityManager,
  ) {}

  async getGame(): Promise<GameEntity> {
    const res = await this.gameRepository.find({
      take: 1,
    })
    if (!res[0]) {
      return this.gameRepository.create()
    }
    return res[0]
  }

  async saveGame(game: GameEntity): Promise<void> {
    await this.gameRepository.save(game)
    this.eventEmitter.emit('gamestate.update', new GameStateEvent(game.state))
  }

  async giveApToPlayer(source: string, target: string) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state

      const src = state.getTankByName(source)
      const trg = state.getTankByName(target)

      // check: source exists, target exists, range, enough AP, source is not target

      if (!src || !trg) throw new BadRequestException('Tank does not exist')

      if (src === trg) throw new BadRequestException('Cannot apply action to yourself')

      if (!this.isInRange(src, trg, src.range))
        throw new BadRequestException('Too far away')

      if (src.ap < 1) throw new BadRequestException('Not enough AP')

      // mutate state
      src.ap -= 1
      trg.ap += 1

      await this.saveGame(game)
    })
  }

  async giveHeartToPlayer(source: string, target: string) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state

      const src = state.getTankByName(source)
      const trg = state.getTankByName(target)

      // check: source exists, target exists, range, enough hearts, source is not target

      if (!src || !trg) throw new BadRequestException('Tank does not exist')

      if (src === trg) throw new BadRequestException('Cannot apply action to yourself')

      if (!this.isInRange(src, trg, src.range))
        throw new BadRequestException('Too far away')

      if (src.hearts < 1) throw new BadRequestException('Not enough hearts')

      // mutate state
      src.hearts -= 1
      trg.hearts += 1

      await this.saveGame(game)
    })
  }

  async upgradeRange(source: string) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state

      const src = state.getTankByName(source)

      // check: tank exists, enough ap

      if (!src) throw new BadRequestException('Tank does not exist')

      if (src.ap < 3) throw new BadRequestException('Not enough AP')

      // mutate state
      src.ap -= 3
      src.range += 1

      await this.saveGame(game)
    })
  }

  async move(source: string, target: { x: number; y: number }) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state

      const src = state.getTankByName(source)

      // check: tank exists, range, enough AP, target square is occupied by tank
      // special case: move into square occupied by a heart

      if (!src) throw new BadRequestException('Tank does not exist')

      if (!this.isInRange(src, target, 1))
        // range is one!
        throw new BadRequestException('Too far away')

      if (src.ap < 1) throw new BadRequestException('Not enough AP')

      const occupied = state.getEntity(target.x, target.y)
      if (occupied && !(occupied instanceof HeartEntity))
        throw new BadRequestException('Square is occupied')

      // mutate state
      src.ap -= 1
      src.x = target.x
      src.y = target.y

      if (occupied) {
        const heartIndex = state.hearts.indexOf(occupied!)
        state.hearts.splice(heartIndex, 1) // delete the heart
        src.hearts += 1
      }

      await this.saveGame(game)
    })
  }

  async attack(source: string, target: string) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state

      const src = state.getTankByName(source)
      const trg = state.getTankByName(target)

      // check: source exists, target exists, range, enough AP, target not dead, source is not target

      if (!src || !trg) throw new BadRequestException('Tank does not exist')

      if (src === trg) throw new BadRequestException('Cannot apply action to yourself')

      if (!this.isInRange(src, trg, src.range))
        throw new BadRequestException('Too far away')

      if (src.ap < 1) throw new BadRequestException('Not enough AP')

      if (trg.hearts <= 0)
        throw new BadRequestException('Traget is already dead')

      // mutate state
      src.ap -= 1
      trg.hearts -= 1

      await this.saveGame(game)
    })
  }

  async buyHeart(source: string) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state

      const src = state.getTankByName(source)

      // check: tank exists, enough ap

      if (!src) throw new BadRequestException('Tank does not exist')

      if (src.ap < 3) throw new BadRequestException('Not enough AP')

      // mutate state
      src.hearts += 1
      src.ap -= 3

      await this.saveGame(game)
    })
  }

  async juryVote(source: string, target: string) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state

      const src = state.getTankByName(source)
      const trg = state.getTankByName(target)

      // check: source and target exist, source is dead, target is not dead, source has not already voted

      if (!src || !trg) throw new BadRequestException('Tank does not exist')

      if (src.hearts > 0) throw new BadRequestException('Not dead')

      if (trg.hearts <= 0) throw new BadRequestException('Target is dead')

      if (src.vote !== undefined)
        throw new BadRequestException('You have already voted')

      // mutate state
      src.vote = trg.name

      await this.saveGame(game)
    })
  }

  // debug actions
  async addAP(target: string, amount: number) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state

      const trg = state.getTankByName(target)
      trg!.ap += amount

      await this.saveGame(game)
    })
  }

  // debug actions
  async addHearts(target: string, amount: number) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state

      const trg = state.getTankByName(target)
      trg!.hearts += amount

      await this.saveGame(game)
    })
  }

  private isInRange(
    entity: { x: number; y: number },
    target: { x: number; y: number },
    range: number,
  ): boolean {
    const dx = Math.abs(entity.x - target.x)
    const dy = Math.abs(entity.y - target.y)

    if (dx > range || dy > range) return false
    return true
  }

  personalizedGameState(session: UserSession, state: GameState): object {
    const myState = session && state.getTankById(session.userId)
    console.log(myState)
    return {
      gameState: classToPlain(state),
      myState: myState && classToPlain(myState, { groups: ['me'] }),
    }
  }

  randomMapPosition(state: GameState): { x: number; y: number } {
    let x
    let y
    do {
      x = Math.floor(Math.random() * state.width)
      y = Math.floor(Math.random() * state.height)
    } while (state.getEntity(x, y))

    // FIXME: check if no square empty at all

    return { x, y }
  }

  @Cron('0 0 * * *')
  async resetJob() {
    this.logger.debug('Reset job!')

    function randIn<T>(arr: T[]): T {
      const rand = Math.floor(Math.random() * arr.length)
      return arr[rand]
    }

    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state

      // compute voting result

      const alive = state.tanks.filter(tank => tank.hearts > 0)
      const dead = state.tanks.filter(tank => tank.hearts <= 0)
      const tanks: [TankEntity, number][] = alive.map(tank => [
        tank,
        dead.reduce((sum, cur) => (cur.vote === tank.name ? sum + 1 : sum), 0),
      ])

      const highest = tanks.reduce(
        (acc, [_tank, votes]) => Math.max(acc, votes),
        0,
      )
      const highestTanks = tanks.filter(([_tank, votes]) => votes === highest)
      const chosen = highest >= 1 ? randIn(highestTanks)[0] : null

      // increment everyone's ap if alive, except for the voted one

      alive.forEach(tank => {
        if (tank === chosen) return
        tank.ap += 1
      })

      // reset votes

      state.tanks.forEach(tank => {
        tank.vote = undefined
      })

      // add a heart on the map

      const position = this.randomMapPosition(state)
      state.hearts.push(new HeartEntity(position.x, position.y))

      await this.saveGame(game)
    })
  }

  @OnEvent('user.create')
  async gameStateUpdated(user: UserEntity) {
    this.logger.log('New user event', user)
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state

      const position = this.randomMapPosition(state)
      state.tanks.push(
        new TankEntity(
          position.x,
          position.y,
          state.tanks.length,
          user.name,
          user.id,
        ),
      )

      console.log('saving')

      await this.saveGame(game)
    })
  }
}
