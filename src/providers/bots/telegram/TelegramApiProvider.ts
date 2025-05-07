import { BotType, IBotProvider } from "../IBotProvider"
import { IWebRequestService } from "../../IWebRequestService"
import { Logger } from "../../../utils/Logger"
import { TelegramCommands } from "./TelegramCommands"
import { TelegramGetUpdatesResponse } from "../../../data/Telegram/TelegramGetUpdatesResponse"
import { IBotResponseDto } from "../IBotResponseDto"
import { RequestDto } from "../../../bots/bots.service"
import { TelegramUpdatesDto, TelegramBaseDto } from "../../../bots/telegram/telegramUpdatesDto"
import { plainToClass } from "class-transformer"
import { validate } from "class-validator"
import { ConfigService } from "@nestjs/config"
import { Config } from "../../../config/config"

export class TelegramApiProvider implements IBotProvider {
  private readonly apiUrl: string
  private readonly token: string
  private readonly baseUrl: string
  private readonly canUseWebhook: boolean
  private readonly canUseUpdate: boolean
  private readonly botType: BotType = BotType.TELEGRAM
  private lastUpdateId: number = 0
  private isBotRunning: boolean = false
  private updateInterval: number = 5000
  private truePattern = "true"

  constructor(
    private readonly webRequestService: IWebRequestService,
    private readonly configService: ConfigService,
  ) {
    this.token = this.configService.get<string>(Config.TELEGRAM_TOKEN) ?? ""
    this.apiUrl = this.configService.get<string>(Config.TELEGRAM_API_URL) ?? ""
    this.canUseWebhook = this.configService.get<string>(Config.TELEGRAM_USE_WEBHOOK)?.toLowerCase() === this.truePattern
    this.canUseUpdate = this.configService.get<string>(Config.TELEGRAM_USE_UPDATE)?.toLowerCase() === this.truePattern
    this.baseUrl = this.apiUrl + this.token + "/"
  }

  getBotType(): BotType {
    return this.botType
  }

  async init(): Promise<void> {
    const telegramResponse = await this.webRequestService.tryGet<TelegramBaseDto>(
      this.baseUrl + TelegramCommands.GET_ME,
    )
    const telegramResponseDto = plainToClass(TelegramBaseDto, telegramResponse)

    if (await this.validateResponse(telegramResponseDto)) {
      this.isBotRunning = true
      return
    } else {
      Logger.error("Не удалось инициализировать бота.")
    }
  }

  async sendResponse(text: string, queryData: IBotResponseDto): Promise<void> {
    if (!this.isBotRunning) {
      Logger.log("Бот не инициализирован.")
      return
    }

    if (queryData.updateId) this.lastUpdateId = queryData.updateId

    const url = `${this.baseUrl}${TelegramCommands.SEND_MESSAGE}?chat_id=${queryData.chatId}&text=${text}`
    const telegramResponse = await this.webRequestService.tryGet<TelegramBaseDto>(url)
    const telegramResponseDto = plainToClass(TelegramBaseDto, telegramResponse)
    await this.validateResponse(telegramResponseDto)
  }

  async getUpdates(): Promise<IBotResponseDto[]> {
    const offset = this.lastUpdateId ? `offset=${this.lastUpdateId + 1}&` : ``
    const updatesUrl = `${this.baseUrl}${TelegramCommands.GET_UPDATES}?${offset}`
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

  private async validateResponse(telegramResponseDto: TelegramUpdatesDto | TelegramBaseDto) {
    if (!telegramResponseDto) return false

    const errors = await validate(telegramResponseDto)
    if (errors.length > 0) {
      Logger.error("Ошибка валидации " + JSON.stringify(errors))
      return false
    }
    return true
  }
}
