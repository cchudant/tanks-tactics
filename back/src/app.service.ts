import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { Cron } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { instanceToPlain } from 'class-transformer'
import { EntityManager, Not, Repository } from 'typeorm'
import { Role, UserSession } from './auth/user.session'
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
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
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

  private async saveGame(game: GameEntity): Promise<void> {
    console.log('Saving', game)
    await this.gameRepository.save(game)
    this.eventEmitter.emit('gamestate.update', new GameStateEvent(game.state))
  }

  async giveApToPlayer(source: string, target: string) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state
      if (!state.canPlay()) return new BadRequestException('Game is paused')

      const src = state.getTankByName(source)
      const trg = state.getTankByName(target)

      // check: source exists, target exists, range, enough AP, source is not target

      if (!src || !trg) throw new BadRequestException('Tank does not exist')

      if (src === trg)
        throw new BadRequestException('Cannot apply action to yourself')

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
      if (!state.canPlay()) return new BadRequestException('Game is paused')

      const src = state.getTankByName(source)
      const trg = state.getTankByName(target)

      // check: source exists, target exists, range, enough hearts, source is not target

      if (!src || !trg) throw new BadRequestException('Tank does not exist')

      if (src === trg)
        throw new BadRequestException('Cannot apply action to yourself')

      if (!this.isInRange(src, trg, src.range))
        throw new BadRequestException('Too far away')

      if (src.hearts < 1) throw new BadRequestException('Not enough hearts')

      // mutate state
      src.hearts -= 1
      trg.hearts += 1
      if (trg.hearts === 1) {
        // target got revived
        trg.ap = 0
        trg.vote = undefined
      }

      this.checkEndgame(state)

      await this.saveGame(game)
    })
  }

  async upgradeRange(source: string) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state
      if (!state.canPlay()) return new BadRequestException('Game is paused')

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
      if (!state.canPlay()) return new BadRequestException('Game is paused')

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
        src.hearts = Math.min(3, src.hearts + 1) // limit hearts to 3
      }

      await this.saveGame(game)
    })
  }

  async attack(source: string, target: string) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state
      if (!state.canPlay()) return new BadRequestException('Game is paused')

      const src = state.getTankByName(source)
      const trg = state.getTankByName(target)

      // check: source exists, target exists, range, enough AP, target not dead, source is not target

      if (!src || !trg) throw new BadRequestException('Tank does not exist')

      if (src === trg)
        throw new BadRequestException('Cannot apply action to yourself')

      if (!this.isInRange(src, trg, src.range))
        throw new BadRequestException('Too far away')

      if (src.ap < 1) throw new BadRequestException('Not enough AP')

      if (trg.hearts <= 0)
        throw new BadRequestException('Traget is already dead')

      // mutate state
      src.ap -= 1
      trg.hearts -= 1

      if (trg.hearts <= 0) {
        src.ap += trg.ap
        trg.ap = 0
      }

      this.checkEndgame(state)

      await this.saveGame(game)
    })
  }

  async buyHeart(source: string) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state
      if (!state.canPlay()) return new BadRequestException('Game is paused')

      const src = state.getTankByName(source)

      // check: tank exists, enough ap, hearts limit

      if (state.isEndgame)
        throw new BadRequestException('Cannot buy hearts in endgame')
      if (!src) throw new BadRequestException('Tank does not exist')

      if (src.ap < 3) throw new BadRequestException('Not enough AP')
      if (src.hearts >= 3) throw new BadRequestException('Too many hearts')

      // mutate state
      src.hearts += 1
      src.ap -= 3

      this.checkEndgame(state)

      await this.saveGame(game)
    })
  }

  async juryVote(source: string, target: string) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state
      if (!state.canPlay()) return new BadRequestException('Game is paused')

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
  async adminAddAP(target: string, amount: number) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state

      const trg = state.getTankByName(target)
      trg!.ap += amount

      await this.saveGame(game)
    })
  }

  // debug actions
  async adminAddHearts(target: string, amount: number) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state

      const trg = state.getTankByName(target)
      trg!.hearts += amount

      this.checkEndgame(state)

      await this.saveGame(game)
    })
  }

  // debug actions
  async adminAddRange(target: string, amount: number) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state

      const trg = state.getTankByName(target)
      trg!.range += amount

      await this.saveGame(game)
    })
  }

  // debug actions
  async adminSetPaused(paused: boolean) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state

      state.paused = paused

      await this.saveGame(game)
    })
  }

  // debug actions
  async adminMove(source: string, target: { x: number; y: number }) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state

      const src = state.getTankByName(source)

      // check: tank exists, range, enough AP, target square is occupied by tank
      // special case: move into square occupied by a heart

      if (!src) throw new BadRequestException('Tank does not exist')

      const occupied = state.getEntity(target.x, target.y)
      if (occupied && !(occupied instanceof HeartEntity))
        throw new BadRequestException('Square is occupied')

      // mutate state
      src.x = target.x
      src.y = target.y

      if (occupied) {
        const heartIndex = state.hearts.indexOf(occupied!)
        state.hearts.splice(heartIndex, 1) // delete the heart
        src.hearts = Math.min(3, src.hearts + 1) // limit hearts to 3
      }

      this.checkEndgame(state)

      await this.saveGame(game)
    })
  }

  // debug actions
  async adminChangeVote(target: string, vote?: string) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state

      const trg = state.getTankByName(target)
      trg!.vote = vote

      await this.saveGame(game)
    })
  }

  // debug actions
  async adminRemoveHearts() {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state

      state.hearts = []

      await this.saveGame(game)
    })
  }

  // debug actions
  async adminAddMapHeart(target: { x: number; y: number }) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state

      state.hearts.push(new HeartEntity(target.x, target.y))

      await this.saveGame(game)
    })
  }

  // debug actions
  async adminResetEverything(opt: Partial<GameState>) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = new GameState()

      Object.assign(state, opt)

      game.state = state

      await this.saveGame(game)
      await this.userRepository.delete({ role: Not(Role.ADMIN) })
    })
  }

  // debug actions
  async adminSetCurrentDay(day: number) {
    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state

      state.currentDay = day

      game.state = state

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

  personalizedGameState(
    session: UserSession | undefined,
    state: GameState,
  ): object {
    const myState = session && state.getTankById(session.userId)
    if (session?.role === 'admin')
      return {
        gameState: instanceToPlain(state, { groups: ['admin'] }),
      }

    return {
      gameState: instanceToPlain(state, { groups: [] }),
      myState: myState && instanceToPlain(myState, { groups: ['me'] }),
    }
  }

  private checkEndgame(state: GameState) {
    if (state.isEndgame) {
      const tanks = [...state.tanks]
      tanks.sort((a, b) => b.hearts - a.hearts) // highest first

      if (tanks.length < 1) return
      if (tanks.length === 1 || tanks[0].hearts !== tanks[1].hearts) {
        // end condition
        state.end = true
        state.winner = tanks[0].name

        state.tanks.forEach(t => {
          if (t !== tanks[0]) t.hearts = 0
        })
      }
    }
  }

  private randomMapPosition(state: GameState): { x: number; y: number } {
    let x
    let y
    do {
      x = Math.floor(Math.random() * state.width)
      y = Math.floor(Math.random() * state.height)
    } while (state.getEntity(x, y))

    // FIXME: check if no square empty at all

    return { x, y }
  }

  async performResetJob(endgame?: boolean) {
    function randIn<T>(arr: T[]): T {
      const rand = Math.floor(Math.random() * arr.length)
      return arr[rand]
    }

    await this.entityManager.transaction(async () => {
      const game = await this.getGame()
      const state = game.state

      if (typeof endgame === 'boolean' && endgame !== state.isEndgame) return
      this.logger.log('Reset job: endgame = ' + state.isEndgame)

      state.currentDay += 1 // new day!

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

      state.lastVoted = chosen?.name

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

      if (!state.isEndgame) {
        const position = this.randomMapPosition(state)
        state.hearts.push(new HeartEntity(position.x, position.y))
      }

      // endgame stuff
      this.checkEndgame(state)

      await this.saveGame(game)
    })
  }

  @Cron('*/30 * * * *')
  async resetJobEndgame() {
    await this.performResetJob(true)
  }

  @Cron('0 18 * * *')
  async resetJob() {
    await this.performResetJob(false)
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
