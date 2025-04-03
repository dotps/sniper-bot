import { ICommand } from "./infrastructure/ICommand"
import { ResponseData } from "../data/ResponseData"
import { Command } from "./infrastructure/CommandHandler"
import { User } from "../users/user.entity"
import { TokenService } from "../blockchain/token.service"
import { TokenDto } from "../blockchain/token.dto"
import { isAddress } from "viem"
import { ResponseBotError } from "../errors/ResponseBotError"
import { Logger } from "../utils/Logger"
import { Commands } from "./Commands"
import { BlockchainService } from "../blockchain/blockchain.service"

export class AddTokenCommand implements ICommand {
  private readonly messages = {
    TOKEN_LIST: "Список токенов:\n",
    ADDED: "Токен успешно добавлен.",
    NEED_TOKEN: "Укажите токен. " + Commands.ADD_TOKEN + " адрес_токена",
    WRONG_TOKEN: "Токен не валиден для текущей сети.",
  } as const

  constructor(
    private readonly tokenService: TokenService,
    private readonly blockchainService: BlockchainService,
    private readonly user: User,
    private readonly commandData: Command,
  ) {}

  async execute(): Promise<ResponseData | null> {
    const response: string[] = []

    const [tokenAddress] = this.commandData.params || []
    if (!tokenAddress || !isAddress(tokenAddress)) return new ResponseData(this.messages.NEED_TOKEN)

    try {
      const tokenSymbol = await this.blockchainService.getTokenSymbol(tokenAddress)
      if (!tokenSymbol) return new ResponseData(this.messages.WRONG_TOKEN)

      const tokenDto: TokenDto = {
        balance: 0,
        address: tokenAddress,
        userId: this.user.id,
        symbol: tokenSymbol,
      }

      await this.tokenService.addToken(tokenDto)
      const tokens = await this.tokenService.getUserTokens(this.user.id)
      const addresses = tokens.map((token) => `${token.symbol} ${token.address}`).join("\n")

      response.push(this.messages.ADDED)
      response.push(this.messages.TOKEN_LIST + addresses)
    } catch (error) {
      if (error instanceof ResponseBotError) response.push(error.message)
      else Logger.error(error)
    }
    return new ResponseData(response)
  }
}
