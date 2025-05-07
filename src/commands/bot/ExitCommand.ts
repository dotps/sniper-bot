import { BotResponseData } from "../../providers/bots/BotResponseData"
import { ICommand } from "../infrastructure/ICommand"

export class ExitCommand implements ICommand {
  private response: string[] = ["Выход."]

  constructor() {}

  async execute(): Promise<BotResponseData | null> {
    return new BotResponseData(this.response)
  }
}
