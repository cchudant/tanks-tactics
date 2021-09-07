import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Request } from 'express'
import { UserSession } from '../user.session'

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    if (!request.isAuthenticated())
      throw new UnauthorizedException('You must be logged in')
    if ((request.user as UserSession).isDefaultPassword)
      throw new ForbiddenException('You must set your password')
    return true
  }
}
