import { ICommand } from "../infrastructure/ICommand"
import { BotResponseData } from "../../bots/infrastructure/BotResponseData"
import { Command } from "../infrastructure/BotCommandHandler"
import { User } from "../../users/user.entity"
import { TokenService } from "../../blockchain/token/token.service"
import { TokenDto } from "../../blockchain/token/token.dto"
import { Hex, isAddress } from "viem"
import { BotCommands } from "./BotCommands"
import { BlockchainService } from "../../blockchain/blockchain.service"
import { ErrorHandler } from "../../errors/ErrorHandler"

export class AddTokenCommand implements ICommand {
  private readonly messages = {
    TOKEN_LIST: "Список токенов:\n",
    ADDED: "Токен успешно добавлен.",
    NEED_TOKEN: "Укажите токен. " + BotCommands.ADD_TOKEN + " адрес_токена",
    WRONG_TOKEN: "Токен не валиден для текущей сети.",
  } as const

  constructor(
    private readonly tokenService: TokenService,
    private readonly blockchainService: BlockchainService,
    private readonly user: User,
    private readonly commandData: Command,
  ) {}

  async execute(): Promise<BotResponseData | null> {
    const response: string[] = []

    const [tokenAddress] = this.commandData.params || []
    if (!tokenAddress || !isAddress(tokenAddress)) return new BotResponseData(this.messages.NEED_TOKEN)

    try {
      const tokenInfo = await this.blockchainService.getTokenInfo(tokenAddress)

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
      return ErrorHandler.handleAndResponse(error)
    }
    return new BotResponseData(response)
  }
}
