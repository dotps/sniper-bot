import { ICommand } from "../Commands/ICommand"
import { Commands } from "../Commands/Commands"
import { StartCommand } from "../Commands/StartCommand"
import { ExitCommand } from "../Commands/ExitCommand"
import { ICommandFactory } from "./ICommandFactory"
import { IModel } from "../Model/IModel"
import { CommandData } from "../data/CommandData"

export class CommandFactory implements ICommandFactory {
  private readonly model: IModel

  constructor(model: IModel) {
    this.model = model
  }

  createCommand(commandData: CommandData): ICommand | null {
    switch (commandData.input) {
      case Commands.EXIT:
        return new ExitCommand(this.model)
      case Commands.START:
        return new StartCommand()
      default:
        return null
    }
  }
}
