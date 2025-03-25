import { ICommand } from "./ICommand"
import { Injectable } from "@nestjs/common"
import { UserService } from "../users/user.service"
import { Command } from "./CommandHandler"
import { ICommandFactory } from "./ICommandFactory"
import { Commands } from "./Commands"
import { ExitCommand } from "./ExitCommand"
import { StartCommand } from "./StartCommand"
import { User } from "../users/user.entity"

@Injectable()
export class CommandFactory implements ICommandFactory {
  constructor(private readonly userService: UserService) {}

  createCommand(user: User, commandData: Command): ICommand | null {
    // console.log(this.userService)
    switch (commandData.command) {
      case Commands.EXIT:
        return new ExitCommand()
      case Commands.START:
        return new StartCommand(this.userService, user, commandData)
      default:
        return null
    }
  }
}
