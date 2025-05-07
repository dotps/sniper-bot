import { ResponseData } from "../../data/ResponseData"
import { IBotResponseDto } from "../../providers/bots/IBotResponseDto"
import { Injectable } from "@nestjs/common"
import { Logger } from "../../utils/Logger"
import { ICommandFactory } from "./ICommandFactory"
import { BotCommands } from "../bot/BotCommands"
import { UserService } from "../../users/user.service"

@Injectable()
export class BotCommandHandler {
  private defaultMessage: string = "Неизвестная команда."
  private needRegisterMessage: string = `Для взаимодействия с ботом необходимо зарегистрироваться. Отправьте ${BotCommands.START} для начала.`
  private enterCommandMessage: string = `Для взаимодействия с ботом необходимо ввести команду. Отправьте ${BotCommands.START} для начала.`

  constructor(
    private commandFactory: ICommandFactory,
    private readonly userService: UserService,
  ) {}

  async handleCommandFromUpdates(updateData: IBotResponseDto): Promise<ResponseData | null> {
    try {
      const parsedCommand = this.parseCommand(updateData.text)
      if (!parsedCommand) return new ResponseData(this.enterCommandMessage)

      let user = await this.userService.getUser(updateData.userId, updateData.botType)
      if (parsedCommand.command !== BotCommands.START && !user) return new ResponseData(this.needRegisterMessage)
      if (!user) user = this.userService.createUnregisteredUser(updateData)

      const command = this.commandFactory.createCommand(user, parsedCommand)
      return command ? await command.execute() : new ResponseData(this.defaultMessage)
    } catch (error) {
      Logger.error(error)
    }

    return new ResponseData(this.defaultMessage)
  }

  parseCommand(input: string): Command | null {
    const commands = input.toLowerCase().trim().match(/\/\w+/g)
    if (!commands || commands.length > 1) return null

    const command = commands[0] as BotCommands
    const clearedInput = input.replace(command, "").trim()
    const params = clearedInput ? clearedInput.split(/\s+/) : undefined

    return {
      command: command,
      params: params,
    }
  }
}

export type Command = {
  command: BotCommands
  params?: string[]
}
