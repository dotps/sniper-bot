import { BotType } from "src/bots/infrastructure/bot-provider.interface"
import { IBotResponseDto } from "./bot-response-dto.interface"

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
