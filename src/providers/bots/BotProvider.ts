import { IBotResponseDto } from "./IBotResponseDto"
import { BotType, IBotProvider } from "./IBotProvider"
import { RequestDto } from "../../bots/bots.service"

export abstract class BotProvider implements IBotProvider {
  abstract getBotType(): BotType
  abstract sendResponse(text: string, queryData: IBotResponseDto): Promise<void>
  abstract getUpdates(): Promise<IBotResponseDto[]>
  abstract init(): Promise<void>
  abstract getUpdatesData(requestData: RequestDto): IBotResponseDto[]
  abstract isUseWebhook(): boolean
  abstract isUseIntervalUpdate(): boolean
  abstract getUpdateInterval(): number
}
