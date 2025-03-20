import { Body, Controller, Post } from "@nestjs/common"

import { BotProvider } from "../providers/bots/BotProvider"
import { CommandHandler } from "../Commands/CommandHandler"

@Controller("bots")
export class BotsController {
  constructor(
    private readonly botProvider: BotProvider,
    private readonly commandHandler: CommandHandler,
  ) {}

  @Post()
  async query(@Body() data: any): Promise<string> {
    const queryData = await this.botProvider.handleUpdate(data)
    console.log(queryData)
    // TODO: внедрить commandHandler
    await this.commandHandler.handleQuery(queryData)
    return "query"
  }
}
