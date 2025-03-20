import { Commands } from "./Commands"
import { ICommand } from "./ICommand"
import { ResponseData } from "../data/ResponseData"

export class StartCommand implements ICommand {
  private response: string[] = [
    `Привет! Я помогу тебе узнать текущие курсы валют.`,
    `Напиши ${Commands.CURRENCY} для получения списка доступных валют.`,
  ]

  async execute(): Promise<ResponseData | null> {
    return new ResponseData(this.response)
  }
}
