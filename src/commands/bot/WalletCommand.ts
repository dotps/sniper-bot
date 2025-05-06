import { ICommand } from "../infrastructure/ICommand"
import { ResponseData } from "../../data/ResponseData"
import { User } from "../../users/user.entity"
import { WalletService } from "../../blockchain/wallet.service"
import { ErrorHandler } from "../../errors/ErrorHandler"

export class WalletCommand implements ICommand {
  private readonly messages = {
    WALLET: "Кошелек: ",
  } as const

  constructor(
    private readonly walletService: WalletService,
    private readonly user: User,
  ) {}

  async execute(): Promise<ResponseData | null> {
    try {
      const walletAddress = await this.walletService.getWalletAddressOrCreate(this.user.id)
      return new ResponseData(this.messages.WALLET + walletAddress)
    } catch (error) {
      return ErrorHandler.handleAndResponse(error)
    }
  }
}
