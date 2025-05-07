import { BotResponseData } from "../providers/bots/BotResponseData"
import { ResponseBotError } from "./ResponseBotError"
import { Logger } from "../utils/Logger"

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
