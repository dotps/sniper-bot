import { Injectable } from "@nestjs/common"
import { QueryDto } from "./query.dto"
import { BotProvider } from "../providers/bots/BotProvider"
import { CommandHandler } from "../Commands/CommandHandler"

@Injectable()
export class BotsService {
  private updateInterval: number = 5000

  constructor(
    private readonly botProvider: BotProvider,
    private readonly commandHandler: CommandHandler,
  ) {}

  async start(): Promise<void> {
    await this.botProvider.init()
    if (this.botProvider.isUseUpdate()) {
      this.getBotUpdates()
    }
  }

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

  private getBotUpdates() {
    setInterval(async () => {
      const queryData = await this.botProvider.getUpdates()
      console.log(queryData)
      if (!queryData.text) return
      await this.commandHandler.handleQuery(queryData)
    }, this.updateInterval)
  }
}
