import { ICommand } from "./infrastructure/ICommand"
import { ResponseData } from "../data/ResponseData"
import { UserService } from "../users/user.service"
import { Command } from "./infrastructure/CommandHandler"
import { User } from "../users/user.entity"

export class StartCommand implements ICommand {
  private readonly userService: UserService
  private readonly commandData: Command
  private readonly user: User
  private readonly messages = {
    EXIST: "Вы уже зарегистрированы в сервисе.",
    SUCCESS: "Регистрация в сервисе прошла успешно.",
    ERROR: "Ошибка регистрации. Попробуйте позже.",
  } as const

  constructor(userService: UserService, user: User, commandData: Command) {
    this.user = user
    this.userService = userService
    this.commandData = commandData
  }

  async execute(): Promise<ResponseData | null> {
    const response: string[] = []

    if (this.user.id) {
      response.push(this.messages.EXIST)
    } else {
      const user = await this.userService.createUser(this.user)
      if (user) response.push(this.messages.SUCCESS)
      else response.push(this.messages.ERROR)
    }

    return new ResponseData(response)
  }
}
