import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from 'src/entities/user.entity'
import { AuthController } from './auth.controller'
import AuthService from './auth.service'
import { CookieSerializer } from './cookie.serializer'
import { AuthGuard } from './decorators/auth.guard'
import { LocalStrategy } from './strategies/local.strategy'

@Module({
  imports: [
    PassportModule.register({ session: true }),
    TypeOrmModule.forFeature([UserEntity]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [AuthController],
  providers: [LocalStrategy, AuthService, CookieSerializer, AuthGuard],
})
export class AuthModule {}
