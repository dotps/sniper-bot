import { ICommand } from "../infrastructure/command.interface"
import { BotResponseData } from "../../bots/infrastructure/bot-response-data"
import { User } from "../../users/user.entity"
import { WalletService } from "../../blockchain/wallet/wallet.service"
import { ErrorHandler } from "../../libs/core/errors/error.handler"

export class WalletCommand implements ICommand {
  private readonly messages = {
    WALLET: "Кошелек: ",
  } as const

  constructor(
    private readonly walletService: WalletService,
    private readonly user: User,
  ) {}

  async execute(): Promise<BotResponseData | null> {
    try {
      const walletAddress = await this.walletService.getWalletAddressOrCreate(this.user.id)
      return new BotResponseData(this.messages.WALLET + walletAddress)
    } catch (error) {
      return ErrorHandler.handleAndResponse(error)
    }
  }
}
