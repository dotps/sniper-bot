import { ICommand } from "../infrastructure/command.interface"
import { BotResponseData } from "../../bots/infrastructure/bot-response-data"
import { Command } from "../infrastructure/bot-command.handler"
import { User } from "../../users/user.entity"
import { BotCommands } from "./bot-commands"
import { WalletService } from "../../blockchain/wallet/wallet.service"
import { ErrorHandler } from "../../libs/core/errors/error.handler"
import { formatUnits, Hex, isAddress, parseUnits } from "viem"
import { TokenService } from "../../blockchain/token/token.service"
import { ResponseBotError } from "../../libs/core/errors/response-bot-error"
import { Token } from "../../blockchain/token/token.entity"
import { Logger } from "../../libs/core/logger/logger"

export class ReplicateCommand implements ICommand {
  private readonly messages = {
    WRONG_COMMAND: `Неверные параметры команды.\nПример: ${BotCommands.Replicate} buy/sell адрес_токена лимит_суммы.\nПроверьте правильность команды, адреса токена и формат лимита.`,
    NOT_FOUND_TOKEN: `Токен не обнаружен в списке для торговли.\nИспользуйте команду ${BotCommands.AddToken} чтобы добавить.`,
    SUCCESS: "Повторные сделки подключены.",
    INVALID_TOKEN: "Неверный формат адреса токена.",
    INVALID_LIMIT: "Неверный формат лимита.",
  } as const
  private readonly commandIndex = 0
  private readonly addressIndex = 1
  private readonly limitIndex = 2

  constructor(
    private readonly walletService: WalletService,
    private readonly user: User,
    private readonly commandData: Command,
    private readonly tokenService: TokenService,
  ) {}

  /*
   формат команды
   /replicate buy 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619 100
   /replicate buy/sell адрес_токена лимит_суммы_human_readable
   */
  async execute(): Promise<BotResponseData | null> {
    try {
      const { command, token, limit } = await this.validateAndParseParams()
      const replicate = await this.walletService.createReplicate(command, this.user.id, limit, token)

      return new BotResponseData(
        `${this.messages.SUCCESS}\nКоманда: ${replicate.command}\nТокен: ${replicate.token.symbol}\nЛимит: ${formatUnits(replicate.limit, replicate.token.decimals)}`,
      )
    } catch (error) {
      // Logger.log(error.message)
      return ErrorHandler.handleAndResponse(error)
    }
  }

  isValidCommand(command: string): command is ReplicateDealCommand {
    return Object.values(ReplicateDealCommand).includes(command as ReplicateDealCommand)
  }

  private async validateAndParseParams(): Promise<ReplicateParsedData> {
    const params = this.commandData.params || []
    if (params.length === 0) throw new ResponseBotError(this.messages.WRONG_COMMAND)

    const command = params[this.commandIndex].toLowerCase()
    if (!this.isValidCommand(command)) throw new ResponseBotError(this.messages.WRONG_COMMAND)

    const tokenAddress = params[this.addressIndex].toLowerCase() as Hex
    if (!isAddress(tokenAddress)) throw new ResponseBotError(this.messages.INVALID_TOKEN)

    const token = await this.getUserTokenOrThrow(tokenAddress)
    let limit = 0n

    try {
      limit = parseUnits(params[this.limitIndex], token.decimals)
    } catch (error) {
      throw new ResponseBotError(this.messages.INVALID_LIMIT)
    }

    if (limit <= 0) throw new ResponseBotError(this.messages.INVALID_LIMIT)

    return { command, token, limit }
  }

  private async getUserTokenOrThrow(tokenAddress: Hex): Promise<Token> {
    const userTokens = await this.tokenService.getUserTokens(this.user.id)
    const token = userTokens.find((token) => token.address === tokenAddress)
    if (!token) throw new ResponseBotError(this.messages.NOT_FOUND_TOKEN)
    return token
  }
}

export enum ReplicateDealCommand {
  Buy = "buy",
  Sell = "sell",
}

type ReplicateParsedData = {
  command: ReplicateDealCommand
  token: Token
  limit: bigint
}
