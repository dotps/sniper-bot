import { ICommand } from "./ICommand"
import { ResponseData } from "../data/ResponseData"
import { Command } from "./CommandHandler"
import { User } from "../users/user.entity"
import { ResponseBotError } from "../errors/ResponseBotError"
import { Logger } from "../utils/Logger"
import { Commands } from "./Commands"
import { WalletService } from "../blockchain/wallet.service"
import { isAddress } from "viem"

export class FollowWalletCommand implements ICommand {
  private readonly walletService: WalletService
  private readonly commandData: Command
  private readonly user: User
  private readonly messages = {
    NEED_WALLET: `Требуется адрес кошелька.\n${Commands.FOLLOW} адрес_кошелька`,
    SUCCESS: "Подписка на кошелек успешно оформлена.",
  } as const

  constructor(walletService: WalletService, user: User, commandData: Command) {
    this.user = user
    this.walletService = walletService
    this.commandData = commandData
  }

  async execute(): Promise<ResponseData | null> {
    const [walletAddress] = this.commandData.params || []
    if (!walletAddress || !isAddress(walletAddress)) return new ResponseData(this.messages.NEED_WALLET)

    try {
      await this.walletService.followWallet(walletAddress, this.user.id)
      // return new ResponseData()
    } catch (error) {
      if (error instanceof ResponseBotError) {
        return new ResponseData(error.message)
      } else {
        Logger.error(error)
        return null
      }
    }

    return new ResponseData()
  }
}
