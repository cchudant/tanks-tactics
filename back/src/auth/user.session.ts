export enum LoginStrategy {
  LOCAL = 'local',
}

export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

export class UserSession {
  public userId!: string
  public loginStrategy!: LoginStrategy
  public role!: Role
  public isDefaultPassword!: boolean
}

export interface AuthorizedCtx {
  req: { user?: UserSession }
}
