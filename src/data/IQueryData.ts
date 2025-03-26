import { BotType } from "../providers/bots/IBotProvider"

export interface IQueryData {
  updateId: number
  chatId: number
  userId: number
  text: string
  firstName: string
  lastName: string
  username: string
  botType: BotType
}
