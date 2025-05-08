import { erc20Abi, Hex, isAddress, PublicClient } from "viem"
import { Token } from "./token/token.entity"
import { ResponseBotError } from "../errors/ResponseBotError"
import { Logger } from "../services/logger/Logger"

export class BlockchainTokenService {
  private readonly messages = {
    WRONG_WALLET_OR_TOKEN: "Неверный адрес кошелька или токена.",
    TOKEN_ERROR: "Ошибка с адресом токена. Возможно токен не принадлежит текущей сети.",
    TOKEN_CONTRACT_ERROR: "Не удалось прочитать контракт токена.",
    BALANCE_EMPTY: "Не хватает средств на балансе.",
    TRANSFER_ERROR: "Ошибка при переводе ",
  } as const

  constructor(private readonly client: PublicClient) {}

  async getTokenBalance(walletAddress: Hex, token: Token): Promise<bigint> {
    if (!isAddress(walletAddress) || !isAddress(token.address))
      throw new ResponseBotError(this.messages.WRONG_WALLET_OR_TOKEN)

    try {
      return await this.client.readContract({
        address: token.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [walletAddress],
      })
    } catch (error) {
      Logger.error(error)
      throw new ResponseBotError(`${this.messages.TOKEN_ERROR}\n${token.symbol} ${token.address}`)
    }
  }

  async getTokenInfo(tokenAddress: Hex): Promise<TokenInfo> {
    try {
      const [symbol, decimals] = await Promise.all([
        this.client.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "symbol",
        }),
        this.client.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "decimals",
        }),
      ])

      return { symbol, decimals }
    } catch (error) {
      Logger.error(error)
      throw new ResponseBotError(`${this.messages.TOKEN_CONTRACT_ERROR}\n ${tokenAddress}`)
    }
  }

  async transferToken(fromAddress: Hex, toAddress: Hex, token: Token, transferAmount: bigint): Promise<void> {
    const balance = await this.getTokenBalance(fromAddress, token)
    if (transferAmount >= balance) throw new ResponseBotError(this.messages.BALANCE_EMPTY)

    try {
      await this.client.simulateContract({
        address: token.address,
        abi: erc20Abi,
        functionName: "transfer",
        args: [toAddress, transferAmount],
        account: fromAddress,
      })
    } catch (error) {
      throw new ResponseBotError(this.messages.TRANSFER_ERROR + token.symbol, error)
    }
  }
}

export type TokenInfo = {
  symbol: string
  decimals: number
}
