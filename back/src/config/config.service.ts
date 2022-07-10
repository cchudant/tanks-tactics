import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { LoggerOptions } from 'typeorm'

dotenv.config()

// fix wrong typing

export class ConfigService {
  constructor(private env: { [k: string]: string | undefined }) {}

  private getValue(key: string, throwOnMissing = true): string {
    const value = this.env[key]
    if (typeof value !== 'string' && throwOnMissing) {
      throw new Error(`config error - missing env.${key}`)
    }

    return value!
  }

  public ensureValues(keys: string[]) {
    keys.forEach(k => this.getValue(k, true))
    return this
  }

  public getPort() {
    return parseInt(this.getValue('PORT', false)) || 4000
  }

  public getListenHost() {
    return this.getValue('LISTEN_HOST', false) || '127.0.0.1'
  }

  public isProduction() {
    const mode = this.getValue('NODE_ENV', false)
    return mode === 'production'
  }

  public isTesting() {
    const mode = this.getValue('NODE_ENV', false)
    return mode === 'test'
  }

  public getTypeOrmConfig() {
    return {
      type: 'postgres' as const,

      host: this.getValue('POSTGRES_HOST'),
      port: parseInt(this.getValue('POSTGRES_PORT')),
      username: this.getValue('POSTGRES_USER'),
      password: this.getValue('POSTGRES_PASSWORD'),
      database: this.isTesting()
        ? this.getValue('POSTGRES_TEST_DATABASE')
        : this.getValue('POSTGRES_DATABASE'),

      migrationsTableName: 'migration',

      entities: this.isTesting()
        ? ['src/entities/*.entity.ts']
        : ['dist/src/entities/*.js'],
      migrations: this.isTesting()
        ? ['migrations/*.ts']
        : ['dist/migrations/*.js'],

      cli: {
        migrationsDir: this.isProduction() ? 'dist/migrations' : 'migrations',
      },

      logging: (this.isProduction() || this.isTesting()
        ? false
        : 'all') as LoggerOptions,

      synchronize: this.isTesting(),
    }
  }

  public superUserSecrets(): { username: string; password: string } {
    return {
      username: this.getValue('SUPERUSER_USERNAME', false) || 'root',
      password: this.getValue('SUPERUSER_PASSWORD', false) || 'test',
    }
  }

  public getCookieSecret(): string {
    return this.getValue('COOKIE_SECRET')
  }

  public getCORSOrigin(): string | boolean {
    return this.getValue('CORS_ORIGIN', false) || 'http://localhost:3000'
  }

  public getMorganFormat(): string {
    return !this.isProduction() ? 'dev' : 'short'
  }
}

const configService = new ConfigService(process.env).ensureValues([
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DATABASE',
])

export { configService }
