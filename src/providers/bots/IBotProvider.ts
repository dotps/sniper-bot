import { IQueryData } from "../../data/IQueryData"
import { RequestDto } from "../../bots/bots.service"
import { ITelegramUpdateData } from "../../data/Telegram/ITelegramUpdateData"

export interface IBotProvider {
  sendResponse(text: string, queryData: IQueryData): Promise<void>

  getUpdates(): Promise<IQueryData>
  getBotUpdates(): void

  init(): Promise<void>

  handleUpdate(requestData: any): Promise<IQueryData[]>
  getUpdatesData(requestData: RequestDto): Promise<ITelegramUpdateData[]>

  isUseWebhook(): boolean
  isUseUpdate(): boolean
}

export enum BotType {
  TELEGRAM = "TELEGRAM",
  VK = "VK",
}
