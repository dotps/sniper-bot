import { IQueryData } from "../../data/IQueryData"

export abstract class IBotProvider {
  abstract sendResponse(text: string, queryData: IQueryData): Promise<void>
  abstract getUpdates(): Promise<IQueryData>
  abstract init(): Promise<void>
  abstract handleUpdate(requestData: any): Promise<IQueryData>
  abstract isUseWebhook(): boolean
}
// export interface IBotProvider {
//   sendResponse(text: string, queryData: IQueryData): Promise<void>
//   getUpdates(): Promise<IQueryData>
//   init(): Promise<void>
//   handleUpdate(requestData: any): Promise<IQueryData>
//   isUseWebhook(): boolean
// }
