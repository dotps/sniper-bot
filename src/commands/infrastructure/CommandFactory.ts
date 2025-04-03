import { ICommand } from "./ICommand"
import { Injectable } from "@nestjs/common"
import { UserService } from "../../users/user.service"
import { Command } from "./CommandHandler"
import { ICommandFactory } from "./ICommandFactory"
import { Commands } from "../Commands"
import { ExitCommand } from "../ExitCommand"
import { StartCommand } from "../StartCommand"
import { User } from "../../users/user.entity"
import { AddTokenCommand } from "../AddTokenCommand"
import { TokenService } from "../../blockchain/token.service"
import { GetTokenBalanceCommand } from "../GetTokenBalanceCommand"
import { RemoveTokenCommand } from "../RemoveTokenCommand"
import { FollowWalletCommand } from "../FollowWalletCommand"
import { WalletService } from "../../blockchain/wallet.service"
import { ReplicateCommand } from "../ReplicateCommand"
import { SubscriptionsCommand } from "../SubscriptionsCommand"
import { UnfollowCommand } from "../UnfollowCommand"
import { SendCommand } from "../SendCommand"
import { BlockchainService } from "../../blockchain/blockchain.service"

@Injectable()
export class CommandFactory implements ICommandFactory {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly walletService: WalletService,
    private readonly blockchainService: BlockchainService,
  ) {}

  createCommand(user: User, commandData: Command): ICommand | null {
    switch (commandData.command) {
      case Commands.EXIT:
        return new ExitCommand()
      case Commands.START:
        return new StartCommand(this.userService, this.walletService, user)
      case Commands.ADD_TOKEN:
        return new AddTokenCommand(this.tokenService, this.blockchainService, user, commandData)
      case Commands.REMOVE_TOKEN:
        return new RemoveTokenCommand(this.tokenService, user, commandData)
      case Commands.BALANCE:
        return new GetTokenBalanceCommand(this.tokenService, this.blockchainService, this.walletService, user)
      case Commands.FOLLOW:
        return new FollowWalletCommand(this.walletService, user, commandData)
      case Commands.UNFOLLOW:
        return new UnfollowCommand(this.walletService, user, commandData)
      case Commands.REPLICATE:
        return new ReplicateCommand(this.walletService, user, commandData)
      case Commands.SUBSCRIPTIONS:
        return new SubscriptionsCommand(this.walletService, user)
      case Commands.SEND:
        return new SendCommand(this.walletService, user, commandData)
      default:
        return null
    }
  }
}
