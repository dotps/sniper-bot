import { ICommand } from "./ICommand"
import { Commands } from "./Commands"
import { StartCommand } from "./StartCommand"
import { ExitCommand } from "./ExitCommand"
import { ICommandFactory } from "./ICommandFactory"
import { Command } from "./CommandHandler"
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
