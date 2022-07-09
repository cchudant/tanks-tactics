import { NestFactory, Reflector } from '@nestjs/core'
import cookieParser from 'cookie-parser'
import cookieSession from 'cookie-session'
import passport from 'passport'
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { configService } from './config/config.service'
import morgan from 'morgan'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { TypeormExceptionFilter } from './typeorm.filter'
import { SocketIOAdapter } from './socketio.adapter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      credentials: true,
      origin: configService.getCORSOrigin(), // FIXME: origin whitelist
    },
  })
  app.use(cookieParser())
  app.use(cookieSession({ secret: configService.getCookieSecret() }))
  app.use(passport.initialize())
  app.use(passport.session())
  app.use(morgan(configService.getMorganFormat()))
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  )
  app.useGlobalFilters(new TypeormExceptionFilter())
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {}),
  )

  // if (!configService.isProduction()) {
  //   const config = new DocumentBuilder()
  //     .setTitle('asd')
  //     .setDescription('The asd API')
  //     .setVersion('1.0')
  //     .addTag('asd')
  //     .build()
  //   const document = SwaggerModule.createDocument(app, config)
  //   SwaggerModule.setup('api', app, document)
  // }

  app.useWebSocketAdapter(new SocketIOAdapter(app, configService.getCORSOrigin()))

  await app.listen(configService.getPort(), configService.getListenHost())
}
bootstrap()
