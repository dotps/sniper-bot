import { ICommand } from "./infrastructure/ICommand"
import { ResponseData } from "../data/ResponseData"
import { User } from "../users/user.entity"
import { WalletService } from "../blockchain/wallet.service"
import { ErrorHandler } from "../errors/ErrorHandler"

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

  async execute(): Promise<ResponseData | null> {
    try {
      const followWallets = await this.walletService.getFollowWallets(this.user.id)
      if (followWallets.length === 0) return new ResponseData(this.messages.NOT_FOUND)

      const subscriptionMessage = followWallets.map((followWallet) => followWallet.wallet).join("\n")
      return new ResponseData(this.messages.CURRENT_SUBSCRIPTIONS + subscriptionMessage)
    } catch (error) {
      return ErrorHandler.handleAndResponse(error)
    }
  }
}
