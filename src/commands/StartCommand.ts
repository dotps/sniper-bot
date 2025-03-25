import { ICommand } from "./ICommand"
import { ResponseData } from "../data/ResponseData"
import { UserService } from "../users/user.service"
import { Commands } from "./Commands"
import { Command } from "./CommandHandler"
import { User } from "../users/user.entity"
import { UserDto } from "../users/user.dto"

export class StartCommand implements ICommand {
  private readonly userService: UserService
  private readonly commandData: Command
  private user: User
  private response: string[] = [
    `Привет! Я помогу тебе узнать текущие курсы валют.`,
    `Напиши ${Commands.CURRENCY} для получения списка доступных валют.`,
  ]

  constructor(userService: UserService, user: User, commandData: Command) {
    this.user = user
    this.userService = userService
    this.commandData = commandData
  }

  async execute(): Promise<ResponseData | null> {
    if (!this.user?.id) {
      // const userDto: UserDto = {
      //   name: this.user.id.toString(),
      // }
      console.log(this.commandData)
      console.log(this.user)
      // this.user = await this.userService.createUser(userDto)
    }
    return new ResponseData(this.response)
  }
}
