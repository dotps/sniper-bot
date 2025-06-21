import { BotResponseData } from "../../bots/infrastructure/bot-response-data"

export interface ICommand {
  execute(): Promise<BotResponseData | null>
}
