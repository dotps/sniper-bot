import { IQueryData } from "../IQueryData"
import { BotType } from "../../providers/bots/IBotProvider"

export class TelegramGetUpdatesResponse {
  updates: IQueryData[]

  constructor(data: any) {
    if (!Array.isArray(data)) {
      this.updates = []
      return
    }

    // TODO: все проверить и реализовать проще, по идее это все не нужно т.к есть QueryDto в bot контроллере
    this.updates = data.map((update) => {
      const updateData: IQueryData = {
        updateId: Number(update?.update_id) || 0,
        chatId: Number(update?.message?.chat?.id) || 0,
        userId: Number(update?.message?.from?.id) || 0,
        text: update?.message?.text.toString() || "",
        firstName: update?.message?.from?.first_name?.toString() || "",
        lastName: update?.message?.from?.last_name?.toString() || "",
        username: update?.message?.from?.username?.toString() || "",
        botType: BotType.TELEGRAM,
      }
      return updateData
    })
  }

  getLastUpdate(): IQueryData | null {
    if (this.updates.length === 0) return null
    return this.updates[this.updates.length - 1]
  }
}
