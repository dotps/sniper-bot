import { ICommandFactory } from "./ICommandFactory"
import { ResponseData } from "../data/ResponseData"
import { IQueryData } from "../data/IQueryData"
import { Commands } from "./Commands"
import { Injectable } from "@nestjs/common"
import { Logger } from "../utils/Logger"

@Injectable()
export class CommandHandler {
  private defaultResponse: string = "Неизвестная команда."

  constructor(private commandFactory: ICommandFactory) {}

  async handleQuery(queryData: IQueryData): Promise<ResponseData | null> {
    try {
      const parsedCommand = this.parseCommand(queryData.text)
      const command = this.commandFactory.createCommand(parsedCommand)
      return command ? await command.execute() : new ResponseData([this.defaultResponse])
    } catch (error) {
      Logger.error(error)
    }
    return new ResponseData([this.defaultResponse])
  }

  parseCommand(input: string): Command {
    const commands = input.toLowerCase().trim().match(/\/\w+/g)
    let params: string[] = []

    if (!commands) throw new Error("Команды не найдены.")
    if (commands.length > 1) throw new Error("В запросе должна быть только одна команда.")

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
