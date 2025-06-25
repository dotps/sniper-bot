import { ICommand } from "../infrastructure/command.interface"
import { BotResponseData } from "../../bots/infrastructure/bot-response-data"
import { Command } from "../infrastructure/bot-command.handler"
import { User } from "../../users/user.entity"
import { BotCommands } from "./bot-commands"
import { WalletService } from "../../blockchain/wallet/wallet.service"
import { isAddress } from "viem"
import { ErrorHandler } from "../../libs/core/errors/error.handler"
import { Logger } from "../../libs/core/logger/logger"

export class FollowWalletCommand implements ICommand {
  private readonly walletService: WalletService
  private readonly commandData: Command
  private readonly user: User
  private readonly messages = {
    NEED_WALLET: `Требуется адрес кошелька.\n${BotCommands.Follow} адрес_кошелька`,
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
