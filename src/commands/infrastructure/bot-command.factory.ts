import { ICommand } from "./command.interface"
import { Injectable } from "@nestjs/common"
import { UserService } from "../../users/user.service"
import { Command } from "./bot-command.handler"
import { ICommandFactory } from "./command-factory.interface"
import { BotCommands } from "../bot/bot-commands"
import { ExitCommand } from "../bot/exit.command"
import { StartCommand } from "../bot/start.command"
import { User } from "../../users/user.entity"
import { AddTokenCommand } from "../bot/add-token.command"
import { TokenService } from "../../blockchain/token/token.service"
import { TokenBalanceCommand } from "../bot/token-balance.command"
import { RemoveTokenCommand } from "../bot/remove-token.command"
import { FollowWalletCommand } from "../bot/follow-wallet.command"
import { WalletService } from "../../blockchain/wallet/wallet.service"
import { ReplicateCommand } from "../bot/replicate.command"
import { SubscriptionsCommand } from "../bot/subscriptions.command"
import { UnfollowCommand } from "../bot/unfollow.command"
import { SendCommand } from "../bot/send.command"
import { BlockchainService } from "../../blockchain/blockchain.service"
import { WalletCommand } from "../bot/wallet.command"
import { BlockchainTokenService } from "../../blockchain/blockchain-token.service"

@Injectable()
export class BotCommandFactory implements ICommandFactory {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly walletService: WalletService,
    private readonly blockchainService: BlockchainService,
    private readonly blockchainTokenService: BlockchainTokenService,
  ) {}

  createCommand(user: User, commandData: Command): ICommand | null {
    switch (commandData.command) {
      case BotCommands.Exit:
        return new ExitCommand()
      case BotCommands.Start:
        return new StartCommand(this.userService, this.walletService, user)
      case BotCommands.AddToken:
        return new AddTokenCommand(this.tokenService, this.blockchainTokenService, user, commandData)
      case BotCommands.RemoveToken:
        return new RemoveTokenCommand(this.tokenService, user, commandData)
      case BotCommands.Balance:
        return new TokenBalanceCommand(
          this.tokenService,
          this.blockchainService,
          this.blockchainTokenService,
          this.walletService,
          user,
        )
      case BotCommands.Follow:
        return new FollowWalletCommand(this.walletService, user, commandData)
      case BotCommands.Unfollow:
        return new UnfollowCommand(this.walletService, user, commandData)
      case BotCommands.Replicate:
        return new ReplicateCommand(this.walletService, user, commandData, this.tokenService)
      case BotCommands.Subscriptions:
        return new SubscriptionsCommand(this.walletService, user)
      case BotCommands.Send:
        return new SendCommand(this.blockchainTokenService, this.walletService, user, commandData)
      case BotCommands.Wallet:
        return new WalletCommand(this.walletService, user)
      default:
        return null
    }
  }
}
