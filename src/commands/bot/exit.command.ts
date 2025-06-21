import { BotResponseData } from "../../bots/infrastructure/bot-response-data"
import { ICommand } from "../infrastructure/command.interface"

export class ExitCommand implements ICommand {
  private response: string[] = ["Выход."]

  constructor() {}

  async execute(): Promise<BotResponseData | null> {
    return new BotResponseData(this.response)
  }
}
