import { ICommand } from "./infrastructure/ICommand"
import { ResponseData } from "../data/ResponseData"
import { Command } from "./infrastructure/CommandHandler"
import { User } from "../users/user.entity"
import { Commands } from "./Commands"
import { WalletService } from "../blockchain/wallet.service"
import { ErrorHandler } from "../errors/ErrorHandler"
import { Hex, isAddress } from "viem"
import { TokenService } from "../blockchain/token.service"

export class ReplicateCommand implements ICommand {
  private readonly messages = {
    WRONG_COMMAND: `Неверные параметры команды.\nПример: ${Commands.REPLICATE} buy/sell адрес_токена лимит_суммы`,
    SUCCESS: "Повторные сделки подключены.",
  } as const

  constructor(
    private readonly walletService: WalletService,
    private readonly user: User,
    private readonly commandData: Command,
    private readonly tokenService: TokenService,
  ) {}

  /*
  формат команды
   /replicate buy 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619 100
   /replicate [buy/sell] [адрес_токена] [лимит_суммы_human_readable]
   */
  async execute(): Promise<ResponseData | null> {
    const params = this.commandData.params || []
    const command = params[0].toLowerCase() || undefined
    const tokenAddress = (params[1].toLowerCase() as Hex) || undefined
    const limit = params[2] || undefined

    console.log(this.commandData.params)
    // TODO: проверка что токен есть в БД (ранее добавлен через addtoken)
    const userTokens = await this.tokenService.getUserTokens(this.user.id)
    userTokens.find((token) => token.address === tokenAddress)
    console.log(userTokens)

    // const limit = Number(this.commandData.params?.[1]) || undefined
    // const limit = this.commandData.params?.[1] || undefined
    if (!command || !this.isValidCommand(command) || !isAddress(tokenAddress) || !limit) {
      return new ResponseData(this.messages.WRONG_COMMAND)
    }

    try {
      await this.walletService.createReplicate(command, this.user.id, limit)
      return new ResponseData(this.messages.SUCCESS)
    } catch (error) {
      return ErrorHandler.handleAndResponse(error)
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
