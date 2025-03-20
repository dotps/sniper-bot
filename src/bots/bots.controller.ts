import { Body, Controller, Post } from "@nestjs/common"

import { BotProvider } from "../providers/bots/BotProvider"
import { CommandHandler } from "../Commands/CommandHandler"
import { ResponseData } from "../data/ResponseData"

@Controller("bots")
export class BotsController {
  constructor(
    private readonly botProvider: BotProvider,
    private readonly commandHandler: CommandHandler,
  ) {}

  @Post()
  async query(@Body() data: any): Promise<ResponseData | null> {
    const queryData = await this.botProvider.handleUpdate(data)
    return await this.commandHandler.handleQuery(queryData)
  }
}
