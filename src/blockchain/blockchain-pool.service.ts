import { Hex, PublicClient } from "viem"
import { Swap } from "../commands/blockchain/replicate-swap.command"
import { PoolToken } from "./dex/pool-token-pair"
import { User } from "../users/user.entity"
import { plainToClass } from "class-transformer"
import { Token } from "./token/token.entity"
import { absBigInt } from "../libs/core/utils/calc"
import { events, SendBotEvent } from "../libs/constants/events"
import { Logger } from "../libs/core/logger/logger"
import { BlockchainTokenService } from "./blockchain-token.service"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { poolAbi } from "../libs/constants/pool.abi"

export class BlockchainPoolService {
  private isSimulateSwap: boolean = false
  private readonly messages = {
    EMPTY_BALANCE: "Недостаточно средств: ",
  } as const

  constructor(
    private readonly client: PublicClient,
    private readonly blockchainTokenService: BlockchainTokenService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getTokensForPool(poolAddress: Hex): Promise<TokenAddressPair> {
    let [tokenAddress0, tokenAddress1] = await Promise.all([
      this.client.readContract({
        address: poolAddress,
        abi: poolAbi,
        functionName: "token0",
      }),
      this.client.readContract({
        address: poolAddress,
        abi: poolAbi,
        functionName: "token1",
      }),
    ])

    tokenAddress0 = tokenAddress0.toLowerCase() as Hex
    tokenAddress1 = tokenAddress1.toLowerCase() as Hex

    return { tokenAddress0, tokenAddress1 }
  }

  async executeSwap(swap: Swap, tokenForPayment: PoolToken, user: User): Promise<void> {
    const token = plainToClass(Token, tokenForPayment)
    const tokenPaymentBalance = await this.blockchainTokenService.getTokenBalance(swap.recipient, token)

    if (!tokenPaymentBalance || tokenPaymentBalance < absBigInt(swap.amountSpecified)) {
      const event: SendBotEvent = {
        user: user,
        text: this.messages.EMPTY_BALANCE + token.symbol,
      }
      this.eventEmitter.emit(events.SendBotResponse, event) // TODO: раскомментировать после завершения работ, а то спамит о нехватке баланса
      return
    }

    if (!this.isSimulateSwap) return

    try {
      await this.client.simulateContract({
        address: swap.poolAddress,
        abi: poolAbi,
        functionName: "swap",
        args: [swap.recipient, swap.zeroForOne, swap.amountSpecified, swap.sqrtPriceLimitX96, swap.data || "0x"],
        account: swap.recipient,
      })
    } catch (error) {
      Logger.error(error)
    }
  }
}

export type TokenAddressPair = {
  tokenAddress0: Hex
  tokenAddress1: Hex
}
