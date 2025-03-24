import { IQueryData } from "../IQueryData"

export class QueryData implements IQueryData {
  text: string
  updateId: number
  chatId: number
  userId: number

  constructor(data?: any) {
    this.text = data?.text || ""
    this.updateId = data?.updateId || 0
    this.chatId = data?.chatId || 0
    this.userId = data?.userId || 0
  }
}
