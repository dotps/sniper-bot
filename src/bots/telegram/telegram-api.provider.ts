import { BotType, IBotProvider } from "../infrastructure/bot-provider.interface"
import { IWebRequestService } from "../../services/web-request/web-request-service.interface"
import { Logger } from "../../services/logger/logger"
import { TelegramCommands } from "./telegram-commands"
import { TelegramGetUpdatesResponse } from "./telegram-get-updates-response"
import { IBotResponseDto } from "../infrastructure/bot-response-dto.interface"
import { RequestDto } from "../bots.service"
import { TelegramUpdatesDto, TelegramBaseDto } from "./telegram-updates.dto"
import { plainToClass } from "class-transformer"
import { validate } from "class-validator"
import { ConfigService } from "@nestjs/config"
import { Config } from "../../config/config"

export class TelegramApiProvider implements IBotProvider {
  private readonly apiUrl: string
  private readonly token: string
  private readonly baseUrl: string
  private readonly canUseWebhook: boolean
  private readonly canUseUpdate: boolean
  private readonly botType: BotType = BotType.Telegram
  private lastUpdateId: number = 0
  private isBotRunning: boolean = false
  private updateInterval: number = 5000
  private truePattern = "true"
  private readonly messages = {
    BOT_NOT_INIT: "Не удалось инициализировать бота.",
    VALIDATION_ERROR: "Ошибка валидации ",
  } as const

  constructor(
    private readonly webRequestService: IWebRequestService,
    private readonly configService: ConfigService,
  ) {
    this.token = this.configService.get<string>(Config.TelegramToken) ?? ""
    this.apiUrl = this.configService.get<string>(Config.TelegramApiUrl) ?? ""
    this.canUseWebhook = this.configService.get<string>(Config.TelegramUseWebhook)?.toLowerCase() === this.truePattern
    this.canUseUpdate = this.configService.get<string>(Config.TelegramUseUpdate)?.toLowerCase() === this.truePattern
    this.baseUrl = this.apiUrl + this.token + "/"
  }

  getBotType(): BotType {
    return this.botType
  }

  async init(): Promise<void> {
    const telegramResponse = await this.webRequestService.tryGet<TelegramBaseDto>(
      this.baseUrl + TelegramCommands.GetMe,
    )
    const telegramResponseDto = plainToClass(TelegramBaseDto, telegramResponse)

    if (await this.validateResponse(telegramResponseDto)) {
      this.isBotRunning = true
      return
    } else {
      Logger.error(this.messages.BOT_NOT_INIT)
    }
  }

  async sendResponse(text: string, queryData: IBotResponseDto): Promise<void> {
    if (!this.isBotRunning) {
      Logger.log(this.messages.BOT_NOT_INIT)
      return
    }

    if (queryData.updateId) this.lastUpdateId = queryData.updateId

    const url = `${this.baseUrl}${TelegramCommands.SendMessage}?chat_id=${queryData.chatId}&text=${text}`
    const telegramResponse = await this.webRequestService.tryGet<TelegramBaseDto>(url)
    const telegramResponseDto = plainToClass(TelegramBaseDto, telegramResponse)
    await this.validateResponse(telegramResponseDto)
  }

  async getUpdates(): Promise<IBotResponseDto[]> {
    const offset = this.lastUpdateId ? `offset=${this.lastUpdateId + 1}&` : ``
    const updatesUrl = `${this.baseUrl}${TelegramCommands.GetUpdates}?${offset}`
    const telegramResponse = await this.webRequestService.tryGet<TelegramUpdatesDto>(updatesUrl)
    const telegramResponseDto = plainToClass(TelegramUpdatesDto, telegramResponse)

    return (await this.validateResponse(telegramResponseDto)) ? this.getUpdatesData(telegramResponseDto) : []
  }

  isUseWebhook(): boolean {
    return this.canUseWebhook
  }

  isUseIntervalUpdate(): boolean {
    return this.canUseUpdate
  }

  getUpdatesData(requestData: RequestDto): IBotResponseDto[] {
    const updateData = new TelegramGetUpdatesResponse(requestData.result)
    return updateData.updates
  }

  getUpdateInterval(): number {
    return this.updateInterval
  }

  private async validateResponse(telegramResponseDto: TelegramUpdatesDto | TelegramBaseDto): Promise<boolean> {
    if (!telegramResponseDto) return false

    const errors = await validate(telegramResponseDto)
    if (errors.length > 0) {
      Logger.error(this.messages.VALIDATION_ERROR + JSON.stringify(errors))
      return false
    }
    return true
  }
}
