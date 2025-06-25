import { ResponseBotError } from "./response-bot-error"

export class DBError {
  static handle(error: unknown, textBefore?: string): void {
    const currentError = error as { code?: unknown }
    const code: string = currentError?.code?.toString() || ""

    if (!code || !errors[code]) throw error

    const exceptionMethod = errors[code].exception || ResponseBotError
    const messageText = textBefore + errors[code].message
    const message = errors[code].message ? messageText : ""

    throw new exceptionMethod(message)
  }
}

const errors: ErrorsType = {
  "23505": {
    message: "такое значение уже присутствует.",
    exception: ResponseBotError,
  },
  "23503": { message: "такое значение не найдено." },
}

type ErrorsType = {
  [key: string]: {
    message: string
    exception?: ExceptionType
  }
}

type ExceptionType = new (message?: string) => Error
