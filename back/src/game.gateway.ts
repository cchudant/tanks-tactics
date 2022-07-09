import { Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { instanceToPlain as classToPlain } from 'class-transformer'
import { Server, Socket } from 'socket.io'
import { AppService, GameStateEvent } from './app.service'
import { UserSession } from './auth/user.session'
import { GameState } from './game/gamestate'
import cookieParser from 'cookie-parser'
import cookieSession from 'cookie-session'
import passport from 'passport'
import { configService } from './config/config.service'
import { ServerResponse } from 'http'
import { promisify } from 'util'

// this sucks, but there seems to be no alternative
const fakeExpressHandlerFactory = () => {
  const cookieParserM = cookieParser()
  const cookieSessionM = cookieSession({
    secret: configService.getCookieSecret(),
  })
  const passportInitializeM = passport.initialize()
  const passportSessionM = passport.session()
  return async (req: any) => {
    const res = new ServerResponse(req) as any
    await promisify(cookieParserM)(req, res)
    await promisify(cookieSessionM)(req, res)
    await promisify(passportInitializeM)(req, res)
    await promisify(passportSessionM)(req, res)
    return { req }
  }
}

@WebSocketGateway({ namespace: 'game' })
export class GameGateway {
  private readonly logger = new Logger(GameGateway.name)

  private fakeExpressHandler = fakeExpressHandlerFactory()
  constructor(private appService: AppService) {}

  @WebSocketServer()
  server!: Server

  @OnEvent('gamestate.update')
  gameStateUpdated(event: GameStateEvent) {
    const sockets = Array.from(
      (this.server.sockets as any as Map<string, Socket>).values(),
    )

    sockets.forEach(socket => {
      const session: UserSession = (socket.handshake as any).user

      const output = this.appService.personalizedGameState(
        session,
        event.gameState,
      )
      socket.send(output)
    })
  }

  async handleConnection(client: Socket, ...args: any[]) {
    await this.fakeExpressHandler(client.handshake)
    this.logger.log('WS Connect', {
      id: client.id,
    })
  }
}
