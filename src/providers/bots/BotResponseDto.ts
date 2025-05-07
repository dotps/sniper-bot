import { BotType } from "src/providers/bots/IBotProvider"
import { IBotResponseDto } from "./IBotResponseDto"

export class BotResponseDto implements IBotResponseDto {
  text: string
  updateId: number
  chatId: number
  userId: number
  firstName: string
  lastName: string
  username: string
  botType: BotType

  constructor(data?: BotResponseDto) {
    this.text = data?.text || ""
    this.updateId = data?.updateId || 0
    this.chatId = data?.chatId || 0
    this.userId = data?.userId || 0
  }
}
