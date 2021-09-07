import { Strategy } from 'passport-local'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable } from '@nestjs/common'
import { LoginStrategy, UserSession } from '../user.session'
import AuthService from '../auth.service'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super()
  }

  async validate(username: string, password: string): Promise<UserSession> {
    const user = await this.authService.validateUser(username, password)
    const session = new UserSession()
    session.userId = user.id
    session.loginStrategy = LoginStrategy.LOCAL
    session.isDefaultPassword = user.isDefaultPassword
    session.role = user.role
    return session
  }
}