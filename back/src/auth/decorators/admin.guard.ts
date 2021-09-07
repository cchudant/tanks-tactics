import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Request } from 'express'
import { Role, UserSession } from '../user.session'

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    if (!request.isAuthenticated())
      throw new UnauthorizedException('You must be logged in')
    if ((request.user as UserSession).isDefaultPassword)
      throw new ForbiddenException('You must set your password')
    if ((request.user as UserSession).role !== Role.ADMIN)
      throw new ForbiddenException('You must be admin')
    return true
  }
}
