import { ICommand } from "../infrastructure/command.interface"
import { BotResponseData } from "../../bots/infrastructure/bot-response-data"
import { Command } from "../infrastructure/bot-command.handler"
import { User } from "../../users/user.entity"
import { TokenService } from "../../blockchain/token/token.service"
import { TokenDto } from "../../blockchain/token/token.dto"
import { Hex, isAddress } from "viem"
import { BotCommands } from "./bot-commands"
import { ErrorHandler } from "../../errors/error.handler"
import { BlockchainTokenService } from "../../blockchain/blockchain-token.service"

export class AddTokenCommand implements ICommand {
  private readonly messages = {
    TOKEN_LIST: "Список токенов:\n",
    ADDED: "Токен успешно добавлен.",
    NEED_TOKEN: "Укажите токен. " + BotCommands.AddToken + " адрес_токена",
    WRONG_TOKEN: "Токен не валиден для текущей сети.",
  } as const

  constructor(
    private readonly tokenService: TokenService,
    private readonly blockchainTokenService: BlockchainTokenService,
    private readonly user: User,
    private readonly commandData: Command,
  ) {}

  async execute(): Promise<BotResponseData | null> {
    const response: string[] = []

    const [tokenAddress] = this.commandData.params || []
    if (!tokenAddress || !isAddress(tokenAddress)) return new BotResponseData(this.messages.NEED_TOKEN)

    try {
      const tokenInfo = await this.blockchainTokenService.getTokenInfo(tokenAddress)
      const tokenDto: TokenDto = {
        balance: 0n,
        address: tokenAddress.toLowerCase() as Hex,
        decimals: tokenInfo.decimals,
        userId: this.user.id,
        symbol: tokenInfo.symbol,
      }

      await this.tokenService.addToken(tokenDto)
      const tokens = await this.tokenService.getUserTokens(this.user.id)
      const addresses = tokens.map((token) => `${token.symbol} ${token.address}`).join("\n")

      response.push(this.messages.ADDED)
      response.push(this.messages.TOKEN_LIST + addresses)
    } catch (error) {
      // Logger.log(error.message)
      return ErrorHandler.handleAndResponse(error)
    }
    return new BotResponseData(response)
  }
}
