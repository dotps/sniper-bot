import { Injectable, OnModuleInit } from "@nestjs/common"
import { QueryDto } from "./query.dto"
import { BotProvider } from "../providers/bots/BotProvider"
import { CommandHandler } from "../Commands/CommandHandler"
import { Logger } from "../Utils/Logger"

@Injectable()
export class BotsService implements OnModuleInit {
  private updateInterval: number = 5000

  constructor(
    private readonly botProvider: BotProvider,
    private readonly commandHandler: CommandHandler,
  ) {}

  async onModuleInit() {
    await this.start()
  }

  async start(): Promise<void> {
    await this.botProvider.init()
    if (this.botProvider.isUseUpdate()) {
      this.getBotUpdates()
    }
  }

  async handleQuery(data: QueryDto) {
    if (!data.ok || !data.result) {
      Logger.error("Данные от бота не получены.")
      return
    }
    const queryData = await this.botProvider.handleUpdate(data.result)
    const response = await this.commandHandler.handleQuery(queryData)
    if (!response) return
    const responseData = response?.data || []
    for (const text of responseData) {
      await this.botProvider.sendResponse(text, queryData)
    }
  }

  private getBotUpdates() {
    setInterval(() => {
      this.handleBotUpdate().catch((error) => {
        Logger.error(error)
      })
    }, this.updateInterval)
  }

  private async handleBotUpdate() {
    const queryData = await this.botProvider.getUpdates()
    if (!queryData.text) return
    await this.commandHandler.handleQuery(queryData)
  }
}
