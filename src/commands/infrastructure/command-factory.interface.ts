import { ICommand } from "./command.interface"
import { Command } from "./bot-command.handler"
import { User } from "../../users/user.entity"

export interface ICommandFactory {
  createCommand(user: User | null, commandData: Command): ICommand | null
}
