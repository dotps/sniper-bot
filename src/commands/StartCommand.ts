import { ICommand } from "./ICommand"
import { ResponseData } from "../data/ResponseData"
import { UserService } from "../users/user.service"
import { Command } from "./CommandHandler"
import { User } from "../users/user.entity"

export class StartCommand implements ICommand {
  private readonly userService: UserService
  private readonly commandData: Command
  private readonly user: User
  private baseResponse: string[] = []

  constructor(userService: UserService, user: User, commandData: Command) {
    this.user = user
    this.userService = userService
    this.commandData = commandData
  }

  async execute(): Promise<ResponseData | null> {
    const response: string[] = []

    if (this.user.id) {
      response.push(StartCommandMessages.EXIST)
    } else {
      const user = await this.userService.createUser(this.user)
      if (user) response.push(StartCommandMessages.SUCCESS)
      else response.push(StartCommandMessages.ERROR)
    }

    // TODO: проверить наличие кошелька, если нет то зарегистрировать кошелек

    // response.push(...this.baseResponse)
    return new ResponseData(response)
  }
}

export enum StartCommandMessages {
  EXIST = "Вы уже зарегистрированы в сервисе.",
  SUCCESS = "Регистрация в сервисе прошла успешно.",
  ERROR = "Ошибка регистрации. Попробуйте позже.",
}
