import { ICommand } from "../infrastructure/ICommand"
import { ResponseData } from "../../data/ResponseData"
import { Command } from "../infrastructure/BotCommandHandler"
import { User } from "../../users/user.entity"
import { BotCommands } from "./BotCommands"
import { WalletService } from "../../blockchain/wallet.service"
import { ErrorHandler } from "../../errors/ErrorHandler"
import { Hex, isAddress } from "viem"
import { TokenService } from "../../blockchain/token.service"
import { ResponseBotError } from "../../errors/ResponseBotError"
import { Token } from "../../blockchain/token.entity"

export class ReplicateCommand implements ICommand {
  private readonly messages = {
    WRONG_COMMAND: `Неверные параметры команды.\nПример: ${BotCommands.REPLICATE} buy/sell адрес_токена лимит_суммы.\nПроверьте правильность команды, адреса токена и формат лимита.`,
    NOT_FOUND_TOKEN: `Токен не обнаружен в списке для торговли.\nИспользуйте команду ${BotCommands.ADD_TOKEN} чтобы добавить.`,
    SUCCESS: "Повторные сделки подключены.",
    INVALID_TOKEN: "Неверный формат адреса токена.",
    INVALID_LIMIT: "Неверный формат лимита.",
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
    try {
      const { command, token, limit } = await this.validateAndParseParams()
      const replicate = await this.walletService.createReplicate(command, this.user.id, limit, token)

      return new ResponseData(
        `${this.messages.SUCCESS}\nКоманда: ${replicate.command}\nТокен: ${replicate.token.symbol}\nЛимит: ${replicate.limit}`,
      )
    } catch (error) {
      return ErrorHandler.handleAndResponse(error)
    }
  }

  isValidCommand(command: string): command is ReplicateDealCommand {
    return Object.values(ReplicateDealCommand).includes(command as ReplicateDealCommand)
  }

  private async validateAndParseParams(): Promise<ReplicateParsedData> {
    const params = this.commandData.params || []

    const command = params[0].toLowerCase()
    if (!this.isValidCommand(command)) throw new ResponseBotError(this.messages.WRONG_COMMAND)

    const tokenAddress = params[1].toLowerCase() as Hex
    if (!isAddress(tokenAddress)) throw new ResponseBotError(this.messages.INVALID_TOKEN)

    const token = await this.getUserTokenOrThrow(tokenAddress)

    // TODO: конвертацию лимита из human в bigint + валидация
    // const transferAmount = parseUnits(amount, token.decimals)
    const limit = BigInt(params[2])
    if (limit <= 0) throw new ResponseBotError(this.messages.INVALID_LIMIT)

    return { command, token, limit }
  }

  private async getUserTokenOrThrow(tokenAddress: Hex) {
    const userTokens = await this.tokenService.getUserTokens(this.user.id)
    const token = userTokens.find((token) => token.address === tokenAddress)
    if (!token) throw new ResponseBotError(this.messages.NOT_FOUND_TOKEN)
    return token
  }
}

export enum ReplicateDealCommand {
  BUY = "buy",
  SELL = "sell",
}

type ReplicateParsedData = {
  command: ReplicateDealCommand
  token: Token
  limit: bigint
}
