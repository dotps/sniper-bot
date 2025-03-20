import { IQueryData } from "../IQueryData"

export class TelegramQueryData implements IQueryData {
  text: string
  updateId: number
  chatId: number

  constructor(data?: any) {
    this.text = data?.text || ""
    this.updateId = data?.updateId || 0
    this.chatId = data?.chatId || 0
  }
}
