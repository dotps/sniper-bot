import { ICommand } from "./ICommand"
import { ResponseData } from "../data/ResponseData"
import { UserService } from "../users/user.service"
import { Commands } from "./Commands"
import { Command } from "./CommandHandler"
import { User } from "../users/user.entity"

export class StartCommand implements ICommand {
  private readonly userService: UserService
  private readonly commandData: Command
  private readonly user: User
  private baseResponse: string[] = [
    `Привет! Я помогу тебе узнать текущие курсы валют.`,
    `Напиши ${Commands.CURRENCY} для получения списка доступных валют.`,
  ]
    // TODO: переделать уведомление

  constructor(userService: UserService, user: User, commandData: Command) {
    this.user = user
    this.userService = userService
    this.commandData = commandData
  }

  async execute(): Promise<ResponseData | null> {
    const response: string[] = []

    if (!this.user?.id) {
      const user = await this.userService.createUser(this.user)
      if (user) response.push("Вы зарегистрированы в сервисе. Для дальнейших действий отправьте команду.")
      else response.push("Ошибка регистрации.")
    }

    response.push(...this.baseResponse)
    return new ResponseData(response)
  }
}
