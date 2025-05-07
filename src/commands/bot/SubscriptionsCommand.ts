import { ICommand } from "../infrastructure/ICommand"
import { BotResponseData } from "../../bots/infrastructure/BotResponseData"
import { User } from "../../users/user.entity"
import { WalletService } from "../../blockchain/wallet.service"
import { ErrorHandler } from "../../errors/ErrorHandler"

export class SubscriptionsCommand implements ICommand {
  private readonly walletService: WalletService
  private readonly user: User
  private readonly messages = {
    NOT_FOUND: "Подписки не найдены.",
    CURRENT_SUBSCRIPTIONS: "Текушие подписки:\n",
  } as const

  constructor(walletService: WalletService, user: User) {
    this.user = user
    this.walletService = walletService
  }

  async execute(): Promise<BotResponseData | null> {
    try {
      const followWallets = await this.walletService.getFollowWalletsForUser(this.user.id)
      if (followWallets.length === 0) return new BotResponseData(this.messages.NOT_FOUND)

      const subscriptionMessage = followWallets.map((followWallet) => followWallet.wallet).join("\n")
      return new BotResponseData(this.messages.CURRENT_SUBSCRIPTIONS + subscriptionMessage)
    } catch (error) {
      return ErrorHandler.handleAndResponse(error)
    }
  }
}
