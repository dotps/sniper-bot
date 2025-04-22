import { User } from "../users/user.entity"

export enum events {
  SEND_BOT_RESPONSE = "send.bot.response",
}

export type SendBotEvent = {
  user: User
  text: string
}
