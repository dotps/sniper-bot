import { IQueryData } from "../../data/IQueryData"
import { RequestDto } from "../../bots/bots.service"

export interface IBotProvider {
  sendResponse(text: string, queryData: IQueryData): Promise<void>

  getUpdates(): Promise<IQueryData[]>
  // startIntervalUpdates(): void

  init(): Promise<void>

  handleUpdate(requestData: any): Promise<IQueryData[]>
  getUpdatesData(requestData: RequestDto): IQueryData[]

  isUseWebhook(): boolean
  isUseIntervalUpdate(): boolean

  getUpdateInterval(): number
}

export enum BotType {
  TELEGRAM = "TELEGRAM",
  VK = "VK",
}
