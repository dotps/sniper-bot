import { ILoggerService } from "./logger-service.interface"

export class Logger {
  private static loggerService: ILoggerService
  static isEnabled: boolean

  public static init(loggerService: ILoggerService): void {
    Logger.loggerService = loggerService
    Logger.isEnabled = loggerService.isEnabled()
  }

  public static log(message: any): void {
    Logger.loggerService.log(message)
  }

  static error(message: any): void {
    Logger.loggerService.error(message)
  }
}
