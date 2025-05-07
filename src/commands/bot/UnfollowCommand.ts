import { ICommand } from "../infrastructure/ICommand"
import { BotResponseData } from "../../bots/infrastructure/BotResponseData"
import { Command } from "../infrastructure/BotCommandHandler"
import { User } from "../../users/user.entity"
import { isAddress } from "viem"
import { BotCommands } from "./BotCommands"
import { ErrorHandler } from "../../errors/ErrorHandler"
import { WalletService } from "../../blockchain/wallet.service"

export class UnfollowCommand implements ICommand {
  private readonly messages = {
    NEED_WALLET: `Требуется адрес кошелька.\n${BotCommands.UNFOLLOW} адрес_кошелька`,
    SUCCESS: "Подписка на кошелек успешно удалена.",
  } as const

  constructor(
    private readonly walletService: WalletService,
    private readonly user: User,
    private readonly commandData: Command,
  ) {}

  async execute(): Promise<BotResponseData | null> {
    const [walletAddress] = this.commandData.params || []
    if (!walletAddress || !isAddress(walletAddress)) return new BotResponseData(this.messages.NEED_WALLET)

    try {
      await this.walletService.unfollow(walletAddress, this.user.id)
      return new BotResponseData(this.messages.SUCCESS)
    } catch (error) {
      return ErrorHandler.handleAndResponse(error)
    }
  }
}
