import { IQueryData } from "../../data/IQueryData"
import { IBotProvider } from "./IBotProvider"
import { TelegramResultDto } from "../../bots/telegram/telegram-request.dto"
import { RequestDto } from "../../bots/bots.service"
import { ITelegramUpdateData } from "../../data/Telegram/ITelegramUpdateData"

export abstract class BotProvider implements IBotProvider {
  abstract sendResponse(text: string, queryData: IQueryData): Promise<void>

  abstract getUpdates(): Promise<IQueryData[]>
  abstract startIntervalUpdates(): void

  abstract init(): Promise<void>

  abstract handleUpdate(requestData: TelegramResultDto): Promise<IQueryData[]>
  abstract getUpdatesData(requestData: RequestDto): IQueryData[]

  abstract isUseWebhook(): boolean
  abstract isUseIntervalUpdate(): boolean

  abstract getUpdateInterval(): number
}
