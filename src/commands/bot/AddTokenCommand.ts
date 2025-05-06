import { ICommand } from "../infrastructure/ICommand"
import { ResponseData } from "../../data/ResponseData"
import { Command } from "../infrastructure/BotCommandHandler"
import { User } from "../../users/user.entity"
import { TokenService } from "../../blockchain/token.service"
import { TokenDto } from "../../blockchain/token.dto"
import { Hex, isAddress } from "viem"
import { ResponseBotError } from "../../errors/ResponseBotError"
import { Logger } from "../../utils/Logger"
import { BotCommands } from "./BotCommands"
import { BlockchainService } from "../../blockchain/blockchain.service"

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

  async execute(): Promise<ResponseData | null> {
    const response: string[] = []

    const [tokenAddress] = this.commandData.params || []
    console.log(tokenAddress)
    if (!tokenAddress || !isAddress(tokenAddress)) return new ResponseData(this.messages.NEED_TOKEN)

    try {
      // const tokenSymbol = await this.blockchainService.getTokenSymbol(tokenAddress)
      // if (!tokenSymbol) return new ResponseData(this.messages.WRONG_TOKEN)
      // TODO: обработка ошибки если не может достать decimals или symbol и отправка сообщения в бота
      // например 0xe592427a0aece92de3edee1f18e0157c05861564 или 0xd0567bb38fa5bad45150026281c43fa6031577b9 - разные ошибки
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
      if (error instanceof ResponseBotError) response.push(error.message)
      else Logger.error(error)
    }
    return new ResponseData(response)
  }
}
