export class ResponseBotError extends Error {
  error?: unknown

  constructor(message: string, error?: unknown) {
    super(message)
    this.error = error
  }
}
