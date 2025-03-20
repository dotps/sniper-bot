import { IModel } from "./IModel"

export class Model implements IModel {
  private isRunning: boolean = true
  private isBotRunning: boolean = false

  isAppRunning(): boolean {
    return this.isRunning
  }

  stopApp(): void {
    this.isRunning = false
  }

  isBotInit(): boolean {
    return this.isBotRunning
  }

  botWasInit(): void {
    this.isBotRunning = true
  }
}
