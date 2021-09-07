import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common'
import { Response } from 'express'
import { EntityNotFoundError } from 'typeorm'

@Catch(EntityNotFoundError)
export class TypeormExceptionFilter implements ExceptionFilter {
  catch(exception: EntityNotFoundError, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    response.status(404).json({
      statusCode: 404,
      message: 'Not Found',
    })
  }
}