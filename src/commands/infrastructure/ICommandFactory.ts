import { ICommand } from "./ICommand"
import { Command } from "./BotCommandHandler"
import { User } from "../../users/user.entity"

export interface ICommandFactory {
  createCommand(user: User | null, commandData: Command): ICommand | null
}
