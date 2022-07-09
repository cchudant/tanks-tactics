import * as argon2 from 'argon2'
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import crypto from 'crypto'
import { InjectRepository } from '@nestjs/typeorm'
import { QueryFailedError, Repository } from 'typeorm'
import { UserEntity } from 'src/entities/user.entity'
import { Role, UserSession } from './user.session'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { configService } from 'src/config/config.service'

@Injectable()
export default class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private eventEmitter: EventEmitter2,
  ) {}

  async validateUser(username: string, password: string): Promise<UserEntity> {
    let user = await this.userRepository.findOne({
      where: {
        name: username,
      },
    })

    if (
      !user &&
      username === configService.superUserSecrets().username &&
      configService.superUserSecrets().password === password
    ) {
      user = await this.userRepository.save({
        name: configService.superUserSecrets().username,
        password: await argon2.hash(configService.superUserSecrets().password),
        isDefaultPassword: true,
        role: Role.ADMIN,
      })
    }

    if (
      !user ||
      !user.password ||
      !(await argon2.verify(user.password, password))
    ) {
      throw new BadRequestException('invalid login or password')
    }
    return user
  }

  genPassword(): string {
    return crypto.randomBytes(8).toString('hex')
  }

  async setPassword(userId: string, password: string): Promise<void> {
    await this.userRepository.update(
      {
        id: userId,
      },
      {
        isDefaultPassword: false,
        password: await argon2.hash(password),
      },
    )
  }

  async resetPassword(user: string): Promise<string> {
    const pw = this.genPassword()
    const ret = await this.userRepository.update(
      {
        name: user,
      },
      {
        isDefaultPassword: true,
        password: await argon2.hash(pw),
      },
    )

    if (ret.affected === 0)
      throw new NotFoundException('User not found')

    return pw
  }

  async createUser(name: string): Promise<string> {
    const pw = this.genPassword()
    const user = await this.userRepository.save({
      name,
      isDefaultPassword: true,
      password: await argon2.hash(pw),
    })
    this.eventEmitter.emit('user.create', user)
    return pw
  }
}
