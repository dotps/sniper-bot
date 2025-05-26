import { Hex, parseAbi, parseAbiItem, PublicClient } from "viem"
import { Swap } from "../commands/blockchain/ReplicateSwapCommand"
import { PoolToken } from "./dex/PoolTokenPair"
import { User } from "../users/user.entity"
import { plainToClass } from "class-transformer"
import { Token } from "./token/token.entity"
import { absBigInt } from "../utils/Calc"
import { events, SendBotEvent } from "../events/events"
import { Logger } from "../services/logger/Logger"
import { BlockchainTokenService } from "./blockchain-token.service"
import { EventEmitter2 } from "@nestjs/event-emitter"
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
      this.eventEmitter.emit(events.SEND_BOT_RESPONSE, event) // TODO: раскомментировать после завершения работ, а то спамит о нехватке баланса
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

const poolAbi = parseAbi([
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function swap(address recipient, bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96, bytes calldata data) external returns (int256 amount0, int256 amount1)",
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
])

export const swapEventAbi = parseAbiItem(
  "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
)

export type TokenAddressPair = {
  tokenAddress0: Hex
  tokenAddress1: Hex
}
