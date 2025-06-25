import { User } from "../users/user.entity"

export enum events {
  SendBotResponse = "send.bot.response",
}

export type SendBotEvent = {
  user: User
  text: string
}
