import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsInt, IsString, Min } from 'class-validator'
import { Repository } from 'typeorm'
import { AppService } from './app.service'
import { AdminGuard } from './auth/decorators/admin.guard'
import { AuthGuard } from './auth/decorators/auth.guard'
import { CurrentSession } from './auth/decorators/currentsession.decorator'
import { UserSession } from './auth/user.session'
import { UserEntity } from './entities/user.entity'

class TargetPlayerDto {
  @IsString()
  target!: string
}

class AddHeartsAPDto {
  @IsString()
  target!: string
  @IsInt()
  @Min(0)
  amount!: number
}

class TargetSquareDto {
  @IsInt()
  x!: number
  @IsInt()
  y!: number
}

@Controller('game')
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  @Post('giveApToPlayer')
  @UseGuards(AuthGuard)
  async giveApToPlayer(
    @CurrentSession() session: UserSession,
    @Body() target: TargetPlayerDto,
  ) {
    const name = (await this.userRepository.findOneOrFail(session.userId)).name
    const targetName = target.target

    await this.appService.giveApToPlayer(name, targetName)
  }

  @Post('giveHeartToPlayer')
  @UseGuards(AuthGuard)
  async giveHeartToPlayer(
    @CurrentSession() session: UserSession,
    @Body() target: TargetPlayerDto,
  ) {
    const name = (await this.userRepository.findOneOrFail(session.userId)).name
    const targetName = target.target

    await this.appService.giveHeartToPlayer(name, targetName)
  }

  @Post('upgradeRange')
  @UseGuards(AuthGuard)
  async upgradeRange(@CurrentSession() session: UserSession) {
    const name = (await this.userRepository.findOneOrFail(session.userId)).name

    await this.appService.upgradeRange(name)
  }

  @Post('move')
  @UseGuards(AuthGuard)
  async move(
    @CurrentSession() session: UserSession,
    @Body() target: TargetSquareDto,
  ) {
    const name = (await this.userRepository.findOneOrFail(session.userId)).name

    await this.appService.move(name, target)
  }

  @Post('attack')
  @UseGuards(AuthGuard)
  async attack(
    @CurrentSession() session: UserSession,
    @Body() target: TargetPlayerDto,
  ) {
    const name = (await this.userRepository.findOneOrFail(session.userId)).name
    const targetName = target.target

    await this.appService.attack(name, targetName)
  }

  @Post('buyHeart')
  @UseGuards(AuthGuard)
  async buyHeart(@CurrentSession() session: UserSession) {
    const name = (await this.userRepository.findOneOrFail(session.userId)).name

    await this.appService.buyHeart(name)
  }

  @Post('juryVote')
  @UseGuards(AuthGuard)
  async juryVote(
    @CurrentSession() session: UserSession,
    @Body() target: TargetPlayerDto,
  ) {
    const name = (await this.userRepository.findOneOrFail(session.userId)).name
    const targetName = target.target

    await this.appService.juryVote(name, targetName)
  }

  @Get('state')
  async state(@CurrentSession() session: UserSession) {
    return this.appService.personalizedGameState(
      session,
      (await this.appService.getGame()).state,
    )
  }

  @Post('addAP')
  @UseGuards(AdminGuard)
  async addAP(
    @Body() body: AddHeartsAPDto,
  ) {
    await this.appService.addAP(body.target, body.amount)
  }

  @Post('addHearts')
  @UseGuards(AdminGuard)
  async addHearts(
    @Body() body: AddHeartsAPDto,
  ) {
    await this.appService.addHearts(body.target, body.amount)
  }
}
