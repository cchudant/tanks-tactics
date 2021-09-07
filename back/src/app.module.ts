import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { configService } from './config/config.service'
import { GameEntity } from './entities/game.entity'
import { UserEntity } from './entities/user.entity'
import { GameGateway } from './game.gateway'

@Module({
  imports: [
    TypeOrmModule.forRoot(configService.getTypeOrmConfig()),
    AuthModule,
    EventEmitterModule.forRoot(),
    TypeOrmModule.forFeature([GameEntity, UserEntity]),
  ],
  controllers: [AppController],
  providers: [AppService, GameGateway],
})
export class AppModule {}
