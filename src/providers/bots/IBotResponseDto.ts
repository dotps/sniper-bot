import { BotType } from "./IBotProvider"

export interface IBotResponseDto {
  updateId: number
  chatId: number
  userId: number
  text: string
  firstName: string
  lastName: string
  username: string
  botType: BotType
}
