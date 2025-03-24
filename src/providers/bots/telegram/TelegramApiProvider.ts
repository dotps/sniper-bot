import { IBotProvider } from "../IBotProvider"
import { IWebRequestService } from "../../IWebRequestService"
import { Logger } from "../../../Utils/Logger"
import { TelegramCommands } from "./TelegramCommands"
import { TelegramBaseResponse } from "../../../data/Telegram/TelegramBaseResponse"
import { TelegramGetUpdatesResponse } from "../../../data/Telegram/TelegramGetUpdatesResponse"
import { QueryData } from "../../../data/Telegram/QueryData"
import { IQueryData } from "../../../data/IQueryData"
import { TelegramConfig } from "./TelegramConfig"
import { RequestDto } from "../../../bots/bots.service"

export class TelegramApiProvider implements IBotProvider {
  private readonly apiUrl: string = "https://api.telegram.org/bot"
  private readonly token: string = TelegramConfig.token
  private readonly baseUrl: string = this.apiUrl + this.token + "/"
  private readonly webRequestService: IWebRequestService
  private readonly canUseWebhook = TelegramConfig.canUseWebhook
  private readonly canUseUpdate = TelegramConfig.canUseUpdate
  private lastUpdateId: number = 0
  private errorMessage: string = "Telegram не ok: "
  private isBotRunning: boolean = false
  private updateInterval: number = 5000

  constructor(webRequestService: IWebRequestService) {
    this.webRequestService = webRequestService
  }

  async init(): Promise<void> {
    const response = await this.webRequestService.tryGet<TelegramBaseResponse>(this.baseUrl + TelegramCommands.GET_ME)
    if (response.ok) {
      this.isBotRunning = true
      return
    } else {
      Logger.error("Не удалось инициализировать бота.")
    }
  }

  async sendResponse(text: string, queryData: IQueryData): Promise<void> {
    if (!this.isBotRunning) {
      Logger.log("Бот не инициализирован.")
      return
    }

    const url = `${this.baseUrl}${TelegramCommands.SEND_MESSAGE}?chat_id=${queryData.chatId}&text=${text}`
    const response = await this.webRequestService.tryGet<TelegramBaseResponse>(url)
    if (!response?.ok) Logger.error(this.errorMessage + JSON.stringify(response))
  }

  async getUpdates(): Promise<IQueryData> {
    // TODO: переделать
    let queryData = new QueryData()
    // const offset = this.lastUpdateId ? `offset=${this.lastUpdateId + 1}&` : ``
    // const botResponse = await this.webRequestService.tryGet(
    //   `${this.baseUrl}${TelegramCommands.GET_UPDATES}?${offset}`,
    // )
    // const response = new TelegramBaseResponse(botResponse)
    //
    // if (response.ok) {
    //   queryData = await this.handleUpdate(response.result)
    // } else {
    //   Logger.error(this.errorMessage + JSON.stringify(response))
    // }

    return queryData
  }

  async handleUpdate(requestData: any): Promise<QueryData[]> {
    let queryData: QueryData[] = []
    // let queryData = new TelegramQueryData()
    // const updateData = new TelegramGetUpdatesResponse(requestData)
    // return updateData.updates
    // if (updateData) {
    //   const lastUpdate = updateData.getLastUpdate()
    //   if (lastUpdate) {
    //     this.lastUpdateId = lastUpdate.updateId
    //     queryData = new TelegramQueryData(lastUpdate)
    //   }
    // }
    return queryData
  }

  isUseWebhook(): boolean {
    return this.canUseWebhook
  }

  isUseUpdate(): boolean {
    return this.canUseUpdate
  }

  getBotUpdates() {
    // TODO: сделать подписку/отписку для отправки данных в сервис
    setInterval(() => {
      this.handleBotUpdate().catch((error) => {
        Logger.error(error)
      })
    }, this.updateInterval)
  }

  async handleBotUpdate(): Promise<IQueryData | null> {
    const queryData = await this.getUpdates()
    if (!queryData.text) return null
    return queryData
  }

  async getUpdatesData(requestData: RequestDto): Promise<IQueryData[]> {
    const updateData = new TelegramGetUpdatesResponse(requestData.result)
    return updateData.updates
  }
}
