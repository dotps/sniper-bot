import { IQueryData } from "../IQueryData"

export class TelegramGetUpdatesResponse {
  updates: IQueryData[]

  constructor(data: any) {
    if (!Array.isArray(data)) {
      this.updates = []
      return
    }

    // TODO: все проверить и реализовать проще, по идее это все не нужно т.к есть QueryDto в bots контроллере
    this.updates = data.map((update) => ({
      updateId: update.update_id || 0,
      chatId: update.message?.chat?.id || 0,
      userId: update.message?.from?.id || 0,
      text: update.message?.text || "",
    }))
  }

  getLastUpdate(): IQueryData | null {
    if (this.updates.length === 0) return null
    return this.updates[this.updates.length - 1]
  }
}
