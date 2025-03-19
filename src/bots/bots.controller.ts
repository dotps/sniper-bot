import { Body, Controller, Post } from "@nestjs/common"
// import { IBotProvider } from "../providers/bots/IBotProvider"
import { TelegramApiProvider } from "../providers/bots/telegram/TelegramApiProvider"

@Controller("bots")
export class BotsController {
  // constructor(private readonly botProvider: IBotProvider) {}
  constructor(private readonly botProvider: TelegramApiProvider) {}

  @Post()
  async query(@Body() data: any): Promise<string> {
    console.log("query")
    console.log(data)
    const queryData = await this.botProvider.handleUpdate(data)
    console.log(queryData)
    // await this.commandHandler.handleQuery(queryData)
    return "query"
  }
}
