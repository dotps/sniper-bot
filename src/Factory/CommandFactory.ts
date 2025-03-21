import { ICommand } from "../Commands/ICommand"
import { Commands } from "../Commands/Commands"
import { StartCommand } from "../Commands/StartCommand"
import { ExitCommand } from "../Commands/ExitCommand"
import { ICommandFactory } from "./ICommandFactory"
import { IModel } from "../Model/IModel"
import { Command } from "../Commands/CommandHandler"

export class CommandFactory implements ICommandFactory {
  private readonly model: IModel

  constructor(model: IModel) {
    this.model = model
  }

  createCommand(commandData: Command): ICommand | null {
    switch (commandData.command) {
      case Commands.EXIT:
        return new ExitCommand(this.model)
      case Commands.START:
        return new StartCommand(commandData)
      default:
        return null
    }
  }
}
