import { IQueryData } from "../../data/IQueryData"
import { IBotProvider } from "./IBotProvider"
import { ResultTelegramDto } from "../../bots/telegram/request-telegram.dto"

export abstract class BotProvider implements IBotProvider {
  abstract sendResponse(text: string, queryData: IQueryData): Promise<void>

  abstract getUpdates(): Promise<IQueryData>

  abstract init(): Promise<void>

  abstract handleUpdate(requestData: ResultTelegramDto): Promise<IQueryData>

  abstract isUseWebhook(): boolean
  abstract isUseUpdate(): boolean
}
