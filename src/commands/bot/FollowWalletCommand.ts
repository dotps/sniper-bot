import { ICommand } from "../infrastructure/ICommand"
import { BotResponseData } from "../../bots/infrastructure/BotResponseData"
import { Command } from "../infrastructure/BotCommandHandler"
import { User } from "../../users/user.entity"
import { BotCommands } from "./BotCommands"
import { WalletService } from "../../blockchain/wallet.service"
import { isAddress } from "viem"
import { ErrorHandler } from "../../errors/ErrorHandler"

export class FollowWalletCommand implements ICommand {
  private readonly walletService: WalletService
  private readonly commandData: Command
  private readonly user: User
  private readonly messages = {
    NEED_WALLET: `Требуется адрес кошелька.\n${BotCommands.FOLLOW} адрес_кошелька`,
    SUCCESS: "Подписка на кошелек успешно оформлена.",
  } as const

  constructor(walletService: WalletService, user: User, commandData: Command) {
    this.user = user
    this.walletService = walletService
    this.commandData = commandData
  }

  async execute(): Promise<BotResponseData | null> {
    const [walletAddress] = this.commandData.params || []
    if (!walletAddress || !isAddress(walletAddress)) return new BotResponseData(this.messages.NEED_WALLET)

    try {
      await this.walletService.createFollowWallet(walletAddress, this.user.id)
      return new BotResponseData(this.messages.SUCCESS)
    } catch (error) {
      return ErrorHandler.handleAndResponse(error)
    }
  }
}
