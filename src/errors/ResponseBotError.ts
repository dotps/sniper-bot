import { Logger } from "../services/logger/Logger"

export class ResponseBotError extends Error {
  error?: unknown

  constructor(message: string, error?: unknown) {
    super(message)
    this.error = error
    if (error instanceof Error) Logger.error(error.message)
  }
}
