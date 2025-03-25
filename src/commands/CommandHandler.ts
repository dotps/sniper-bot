import { ResponseData } from "../data/ResponseData"
import { IQueryData } from "../data/IQueryData"
import { Injectable } from "@nestjs/common"
import { Logger } from "../utils/Logger"
import { ICommandFactory } from "./ICommandFactory"
import { Commands } from "./Commands"
import { UserService } from "../users/user.service"
import { BotType } from "../providers/bots/IBotProvider"
import { User } from "../users/user.entity"
import { plainToClass } from "class-transformer"

@Injectable()
export class CommandHandler {
  private defaultMessage: string = "Неизвестная команда."
  private needRegisterMessage: string = `Для взаимодействия с ботом необходимо зарегистрироваться. Отправьте ${Commands.START} для начала.`
  private enterCommandMessage: string = `Для взаимодействия с ботом необходимо ввести команду. Отправьте ${Commands.START} для начала.`

  constructor(
    private commandFactory: ICommandFactory,
    private readonly userService: UserService,
  ) {}

  async handleCommandFromUpdates(updateData: IQueryData, botType: BotType): Promise<ResponseData | null> {
    try {
      let user = await this.userService.getUser(updateData.userId, botType)
      const parsedCommand = this.parseCommand(updateData.text)

      console.log(updateData)

      if (!parsedCommand) return new ResponseData(this.enterCommandMessage)
      if (parsedCommand.command !== Commands.START && !user) return new ResponseData(this.needRegisterMessage)

      if (!user) user = plainToClass(User, updateData, { excludeExtraneousValues: true })
      const command = this.commandFactory.createCommand(user, parsedCommand)

      return command ? await command.execute() : new ResponseData(this.defaultMessage)
    } catch (error) {
      Logger.error(error)
    }

    return new ResponseData(this.defaultMessage)
  }

  parseCommand(input: string): Command | null {
    const commands = input.toLowerCase().trim().match(/\/\w+/g)
    let params: string[] = []

    if (!commands || commands.length > 1) return null

    const command = commands[0] as Commands
    params = input.replace(command, "").trim().split(" ")

    return {
      command: command,
      params: params,
    }
  }
}

export type Command = {
  command: Commands
  params?: string[]
}
