import { ICommandFactory } from "../Factory/ICommandFactory"
import { ResponseData } from "../data/ResponseData"
import { IQueryData } from "../data/IQueryData"
import { CommandData } from "../data/CommandData"

export class CommandHandler {
  private defaultResponse: string = "Неизвестная команда."

  constructor(private commandFactory: ICommandFactory) {}

  async handleQuery(queryData: IQueryData): Promise<ResponseData | null> {
    const input = queryData.text.toLowerCase().trim()
    const params = {}
    const commandData = new CommandData(input, params)
    const command = this.commandFactory.createCommand(commandData)

    return command
      ? await command.execute()
      : new ResponseData([this.defaultResponse])
  }
}
