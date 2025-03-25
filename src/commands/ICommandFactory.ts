import { ICommand } from "./ICommand"
import { CommandData } from "../data/CommandData"
import { Command } from "./CommandHandler"

export interface ICommandFactory {
  // createCommand(commandData: CommandData): ICommand | null
  createCommand(commandData: Command): ICommand | null
}
