import { BotResponseData } from "../../providers/bots/BotResponseData"

export interface ICommand {
  execute(): Promise<BotResponseData | null>
}
