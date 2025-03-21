import { Injectable } from "@nestjs/common"
import { QueryDto } from "./query.dto"
import { BotProvider } from "../providers/bots/BotProvider"
import { CommandHandler } from "../Commands/CommandHandler"

@Injectable()
export class BotsService {
  constructor(
    private readonly botProvider: BotProvider,
    private readonly commandHandler: CommandHandler,
  ) {}

  async handleQuery(data: QueryDto) {
    console.log(data)
    const queryData = await this.botProvider.handleUpdate([data])
    console.log(queryData)
    const response = await this.commandHandler.handleQuery(queryData)
    console.log(response)
    //TODO: донастроить бота
    if (!response) return
    const responseData = response?.data || []
    for (const text of responseData) {
      await this.botProvider.sendResponse(text, queryData)
    }
  }
}
