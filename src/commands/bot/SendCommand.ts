import { ICommand } from "../infrastructure/ICommand"
import { BotResponseData } from "../../bots/infrastructure/BotResponseData"
import { Command } from "../infrastructure/BotCommandHandler"
import { User } from "../../users/user.entity"
import { Hex, isAddress, parseUnits } from "viem"
import { BotCommands } from "./BotCommands"
import { ErrorHandler } from "../../errors/ErrorHandler"
import { WalletService } from "../../blockchain/wallet/wallet.service"
import { ResponseBotError } from "../../errors/ResponseBotError"
import { Token } from "../../blockchain/token/token.entity"
import { plainToClass } from "class-transformer"
import { BlockchainTokenService } from "../../blockchain/blockchain-token.service"

export class SendCommand implements ICommand {
  private readonly messages = {
    NEED_TOKEN: `Требуется адрес токена.\n${BotCommands.SEND} адрес_токена сумма адрес_получателя`,
    NEED_TO_ADDRESS: `Требуется адрес получателя.\n${BotCommands.SEND} адрес_токена сумма адрес_получателя`,
    NEED_AMOUNT: `Требуется сумма для перевода.\n${BotCommands.SEND} адрес_токена сумма адрес_получателя`,
    SUCCESS: "Перевод на кошелек успешно проведен.",
    ERROR: "Ошибка при переводе.",
  } as const

  constructor(
    private readonly blockchainTokenService: BlockchainTokenService,
    private readonly walletService: WalletService,
    private readonly user: User,
    private readonly commandData: Command,
  ) {}

  // Формат команды /send 0x7ceb23fd6bc0add59e62ac25578270cff1b9f619 0.41 0xF6dD294C065DDE53CcA856249FB34ae67BE5C54C
  // /send адрес_токена сумма_human_readable адрес_кошелька
  async execute(): Promise<BotResponseData | null> {
    try {
      const { tokenAddress, amount, toAddress } = this.validateAndParseParams()
      const tokenInfo = await this.blockchainTokenService.getTokenInfo(tokenAddress)
      const token = plainToClass(Token, { address: tokenAddress, ...tokenInfo })

      const transferAmount = parseUnits(amount, token.decimals)
      if (!transferAmount) return new BotResponseData(this.messages.NEED_AMOUNT)

      const fromAddress = await this.walletService.getWalletAddress(this.user.id)
      await this.blockchainTokenService.transferToken(fromAddress, toAddress, token, transferAmount)

      return new BotResponseData(this.messages.SUCCESS)
    } catch (error) {
      return ErrorHandler.handleAndResponse(error)
    }
  }

  private validateAndParseParams(): SendParsedData {
    const [tokenAddress, amount, toAddress] = this.commandData.params || []

    if (!tokenAddress || !isAddress(tokenAddress)) throw new ResponseBotError(this.messages.NEED_TOKEN)
    if (!toAddress || !isAddress(toAddress)) throw new ResponseBotError(this.messages.NEED_TO_ADDRESS)
    if (!amount || isNaN(Number(amount))) throw new ResponseBotError(this.messages.NEED_AMOUNT)

    return { tokenAddress, amount, toAddress }
  }
}

type SendParsedData = {
  tokenAddress: Hex
  amount: string
  toAddress: Hex
}
