import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common"
import { TelegramUpdatesDto } from "./telegram/telegram-updates.dto"
import { BotProvider } from "../providers/bots/BotProvider"
import { BotCommandHandler } from "../commands/infrastructure/BotCommandHandler"
import { Logger } from "../utils/Logger"
import { TelegramApiProvider } from "../providers/bots/telegram/TelegramApiProvider"
import { VkUpdatesDto } from "./vk/vk-updates.dto"
import { IBotResponseDto } from "../providers/bots/IBotResponseDto"
import { OnEvent } from "@nestjs/event-emitter"
import { events, SendBotEvent } from "../events/events"
import { BotType } from "../providers/bots/IBotProvider"
import { plainToClass } from "class-transformer"
import { BotResponseDto } from "../providers/bots/BotResponseDto"

@Injectable()
export class BotsService implements OnModuleInit {
  private bots: Map<new (...args: any[]) => BotProvider, BotProvider> = new Map()

  constructor(
    private readonly telegramBot: TelegramApiProvider,
    // private readonly vkBot: VkApiProvider,
    private readonly commandHandler: BotCommandHandler,
  ) {}

  addBot<T extends BotProvider>(botClass: new (...args: any[]) => T, bot: T): void {
    this.bots.set(botClass, bot)
  }

  async onModuleInit() {
    this.addBot(TelegramApiProvider, this.telegramBot)
    // this.addBot(VkApiProvider, this.vkBot)
    await this.initBots()
  }

  async initBots(): Promise<void> {
    for (const bot of this.bots.values()) {
      await bot.init()
      if (bot.isUseIntervalUpdate()) {
        setInterval(() => {
          this.getUpdates(bot).catch(() => {
            Logger.error("Ошибка обработки данных от провайдера бота.")
          })
        }, bot.getUpdateInterval())
      }
    }
  }

  private async getUpdates(bot: BotProvider): Promise<void> {
    const queryDataList = await bot.getUpdates()
    if (!queryDataList) return
    await this.handleUpdatesAndSendResponse(bot, queryDataList)
  }

  async handleRequest<T extends BotProvider>(data: RequestDto, botClass: new (...args: any[]) => T) {
    if (!data.ok || !data.result) {
      Logger.error("Данные от бота не получены.")
      return
    }

    const bot = this.bots.get(botClass)
    if (!bot) throw new NotFoundException("Бот не найден.")

    const queryDataList = bot.getUpdatesData(data)

    await this.handleUpdatesAndSendResponse(bot, queryDataList)
  }

  async handleUpdatesAndSendResponse(bot: BotProvider, updateDataList: IBotResponseDto[]) {
    for (const updateData of updateDataList) {
      updateData.botType = bot.getBotType()
      const response = await this.commandHandler.handleCommandFromUpdates(updateData)
      if (!response) continue
      const responseData = response?.data || []
      for (const text of responseData) {
        await bot.sendResponse(text, updateData)
      }
    }
  }

  getBotByType(botType: BotType): BotProvider {
    for (const bot of this.bots.values()) {
      if (bot.getBotType() === botType) return bot
    }
    throw new NotFoundException("Бот не найден.")
  }

  @OnEvent(events.SEND_BOT_RESPONSE)
  async eventHandlerSendResponse(event: SendBotEvent) {
    // TODO: убрать return
    console.log("сообщение отправлено, убрать return")
    return

    try {
      const bot = this.getBotByType(event.user.botType)
      const updateData = plainToClass(BotResponseDto, { chatId: event.user.chatId })
      await bot.sendResponse(event.text, updateData)
    } catch (error) {
      Logger.error(error)
    }
  }
}

export type RequestDto = TelegramUpdatesDto | VkUpdatesDto
