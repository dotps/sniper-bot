import { ICommand } from "./infrastructure/ICommand"
import { ResponseData } from "../data/ResponseData"
import { User } from "../users/user.entity"
import { TokenService } from "../blockchain/token.service"
import { ResponseBotError } from "../errors/ResponseBotError"
import { Logger } from "../utils/Logger"
import { BlockchainService } from "../blockchain/blockchain.service"
import { WalletService } from "../blockchain/wallet.service"

export class TokenBalanceCommand implements ICommand {
  private readonly messages = {
    TOKEN_NOT_FOUND: "Токены не найдены.",
    CURRENT_BALANCE: "Текущий баланс:\n",
  } as const

  constructor(
    private readonly tokenService: TokenService,
    private readonly blockchainService: BlockchainService,
    private readonly walletService: WalletService,
    private readonly user: User,
  ) {}

  async execute(): Promise<ResponseData | null> {
    const response: string[] = []

    try {
      const tokens = await this.tokenService.getUserTokens(this.user.id)
      if (tokens.length === 0) return new ResponseData(this.messages.TOKEN_NOT_FOUND)

      const walletAddress = await this.walletService.getWalletAddress(this.user.id)

      let balanceMessage = ""
      for (const token of tokens) {
        const balance = await this.blockchainService.getTokenBalance(walletAddress, token)
        balanceMessage += `${token.symbol} ${token.address}: ${balance}\n`
      }

      response.push(this.messages.CURRENT_BALANCE + balanceMessage)
    } catch (error) {
      if (error instanceof ResponseBotError) response.push(error.message)
      else Logger.error(error)
    }
    return new ResponseData(response)
  }
}
