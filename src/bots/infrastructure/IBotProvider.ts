import { IBotResponseDto } from "./IBotResponseDto"
import { RequestDto } from "../bots.service"

export interface IBotProvider {
  getBotType(): BotType
  sendResponse(text: string, queryData: IBotResponseDto): Promise<void>
  getUpdates(): Promise<IBotResponseDto[]>
  init(): Promise<void>
  getUpdatesData(requestData: RequestDto): IBotResponseDto[]
  isUseWebhook(): boolean
  isUseIntervalUpdate(): boolean
  getUpdateInterval(): number
}

export enum BotType {
  TELEGRAM = "TELEGRAM",
  VK = "VK",
}
