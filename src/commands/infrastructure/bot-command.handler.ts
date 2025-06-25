import { BotResponseData } from "../../bots/infrastructure/bot-response-data"
import { IBotResponseDto } from "../../bots/infrastructure/bot-response-dto.interface"
import { Injectable } from "@nestjs/common"
import { Logger } from "../../libs/core/logger/logger"
import { ICommandFactory } from "./command-factory.interface"
import { BotCommands } from "../bot/bot-commands"
import { UserService } from "../../users/user.service"

@Injectable()
export class BotCommandHandler {
  private defaultMessage: string = "Неизвестная команда."
  private needRegisterMessage: string = `Для взаимодействия с ботом необходимо зарегистрироваться. Отправьте ${BotCommands.Start} для начала.`
  private enterCommandMessage: string = `Для взаимодействия с ботом необходимо ввести команду. Отправьте ${BotCommands.Start} для начала.`

  constructor(
    private commandFactory: ICommandFactory,
    private readonly userService: UserService,
  ) {}

  async handleCommandFromUpdates(updateData: IBotResponseDto): Promise<BotResponseData | null> {
    try {
      const parsedCommand = this.parseCommand(updateData.text)
      if (!parsedCommand) return new BotResponseData(this.enterCommandMessage)

      let user = await this.userService.getUser(updateData.userId, updateData.botType)
      if (parsedCommand.command !== BotCommands.Start && !user) return new BotResponseData(this.needRegisterMessage)
      if (!user) user = this.userService.createUnregisteredUser(updateData)

      const command = this.commandFactory.createCommand(user, parsedCommand)
      return command ? await command.execute() : new BotResponseData(this.defaultMessage)
    } catch (error) {
      Logger.error(error)
    }

    return new BotResponseData(this.defaultMessage)
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
