import { BotResponseData } from "../bots/infrastructure/BotResponseData"
import { ResponseBotError } from "./ResponseBotError"
import { Logger } from "../services/logger/Logger"

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
