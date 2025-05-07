import { Injectable } from "@nestjs/common"
import { createPublicClient, Hex, http, parseAbi, parseAbiItem, PublicClient } from "viem"
import { bscTestnet, polygon } from "viem/chains"
import { Logger } from "../services/logger/Logger"
import { Token } from "./token/token.entity"
import { Swap } from "../commands/blockchain/ReplicateSwapCommand"
import { PoolToken } from "./dex/PoolTokenPair"
import { plainToClass } from "class-transformer"
import { absBigInt } from "../utils/Calc"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { events, SendBotEvent } from "../events/events"
import { User } from "../users/user.entity"
import { ConfigService } from "@nestjs/config"
import { Config } from "../config/config"
import { ISwapProvider } from "./dex/ISwapProvider"
import { Uniswap } from "./dex/Uniswap"
import { Pancake } from "./dex/Pancake"
import { BlockchainTokenService } from "./blockchain-token.service"

@Injectable()
export class BlockchainService {
  private readonly blockchainTokenService: BlockchainTokenService
  private readonly defaultBlockchain: Blockchain
  private clients: Map<Blockchain, PublicClient> = new Map()
  private swapProviders: Map<Blockchain, ISwapProvider> = new Map()
  private readonly messages = {
    CLIENT_NOT_FOUND: "Клиент не найден.",
    SWAP_PROVIDER_NOT_FOUND: "Обменник не найден.",
  } as const
  private isSimulateSwap: boolean = false

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    const blockchain = this.configService.get<string>(Config.BLOCKCHAIN)
    this.defaultBlockchain = Object.values(Blockchain).includes(blockchain as Blockchain)
      ? (blockchain as Blockchain)
      : Blockchain.POLYGON
    this.initBlockchainClients()
    this.blockchainTokenService = new BlockchainTokenService(this.getClient())
  }

  private initBlockchainClients() {
    const bscClient = createPublicClient({
      chain: bscTestnet,
      transport: http(),
    })
    const polygonClient = createPublicClient({
      chain: polygon,
      transport: http(),
    })

    this.clients.set(Blockchain.POLYGON, polygonClient)
    this.clients.set(Blockchain.BSC, bscClient)

    this.swapProviders.set(Blockchain.POLYGON, new Uniswap(this, this.blockchainTokenService))
    this.swapProviders.set(Blockchain.BSC, new Pancake())

    console.log(this.defaultBlockchain)
  }

  getSwapProvider(poolType: Blockchain = this.defaultBlockchain) {
    const swapProvider = this.swapProviders.get(poolType)
    if (!swapProvider) throw Error(this.messages.SWAP_PROVIDER_NOT_FOUND)
    return swapProvider
  }

  getClient(clientType: Blockchain = this.defaultBlockchain): PublicClient {
    const client = this.clients.get(clientType)
    if (!client) throw Error(this.messages.CLIENT_NOT_FOUND)
    return client
  }

  async getBalance(address: Hex) {
    return await this.getClient().getBalance({ address: address })
  }

  // TODO: добавить типы
  async getTokensForPool(poolAddress: Hex) {
    let [token0, token1] = await Promise.all([
      this.getClient().readContract({
        address: poolAddress,
        abi: poolAbi,
        functionName: "token0",
      }),
      this.getClient().readContract({
        address: poolAddress,
        abi: poolAbi,
        functionName: "token1",
      }),
    ])

    token0 = token0.toLowerCase() as Hex
    token1 = token1.toLowerCase() as Hex

    return { token0, token1 }
  }

  async executeSwap(swap: Swap, tokenForPayment: PoolToken, user: User): Promise<void> {
    const token = plainToClass(Token, tokenForPayment)
    const tokenPaymentBalance = await this.blockchainTokenService.getTokenBalance(swap.recipient, token)

    if (!tokenPaymentBalance || tokenPaymentBalance < absBigInt(swap.amountSpecified)) {
      const event: SendBotEvent = {
        user: user,
        text: `Недостаточно средств: ${token.symbol}`,
      }
      this.eventEmitter.emit(events.SEND_BOT_RESPONSE, event)
      return
    }

    if (!this.isSimulateSwap) return

    try {
      await this.getClient().simulateContract({
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

  getTokenService(): BlockchainTokenService {
    return this.blockchainTokenService
  }
}

enum Blockchain {
  BSC = "bsc",
  POLYGON = "polygon",
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
/*
export type TokenInfo = {
  symbol: string
  decimals: number
}*/

/*
0xd0567bb38fa5bad45150026281c43fa6031577b9 - часто идут транзакции
0xF6dD294C065DDE53CcA856249FB34ae67BE5C54C - мой кошелек

Популярные адреса polygon uniswap
0xe592427a0aece92de3edee1f18e0157c05861564
0x802b65b5d9016621e66003aed0b16615093f328b
0x7f20a7a526d1bab092e3be0733d96287e93cef59
0x85cd07ea01423b1e937929b44e4ad8c40bbb5e71

токены
0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359
0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619

 */
