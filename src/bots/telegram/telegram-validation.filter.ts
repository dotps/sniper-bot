import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from "@nestjs/common"
import { Response } from "express"

@Catch(BadRequestException)
export class TelegramValidationFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const httpHost = host.switchToHttp()
    const response = httpHost.getResponse<Response>()
    const status = exception.getStatus()
    const validationErrors = exception.getResponse() as { message: string[] }

    const telegramResponse = {
      ok: false,
      description: "Ошибка валидации.",
      errors: validationErrors.message,
    }

    response.status(status).json(telegramResponse)
  }
}
