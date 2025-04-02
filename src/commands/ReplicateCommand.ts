import { ICommand } from "./ICommand"
import { ResponseData } from "../data/ResponseData"
import { Command } from "./CommandHandler"
import { User } from "../users/user.entity"
import { ResponseBotError } from "../errors/ResponseBotError"
import { Logger } from "../utils/Logger"
import { Commands } from "./Commands"
import { WalletService } from "../blockchain/wallet.service"

export class ReplicateCommand implements ICommand {
  private readonly walletService: WalletService
  private readonly commandData: Command
  private readonly user: User
  private readonly messages = {
    WRONG_COMMAND: `Неверные параметры команды.\nПример: ${Commands.REPLICATE} buy/sell лимит_суммы`,
    SUCCESS: "Повторные сделки подключены.",
  } as const

  constructor(walletService: WalletService, user: User, commandData: Command) {
    this.user = user
    this.walletService = walletService
    this.commandData = commandData
  }

  async execute(): Promise<ResponseData | null> {
    const command = this.commandData?.params?.[0]?.toLowerCase() || undefined
    const limit = Number(this.commandData.params?.[1]) || undefined
    if (!command || !this.isValidCommand(command) || !limit) return new ResponseData(this.messages.WRONG_COMMAND)

    try {
      await this.walletService.createReplicate(command, this.user.id, limit)
      return new ResponseData(this.messages.SUCCESS)
    } catch (error) {
      // TODO: вынести в отдельно часто повторяется
      if (error instanceof ResponseBotError) {
        return new ResponseData(error.message)
      } else {
        Logger.error(error)
        return null
      }
    }
  }

  isValidCommand(command: string): command is ReplicateDealCommand {
    return Object.values(ReplicateDealCommand).includes(command as ReplicateDealCommand)
  }
}

export enum ReplicateDealCommand {
  BUY = "buy",
  SELL = "sell",
}
