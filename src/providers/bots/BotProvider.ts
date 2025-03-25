import { IQueryData } from "../../data/IQueryData"
import { IBotProvider } from "./IBotProvider"
import { RequestDto } from "../../bots/bots.service"

export abstract class BotProvider implements IBotProvider {
  abstract sendResponse(text: string, queryData: IQueryData): Promise<void>
  abstract getUpdates(): Promise<IQueryData[]>
  abstract init(): Promise<void>
  abstract getUpdatesData(requestData: RequestDto): IQueryData[]
  abstract isUseWebhook(): boolean
  abstract isUseIntervalUpdate(): boolean
  abstract getUpdateInterval(): number
}
