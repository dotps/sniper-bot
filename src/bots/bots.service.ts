import { Injectable, OnModuleInit } from "@nestjs/common"
import { RequestTelegramDto } from "./telegram/request-telegram.dto"
import { BotProvider } from "../providers/bots/BotProvider"
import { CommandHandler } from "../Commands/CommandHandler"
import { Logger } from "../Utils/Logger"
import { CommandFactory } from "../Factory/CommandFactory"
import { UserService } from "../users/user.service"

@Injectable()
export class BotsService implements OnModuleInit {
  private updateInterval: number = 5000
  private readonly commandHandler: CommandHandler

  constructor(
    private readonly botProvider: BotProvider,
    private readonly vkBot: BotProvider,
    private readonly userService: UserService,
    // private readonly commandHandler: CommandHandler,
  ) {
    this.commandHandler = new CommandHandler(new CommandFactory(this.userService))
  }

  async onModuleInit() {
    await this.start()
  }

  async start(): Promise<void> {
    await this.botProvider.init()
    if (this.botProvider.isUseUpdate()) {
      this.getBotUpdates()
    }
  }

  async handleRequest(data: RequestTelegramDto) {
    if (!data.ok || !data.result) {
      Logger.error("Данные от бота не получены.")
      return
    }

    for (const updateData of data.result) {
      console.log(updateData)
      const queryData = await this.botProvider.handleUpdate(updateData)
      const response = await this.commandHandler.handleQuery(queryData)
      if (!response) return
      const responseData = response?.data || []
      for (const text of responseData) {
        await this.botProvider.sendResponse(text, queryData)
      }
    }



    // const queryData = await this.botProvider.handleUpdate(data.result)
    // const response = await this.commandHandler.handleQuery(queryData)
    // if (!response) return
    // const responseData = response?.data || []
    // for (const text of responseData) {
    //   await this.botProvider.sendResponse(text, queryData)
    // }
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
