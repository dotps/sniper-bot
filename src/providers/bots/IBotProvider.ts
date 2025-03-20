import { IQueryData } from "../../data/IQueryData"

export interface IBotProvider {
  sendResponse(text: string, queryData: IQueryData): Promise<void>

  getUpdates(): Promise<IQueryData>

  init(): Promise<void>

  handleUpdate(requestData: any): Promise<IQueryData>

  isUseWebhook(): boolean
}
