import { ResponseData } from "../data/ResponseData"
import { ResponseBotError } from "./ResponseBotError"
import { Logger } from "../utils/Logger"

export class ErrorHandler {
  static handleAndResponse(error: unknown): ResponseData | null {
    if (error instanceof ResponseBotError) {
      return new ResponseData(error.message)
    } else {
      Logger.error(error)
      return null
    }
  }
}
