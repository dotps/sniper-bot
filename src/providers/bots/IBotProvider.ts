import { IQueryData } from "../../data/IQueryData"
import { RequestDto } from "../../bots/bots.service"

export interface IBotProvider {
  getBotType(): BotType
  sendResponse(text: string, queryData: IQueryData): Promise<void>
  getUpdates(): Promise<IQueryData[]>
  init(): Promise<void>
  getUpdatesData(requestData: RequestDto): IQueryData[]
  isUseWebhook(): boolean
  isUseIntervalUpdate(): boolean
  getUpdateInterval(): number
}

export enum BotType {
  TELEGRAM = "TELEGRAM",
  VK = "VK",
}
