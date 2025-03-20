import { ICommand } from "../Commands/ICommand"
import { CommandData } from "../data/CommandData"

export interface ICommandFactory {
  createCommand(commandData: CommandData): ICommand | null
}
