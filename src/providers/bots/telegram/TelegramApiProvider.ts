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
import { TelegramRequestDto } from "../../../bots/telegram/telegram-request.dto"
import { Injectable } from "@nestjs/common"

@Injectable()
export class TelegramApiProvider implements IBotProvider {
  private readonly apiUrl: string = "https://api.telegram.org/bot"
  private readonly token: string = TelegramConfig.token
  private readonly baseUrl: string = this.apiUrl + this.token + "/"
  private readonly canUseWebhook = TelegramConfig.canUseWebhook
  private readonly canUseUpdate = TelegramConfig.canUseUpdate
  private lastUpdateId: number = 0
  private errorMessage: string = "Telegram не ok: "
  private isBotRunning: boolean = false
  private updateInterval: number = 5000

  constructor(private readonly webRequestService: IWebRequestService) {}

  async init(): Promise<void> {
    const response = await this.webRequestService.tryGet<TelegramRequestDto>(this.baseUrl + TelegramCommands.GET_ME)
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

    this.lastUpdateId = queryData.updateId

    const url = `${this.baseUrl}${TelegramCommands.SEND_MESSAGE}?chat_id=${queryData.chatId}&text=${text}`
    const response = await this.webRequestService.tryGet<TelegramBaseResponse>(url)
    if (!response?.ok) Logger.error(this.errorMessage + JSON.stringify(response))
  }

  // async getUpdates(callback?: (queryDataList: IQueryData[]) => void): Promise<IQueryData[]> {
  async getUpdates(): Promise<IQueryData[]> {
    // const queryDataList = this.getUpdatesData(data)
    // TODO: где-то перестал записываться последний lastUpdateId
    // let queryData: QueryData[] = []
    const offset = this.lastUpdateId ? `offset=${this.lastUpdateId + 1}&` : ``
    const updatesUrl = `${this.baseUrl}${TelegramCommands.GET_UPDATES}?${offset}`
    // TODO: тут бы проверить на валидность объекта, ValidationPipes ?
    const response = await this.webRequestService.tryGet<TelegramRequestDto>(updatesUrl)

    if (!response?.ok) {
      Logger.error(this.errorMessage + JSON.stringify(response))
      return []
    }

    return this.getUpdatesData(response)

    // if (response.ok) {
    //   const queryDataList = this.getUpdatesData(response)
    //   // console.log(queryDataList)
    //   if (callback) {
    //     callback(queryDataList)
    //   }
    //   // TODO: отправить в bots service
    //   // queryData = await this.handleUpdate(response.result)
    // } else {
    //   Logger.error(this.errorMessage + JSON.stringify(response))
    // }

    // return queryData
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

  isUseIntervalUpdate(): boolean {
    return this.canUseUpdate
  }

  getUpdatesData(requestData: RequestDto): IQueryData[] {
    const updateData = new TelegramGetUpdatesResponse(requestData.result)
    return updateData.updates
  }

  getUpdateInterval(): number {
    return this.updateInterval
  }
}
