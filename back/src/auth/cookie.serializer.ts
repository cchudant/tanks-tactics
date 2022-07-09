import { PassportSerializer } from '@nestjs/passport'
import { Injectable } from '@nestjs/common'
import {
  instanceToPlain as classToPlain,
  plainToInstance as plainToClass,
} from 'class-transformer'
import { UserSession } from './user.session'

@Injectable()
export class CookieSerializer extends PassportSerializer {
  async serializeUser(session: any, done: (err: any, id?: any) => void) {
    done(null, classToPlain(session))
  }
  deserializeUser(payload: any, done: (err: any, id?: any) => void) {
    done(null, plainToClass(UserSession, payload))
  }
}