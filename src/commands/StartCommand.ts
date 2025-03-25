import { Commands } from "./Commands"
import { ICommand } from "./ICommand"
import { ResponseData } from "../data/ResponseData"
import { Command } from "./CommandHandler"
import { UserService } from "../users/user.service"

export class StartCommand implements ICommand {
  private readonly userService: UserService
  private commandData: Command
  private response: string[] = [
    `Привет! Я помогу тебе узнать текущие курсы валют.`,
    `Напиши ${Commands.CURRENCY} для получения списка доступных валют.`,
  ]

  constructor(userService: UserService, commandData: Command) {
    this.userService = userService
    this.commandData = commandData
    console.log(commandData)
  }

  async execute(): Promise<ResponseData | null> {
    // TODO: проверка пользователя и регистрация если его нет
    console.log(this.commandData)
    // this.userService.createUser()
    return new ResponseData(this.response)
  }
}
