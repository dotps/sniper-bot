import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common"
import { TelegramUpdatesDto } from "./telegram/telegram-updates.dto"
import { BotCommandHandler } from "../commands/infrastructure/bot-command.handler"
import { Logger } from "../services/logger/logger"
import { TelegramApiProvider } from "./telegram/telegram-api.provider"
import { VkUpdatesDto } from "./vk/vk-updates.dto"
import { IBotResponseDto } from "./infrastructure/bot-response-dto.interface"
import { OnEvent } from "@nestjs/event-emitter"
import { events, SendBotEvent } from "../events/events"
import { BotType, IBotProvider } from "./infrastructure/bot-provider.interface"
import { plainToClass } from "class-transformer"
import { BotResponseDto } from "./infrastructure/bot-response.dto"

@Injectable()
export class BotsService implements OnModuleInit {
  private bots: Map<BotsClassType, IBotProvider> = new Map()
  private readonly messages = {
    BOT_ERROR: "Ошибка обработки данных от провайдера бота.",
    BOT_NOT_RESPONSE: "Данные от бота не получены.",
    BOT_NOT_FOUND: "Бот не найден.",
  } as const

  constructor(
    private readonly telegramBot: TelegramApiProvider,
    // private readonly vkBot: VkApiProvider,
    private readonly commandHandler: BotCommandHandler,
  ) {}

  addBot<T extends IBotProvider>(botClass: BotsClassType, bot: T): void {
    this.bots.set(botClass, bot)
  }

  async onModuleInit(): Promise<void> {
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
            Logger.error(this.messages.BOT_ERROR)
          })
        }, bot.getUpdateInterval())
      }
    }
  }

  private async getUpdates(bot: IBotProvider): Promise<void> {
    const queryDataList = await bot.getUpdates()
    if (!queryDataList) return
    await this.handleUpdatesAndSendResponse(bot, queryDataList)
  }

  async handleRequest(data: RequestDto, botClass: BotsClassType): Promise<void> {
    if (!data.ok || !data.result) {
      Logger.error(this.messages.BOT_NOT_RESPONSE)
      return
    }

    const bot = this.bots.get(botClass)
    if (!bot) throw new NotFoundException(this.messages.BOT_NOT_FOUND)

    const queryDataList = bot.getUpdatesData(data)

    await this.handleUpdatesAndSendResponse(bot, queryDataList)
  }

  async handleUpdatesAndSendResponse(bot: IBotProvider, updateDataList: IBotResponseDto[]): Promise<void> {
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

  getBotByType(botType: BotType): IBotProvider {
    for (const bot of this.bots.values()) {
      if (bot.getBotType() === botType) return bot
    }
    throw new NotFoundException("Бот не найден.")
  }

  @OnEvent(events.SEND_BOT_RESPONSE)
  async eventHandlerSendResponse(event: SendBotEvent): Promise<void> {
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
export type BotsClassType<T extends IBotProvider = IBotProvider> = new (...args: any[]) => T
