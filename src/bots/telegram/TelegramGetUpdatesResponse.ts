import { IBotResponseDto } from "../infrastructure/IBotResponseDto"
import { BotType } from "../infrastructure/IBotProvider"
import { TelegramResultDto } from "./telegram-updates.dto"

export class TelegramGetUpdatesResponse {
  updates: IBotResponseDto[]

  constructor(data: TelegramResultDto[]) {
    if (!Array.isArray(data)) {
      this.updates = []
      return
    }
    // console.log(data)

    this.updates = data.map((update: TelegramResultDto) => {
      const updateData: IBotResponseDto = {
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

  getLastUpdate(): IBotResponseDto | null {
    if (this.updates.length === 0) return null
    return this.updates[this.updates.length - 1]
  }
}
