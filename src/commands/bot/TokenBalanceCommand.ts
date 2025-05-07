import { ICommand } from "../infrastructure/ICommand"
import { BotResponseData } from "../../bots/infrastructure/BotResponseData"
import { User } from "../../users/user.entity"
import { TokenService } from "../../blockchain/token/token.service"
import { BlockchainService } from "../../blockchain/blockchain.service"
import { WalletService } from "../../blockchain/wallet/wallet.service"
import { ErrorHandler } from "../../errors/ErrorHandler"

export class TokenBalanceCommand implements ICommand {
  private readonly messages = {
    TOKEN_NOT_FOUND: "Токены не найдены.",
    CURRENT_BALANCE: "Текущий баланс:\n",
    BASE_COIN: "BASE COIN: ",
  } as const

  constructor(
    private readonly tokenService: TokenService,
    private readonly blockchainService: BlockchainService,
    private readonly walletService: WalletService,
    private readonly user: User,
  ) {}

  async execute(): Promise<BotResponseData | null> {
    const response: string[] = []

    try {
      const tokens = await this.tokenService.getUserTokens(this.user.id)
      if (tokens.length === 0) return new BotResponseData(this.messages.TOKEN_NOT_FOUND)

      const walletAddress = await this.walletService.getWalletAddress(this.user.id)

      let balanceMessage = ""
      for (const token of tokens) {
        const balance = await this.blockchainService.getTokenBalance(walletAddress, token)
        balanceMessage += `${token.symbol} ${token.address}: ${balance}\n`
      }

      const balance = await this.blockchainService.getBalance(walletAddress)
      balanceMessage += `${this.messages.BASE_COIN} ${balance}\n`

      response.push(this.messages.CURRENT_BALANCE + balanceMessage)
    } catch (error) {
      return ErrorHandler.handleAndResponse(error)
    }
    return new BotResponseData(response)
  }
}
