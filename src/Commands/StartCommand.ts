import { Commands } from "./Commands"
import { ICommand } from "./ICommand"
import { ResponseData } from "../data/ResponseData"
import { Command } from "./CommandHandler"

export class StartCommand implements ICommand {
  private response: string[] = [
    `Привет! Я помогу тебе узнать текущие курсы валют.`,
    `Напиши ${Commands.CURRENCY} для получения списка доступных валют.`,
  ]

  constructor(commandData: Command) {
    console.log(commandData)
  }

  async execute(): Promise<ResponseData | null> {
    // TODO: проверка пользователя и регистрация если его нет
    return new ResponseData(this.response)
  }
}
