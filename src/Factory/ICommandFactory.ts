import { ICommand } from "../Commands/ICommand"
import { CommandData } from "../data/CommandData"
import { Command } from "../Commands/CommandHandler"

export interface ICommandFactory {
  // createCommand(commandData: CommandData): ICommand | null
  createCommand(commandData: Command): ICommand | null
}
