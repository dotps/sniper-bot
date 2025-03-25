import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common"
import { TelegramRequestDto } from "./telegram/telegram-request.dto"
import { BotProvider } from "../providers/bots/BotProvider"
import { CommandHandler } from "../Commands/CommandHandler"
import { Logger } from "../Utils/Logger"
import { TelegramApiProvider } from "../providers/bots/telegram/TelegramApiProvider"
import { VkApiProvider } from "../providers/bots/vk/VkApiProvider"
import { RequestVkDto } from "./vk/request-vk.dto"
import { IQueryData } from "../data/IQueryData"

@Injectable()
export class BotsService implements OnModuleInit {
  private bots: Map<new (...args: any[]) => BotProvider, BotProvider> = new Map()

  constructor(
    private readonly telegramBot: TelegramApiProvider,
    private readonly vkBot: VkApiProvider,
    private readonly commandHandler: CommandHandler,
  ) {}

  addBot<T extends BotProvider>(botClass: new (...args: any[]) => T, bot: T): void {
    this.bots.set(botClass, bot)
  }

  async onModuleInit() {
    this.addBot(TelegramApiProvider, this.telegramBot)
    // this.addBot(VkApiProvider, this.vkBot)
    await this.start()
    console.log("onModuleInit")
  }

  async start(): Promise<void> {
    for (const bot of this.bots.values()) {
      await bot.init()
      if (bot.isUseIntervalUpdate()) {
        setInterval(async () => {
          const queryDataList = await bot.getUpdates()
          if (!queryDataList) return
          console.log(queryDataList)
          await this.handleUpdatesAndResponse(bot, queryDataList)
        }, bot.getUpdateInterval())
      }
    }
  }

  async handleRequest<T extends BotProvider>(data: RequestDto, botClass: new (...args: any[]) => T) {
    if (!data.ok || !data.result) {
      Logger.error("Данные от бота не получены.")
      return
    }

    const bot = this.bots.get(botClass)
    if (!bot) throw new NotFoundException("Бот не найден.")

    const queryDataList = bot.getUpdatesData(data)

    // TODO: его использовать при интервальном обновлении
    await this.handleUpdatesAndResponse(bot, queryDataList)
  }

  async handleUpdatesAndResponse(bot: BotProvider, queryDataList: IQueryData[]) {
    for (const queryData of queryDataList) {
      const response = await this.commandHandler.handleQuery(queryData)
      if (!response) continue
      const responseData = response?.data || []
      for (const text of responseData) {
        await bot.sendResponse(text, queryData)
      }
    }
  }
}

export type RequestDto = TelegramRequestDto | RequestVkDto
