import { ICommand } from "./infrastructure/ICommand"
import { ResponseData } from "../data/ResponseData"
import { Command } from "./infrastructure/CommandHandler"
import { User } from "../users/user.entity"
import { isAddress } from "viem"
import { Commands } from "./Commands"
import { ErrorHandler } from "../errors/ErrorHandler"
import { WalletService } from "../blockchain/wallet.service"

export class UnfollowCommand implements ICommand {
  private readonly messages = {
    NEED_WALLET: `Требуется адрес кошелька.\n${Commands.UNFOLLOW} адрес_кошелька`,
    SUCCESS: "Подписка на кошелек успешно удалена.",
  } as const

  constructor(
    private readonly walletService: WalletService,
    private readonly user: User,
    private readonly commandData: Command,
  ) {}

  async execute(): Promise<ResponseData | null> {
    const [walletAddress] = this.commandData.params || []
    if (!walletAddress || !isAddress(walletAddress)) return new ResponseData(this.messages.NEED_WALLET)

    try {
      await this.walletService.unfollow(walletAddress, this.user.id)
      return new ResponseData(this.messages.SUCCESS)
    } catch (error) {
      return ErrorHandler.handleAndResponse(error)
    }
  }
}
