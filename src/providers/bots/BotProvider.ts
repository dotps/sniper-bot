import { IQueryData } from "../../data/IQueryData"
import { IBotProvider } from "./IBotProvider"
import { ResultTelegramDto } from "../../bots/telegram/request-telegram.dto"
import { RequestDto } from "../../bots/bots.service"
import { ITelegramUpdateData } from "../../data/Telegram/ITelegramUpdateData"

export abstract class BotProvider implements IBotProvider {
  abstract sendResponse(text: string, queryData: IQueryData): Promise<void>

  abstract getUpdates(): Promise<IQueryData>
  abstract getBotUpdates()

  abstract init(): Promise<void>

  abstract handleUpdate(requestData: ResultTelegramDto): Promise<IQueryData[]>
  abstract getUpdatesData(requestData: RequestDto): Promise<ITelegramUpdateData[]>

  abstract isUseWebhook(): boolean
  abstract isUseUpdate(): boolean
}
