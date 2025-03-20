import { ILoggerService } from "./ILoggerService"

export class ConsoleLogger implements ILoggerService {
  private readonly enabled: boolean
  private errorPrefix: string = "Error: "

  constructor(enabled: boolean = true) {
    this.enabled = enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  error(text: any): void {
    const date = new Date() + " | "
    console.error(date + this.errorPrefix + text)
  }

  log(text: string): void {
    if (!this.enabled) return
    const date = new Date() + " | "
    console.log(date + text)
  }
}
