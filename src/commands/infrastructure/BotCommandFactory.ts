import { ICommand } from "./ICommand"
import { Injectable } from "@nestjs/common"
import { UserService } from "../../users/user.service"
import { Command } from "./BotCommandHandler"
import { ICommandFactory } from "./ICommandFactory"
import { BotCommands } from "../bot/BotCommands"
import { ExitCommand } from "../bot/ExitCommand"
import { StartCommand } from "../bot/StartCommand"
import { User } from "../../users/user.entity"
import { AddTokenCommand } from "../bot/AddTokenCommand"
import { TokenService } from "../../blockchain/token.service"
import { TokenBalanceCommand } from "../bot/TokenBalanceCommand"
import { RemoveTokenCommand } from "../bot/RemoveTokenCommand"
import { FollowWalletCommand } from "../bot/FollowWalletCommand"
import { WalletService } from "../../blockchain/wallet.service"
import { ReplicateCommand } from "../bot/ReplicateCommand"
import { SubscriptionsCommand } from "../bot/SubscriptionsCommand"
import { UnfollowCommand } from "../bot/UnfollowCommand"
import { SendCommand } from "../bot/SendCommand"
import { BlockchainService } from "../../blockchain/blockchain.service"
import { WalletCommand } from "../bot/WalletCommand"

@Injectable()
export class BotCommandFactory implements ICommandFactory {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly walletService: WalletService,
    private readonly blockchainService: BlockchainService,
  ) {}

  createCommand(user: User, commandData: Command): ICommand | null {
    switch (commandData.command) {
      case BotCommands.EXIT:
        return new ExitCommand()
      case BotCommands.START:
        return new StartCommand(this.userService, this.walletService, user)
      case BotCommands.ADD_TOKEN:
        return new AddTokenCommand(this.tokenService, this.blockchainService, user, commandData)
      case BotCommands.REMOVE_TOKEN:
        return new RemoveTokenCommand(this.tokenService, user, commandData)
      case BotCommands.BALANCE:
        return new TokenBalanceCommand(this.tokenService, this.blockchainService, this.walletService, user)
      case BotCommands.FOLLOW:
        return new FollowWalletCommand(this.walletService, user, commandData)
      case BotCommands.UNFOLLOW:
        return new UnfollowCommand(this.walletService, user, commandData)
      case BotCommands.REPLICATE:
        return new ReplicateCommand(this.walletService, user, commandData, this.tokenService)
      case BotCommands.SUBSCRIPTIONS:
        return new SubscriptionsCommand(this.walletService, user)
      case BotCommands.SEND:
        return new SendCommand(this.blockchainService, this.walletService, user, commandData)
      case BotCommands.WALLET:
        return new WalletCommand(this.walletService, user)
      default:
        return null
    }
  }
}
