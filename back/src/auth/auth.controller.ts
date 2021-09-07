import {
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Body,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common'
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport'
import { Request } from 'express'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { promisify } from 'util'
import { classToClass, classToPlain } from 'class-transformer'
import { ApiOkResponse } from '@nestjs/swagger'
import { UserEntity } from '../entities/user.entity'
import { UserSession } from './user.session'
import { CurrentSession } from './decorators/currentsession.decorator'
import { AuthGuard } from './decorators/auth.guard'
import { AdminGuard } from './decorators/admin.guard'
import { IsString, Length } from 'class-validator'
import AuthService from './auth.service'

class SetPasswordDto {
  @IsString()
  @Length(8)
  password!: string
}

class ResetPasswordDto {
  @IsString()
  username!: string
}

class LoginDto {
  @IsString()
  username!: string
  @IsString()
  password!: string
}

class CreateUserDto {
  @IsString()
  username!: string
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  @UseGuards(PassportAuthGuard('local'))
  async login(
    @Body() _data: LoginDto,
    @Req() req: Request,
    @CurrentSession() session: UserSession | null,
  ) {
    await promisify(req.logIn).call(req, session!)
    return session
  }

  @Get('session')
  @ApiOkResponse({ type: () => UserSession })
  session(@CurrentSession() session: UserSession | null): UserSession | null {
    return session
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  logout(@Req() req: Request) {
    req.logOut()
  }

  @Post('setPassword')
  async setPassword(
    @Body() obj: SetPasswordDto,
    @CurrentSession() session: UserSession | null,
    @Req() req: Request,
  ) {
    if (!session) throw new UnauthorizedException('You must be logged in')
    if (!session.isDefaultPassword) throw new ForbiddenException('Cannot change password twice')

    await this.authService.setPassword(session.userId, obj.password)
    session.isDefaultPassword = false
    await promisify(req.logIn).call(req, session!)
  }

  @Post('createUser')
  @UseGuards(AdminGuard)
  async createUser(@Body() body: CreateUserDto) {
    return await this.authService.createUser(body.username)
  }

  @Post('resetPassword')
  @UseGuards(AdminGuard)
  async resetPassword(@Body() body: ResetPasswordDto): Promise<string> {
    return await this.authService.resetPassword(body.username)
  }
}
