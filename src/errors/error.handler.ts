import { BotResponseData } from "../bots/infrastructure/bot-response-data"
import { ResponseBotError } from "./response-bot-error"
import { Logger } from "../services/logger/logger"

export class ErrorHandler {
  static handleAndResponse(error: unknown): BotResponseData | null {
    if (error instanceof ResponseBotError) {
      return new BotResponseData(error.message)
    } else {
      Logger.error(error)
      return null
    }
  }
}
