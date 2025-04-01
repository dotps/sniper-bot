import { ICommand } from "./ICommand"
import { Injectable } from "@nestjs/common"
import { UserService } from "../users/user.service"
import { Command } from "./CommandHandler"
import { ICommandFactory } from "./ICommandFactory"
import { Commands } from "./Commands"
import { ExitCommand } from "./ExitCommand"
import { StartCommand } from "./StartCommand"
import { User } from "../users/user.entity"
import { AddTokenCommand } from "./AddTokenCommand"
import { TokenService } from "../blockchain/token.service"
import { GetTokenBalanceCommand } from "./GetTokenBalanceCommand"
import { RemoveTokenCommand } from "./RemoveTokenCommand"

@Injectable()
export class CommandFactory implements ICommandFactory {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  createCommand(user: User, commandData: Command): ICommand | null {
    switch (commandData.command) {
      case Commands.EXIT:
        return new ExitCommand()
      case Commands.START:
        return new StartCommand(this.userService, user, commandData)
      case Commands.ADD_TOKEN:
        return new AddTokenCommand(this.tokenService, user, commandData)
      case Commands.REMOVE_TOKEN:
        return new RemoveTokenCommand(this.tokenService, user, commandData)
      case Commands.BALANCE:
        return new GetTokenBalanceCommand(this.tokenService, user, commandData)
      default:
        return null
    }
  }
}
