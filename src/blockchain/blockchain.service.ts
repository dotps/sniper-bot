import { Injectable } from "@nestjs/common"
import { createPublicClient, erc20Abi, Hex, http, isAddress, parseAbi, parseAbiItem, PublicClient } from "viem"
import { bscTestnet, polygon } from "viem/chains"
import { Logger } from "../services/logger/Logger"
import { ResponseBotError } from "../errors/ResponseBotError"
import { Token } from "./token.entity"
import { Swap } from "../commands/blockchain/ReplicateSwapCommand"
import { PoolToken } from "./PoolTokenPair"
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

@Injectable()
export class BlockchainService {
  // private readonly defaultBlockchain = Blockchain.BSC
  private readonly defaultBlockchain: Blockchain
  private clients: Map<Blockchain, PublicClient> = new Map()
  private swapProviders: Map<Blockchain, ISwapProvider> = new Map()
  private readonly messages = {
    WRONG_WALLET_OR_TOKEN: "Неверный адрес кошелька или токена.",
    TOKEN_ERROR: "Ошибка с адресом токена. Возможно токен не принадлежит текущей сети.",
    TOKEN_CONTRACT_ERROR: "Не удалось прочитать контракт токена.",
    BALANCE_EMPTY: "Не хватает средств на балансе.",
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

    this.swapProviders.set(Blockchain.POLYGON, new Uniswap(this))
    this.swapProviders.set(Blockchain.BSC, new Pancake(this))

    console.log(this.defaultBlockchain)
  }

  getSwapProvider(poolType: Blockchain = this.defaultBlockchain) {
    const swapProvider = this.swapProviders.get(poolType)
    if (!swapProvider) throw Error("Обменник не найден.")
    return swapProvider
  }

  getClient(clientType: Blockchain = this.defaultBlockchain): PublicClient {
    const client = this.clients.get(clientType)
    if (!client) throw Error("Клиент не найден.")
    return client
  }

  async getBalance(address: Hex) {
    return await this.getClient().getBalance({ address: address })
  }

  async getTokenBalance(walletAddress: Hex, token: Token): Promise<bigint> {
    if (!isAddress(walletAddress) || !isAddress(token.address))
      throw new ResponseBotError(this.messages.WRONG_WALLET_OR_TOKEN)

    try {
      return await this.getClient().readContract({
        address: token.address,
        abi: erc20Abi, // TODO: в настройки, еще где-то встречается
        functionName: "balanceOf",
        args: [walletAddress],
      })
    } catch (error) {
      Logger.error(error)
      throw new ResponseBotError(`${this.messages.TOKEN_ERROR}\n${token.symbol} ${token.address}`)
    }
  }

  async getTokenSymbol(address: Hex): Promise<string | null> {
    try {
      return await this.getClient().readContract({
        address: address,
        abi: erc20Abi,
        functionName: "symbol",
      })
    } catch (error) {
      Logger.error(error)
      throw new ResponseBotError(`${this.messages.TOKEN_CONTRACT_ERROR}\n ${address}`)
    }
  }

  async getTokenInfo(tokenAddress: Hex): Promise<TokenInfo> {
    try {
      const [symbol, decimals] = await Promise.all([
        this.getClient().readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "symbol",
        }),
        this.getClient().readContract({
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
    const tokenPaymentBalance = await this.getTokenBalance(swap.recipient, token)

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
      const result = await this.getClient().simulateContract({
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

  async transferToken(fromAddress: Hex, toAddress: Hex, token: Token, transferAmount: bigint): Promise<void> {
    const balance = await this.getTokenBalance(fromAddress, token)
    if (transferAmount >= balance) throw new ResponseBotError(this.messages.BALANCE_EMPTY)

    try {
      const result = await this.getClient().simulateContract({
        address: token.address,
        abi: erc20Abi,
        functionName: "transfer",
        args: [toAddress, transferAmount],
        account: fromAddress,
      })
    } catch (error) {
      throw new ResponseBotError(`Ошибка при переводе ${token.symbol}.`, error)
    }
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

export type TokenInfo = {
  symbol: string
  decimals: number
}

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
