import { ICommand } from "../Commands/ICommand"
import { Commands } from "../Commands/Commands"
import { StartCommand } from "../Commands/StartCommand"
import { ExitCommand } from "../Commands/ExitCommand"
import { ICommandFactory } from "./ICommandFactory"
import { Command } from "../Commands/CommandHandler"
import { Injectable } from "@nestjs/common"
import { UserService } from "../users/user.service"

@Injectable()
export class CommandFactory implements ICommandFactory {
  constructor(private readonly userService: UserService) {}
  // constructor() {}

  createCommand(commandData: Command): ICommand | null {
    // console.log(this.userService)
    switch (commandData.command) {
      case Commands.EXIT:
        return new ExitCommand()
      case Commands.START:
        return new StartCommand(this.userService, commandData)
      default:
        return null
    }
  }
}
