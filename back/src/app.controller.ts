import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator'
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

class AddHeartsAPRangeDto {
  @IsString()
  target!: string
  @IsInt()
  amount!: number
}

class AdminChangeVoteDto {
  @IsString()
  target!: string
  @IsString()
  @IsOptional()
  vote?: string
}

class SetPausedDto {
  @IsBoolean()
  paused!: boolean
}

class AdminMoveDto {
  @IsString()
  target!: string
  @IsInt()
  x!: number
  @IsInt()
  y!: number
}

class TargetSquareDto {
  @IsInt()
  x!: number
  @IsInt()
  y!: number
}

class BoardInitDto {
  @IsInt()
  @IsOptional()
  width?: number
  @IsInt()
  @IsOptional()
  height?: number
  @IsInt()
  @IsOptional()
  endDay?: number
}

class SetCurrentDayDto {
  @IsInt()
  currentDay!: number
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
    const name = (
      await this.userRepository.findOneOrFail({ where: { id: session.userId } })
    ).name
    const targetName = target.target

    await this.appService.giveApToPlayer(name, targetName)
  }

  @Post('giveHeartToPlayer')
  @UseGuards(AuthGuard)
  async giveHeartToPlayer(
    @CurrentSession() session: UserSession,
    @Body() target: TargetPlayerDto,
  ) {
    const name = (
      await this.userRepository.findOneOrFail({ where: { id: session.userId } })
    ).name
    const targetName = target.target

    await this.appService.giveHeartToPlayer(name, targetName)
  }

  @Post('upgradeRange')
  @UseGuards(AuthGuard)
  async upgradeRange(@CurrentSession() session: UserSession) {
    const name = (
      await this.userRepository.findOneOrFail({ where: { id: session.userId } })
    ).name

    await this.appService.upgradeRange(name)
  }

  @Post('move')
  @UseGuards(AuthGuard)
  async move(
    @CurrentSession() session: UserSession,
    @Body() target: TargetSquareDto,
  ) {
    const name = (
      await this.userRepository.findOneOrFail({ where: { id: session.userId } })
    ).name

    await this.appService.move(name, target)
  }

  @Post('attack')
  @UseGuards(AuthGuard)
  async attack(
    @CurrentSession() session: UserSession,
    @Body() target: TargetPlayerDto,
  ) {
    const name = (
      await this.userRepository.findOneOrFail({ where: { id: session.userId } })
    ).name
    const targetName = target.target

    await this.appService.attack(name, targetName)
  }

  @Post('buyHeart')
  @UseGuards(AuthGuard)
  async buyHeart(@CurrentSession() session: UserSession) {
    const name = (
      await this.userRepository.findOneOrFail({ where: { id: session.userId } })
    ).name

    await this.appService.buyHeart(name)
  }

  @Post('juryVote')
  @UseGuards(AuthGuard)
  async juryVote(
    @CurrentSession() session: UserSession,
    @Body() target: TargetPlayerDto,
  ) {
    const name = (
      await this.userRepository.findOneOrFail({ where: { id: session.userId } })
    ).name
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

  @Post('admin/setPaused')
  @UseGuards(AdminGuard)
  async adminSetPaused(@Body() body: SetPausedDto) {
    await this.appService.adminSetPaused(body.paused)
  }

  @Post('admin/move')
  @UseGuards(AdminGuard)
  async adminMove(@Body() body: AdminMoveDto) {
    await this.appService.adminMove(body.target, body)
  }

  @Post('admin/removeHearts')
  @UseGuards(AdminGuard)
  async adminRemoveHearts() {
    await this.appService.adminRemoveHearts()
  }

  @Post('admin/triggerResetJob')
  @UseGuards(AdminGuard)
  async adminTriggerResetJob() {
    await this.appService.performResetJob()
  }

  @Post('admin/addMapHeart')
  @UseGuards(AdminGuard)
  async adminAddMapHeart(@Body() body: TargetSquareDto) {
    await this.appService.adminAddMapHeart(body)
  }

  @Post('admin/changeVote')
  @UseGuards(AdminGuard)
  async adminChangeVote(@Body() body: AdminChangeVoteDto) {
    await this.appService.adminChangeVote(body.target, body.vote)
  }

  @Post('admin/addAP')
  @UseGuards(AdminGuard)
  async adminAddAP(@Body() body: AddHeartsAPRangeDto) {
    await this.appService.adminAddAP(body.target, body.amount)
  }

  @Post('admin/addHearts')
  @UseGuards(AdminGuard)
  async adminAddHearts(@Body() body: AddHeartsAPRangeDto) {
    await this.appService.adminAddHearts(body.target, body.amount)
  }

  @Post('admin/addRange')
  @UseGuards(AdminGuard)
  async adminAddRange(@Body() body: AddHeartsAPRangeDto) {
    await this.appService.adminAddRange(body.target, body.amount)
  }

  @Post('admin/resetEverything')
  @UseGuards(AdminGuard)
  async adminResetEverything(@Body() body: BoardInitDto) {
    await this.appService.adminResetEverything({ ...body })
  }

  @Post('admin/setCurrentDay')
  @UseGuards(AdminGuard)
  async adminSetCurrentDay(@Body() body: SetCurrentDayDto) {
    await this.appService.adminSetCurrentDay(body.currentDay)
  }
}
