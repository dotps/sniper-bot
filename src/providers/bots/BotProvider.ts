import { IQueryData } from "../../data/IQueryData"
import { IBotProvider } from "./IBotProvider"

export abstract class BotProvider implements IBotProvider {
  abstract sendResponse(text: string, queryData: IQueryData): Promise<void>

  abstract getUpdates(): Promise<IQueryData>

  abstract init(): Promise<void>

  abstract handleUpdate(requestData: any): Promise<IQueryData>

  abstract isUseWebhook(): boolean
}
