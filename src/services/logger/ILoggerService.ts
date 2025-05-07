export interface ILoggerService {
  isEnabled(): boolean
  log(text: any): void
  error(message: any): void
}
