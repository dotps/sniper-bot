import { ICommand } from "../infrastructure/ICommand"
import { BotResponseData } from "../../bots/infrastructure/BotResponseData"
import { Command } from "../infrastructure/BotCommandHandler"
import { User } from "../../users/user.entity"
import { BotCommands } from "./BotCommands"
import { WalletService } from "../../blockchain/wallet/wallet.service"
import { isAddress } from "viem"
import { ErrorHandler } from "../../errors/ErrorHandler"
import { Logger } from "../../services/logger/Logger"

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
    const addresses = this.commandData.params || []
    if (addresses.length === 0) return new BotResponseData(this.messages.NEED_WALLET)

    try {
      const response: string[] = []
      for (const address of addresses) {
        if (!address || !isAddress(address)) return new BotResponseData(this.messages.NEED_WALLET)
        await this.walletService.createFollowWallet(address, this.user.id)
        response.push(address + " " + this.messages.SUCCESS)
      }
      return new BotResponseData(response)
    } catch (error) {
      // Logger.log(error.message)
      return ErrorHandler.handleAndResponse(error)
    }
  }
}
