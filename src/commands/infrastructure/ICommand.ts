import { BotResponseData } from "../../bots/infrastructure/BotResponseData"

export interface ICommand {
  execute(): Promise<BotResponseData | null>
}
