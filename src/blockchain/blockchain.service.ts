import { Injectable } from "@nestjs/common"
import {
  createPublicClient,
  erc20Abi,
  Hex,
  http,
  isAddress,
  parseAbi,
  parseAbiItem,
  PublicClient,
  SimulateContractParameters,
} from "viem"
import { bscTestnet, polygon, polygonMumbai } from "viem/chains"
import { Logger } from "../utils/Logger"
import { ResponseBotError } from "../errors/ResponseBotError"
import { Token } from "./token.entity"
import { SwapParams } from "../commands/ReplicateSwapCommand"

@Injectable()
export class BlockchainService {
  // private readonly defaultBlockchain = Blockchain.BSC
  private readonly defaultBlockchain = Blockchain.POLYGON
  private clients: Map<Blockchain, PublicClient> = new Map()
  private readonly messages = {
    WRONG_WALLET_OR_TOKEN: "Неверный адрес кошелька или токена.",
    TOKEN_ERROR: "Ошибка с адресом токена. Возможно токен не принадлежит текущей сети.",
  } as const

  constructor() {
    this.initBlockchainClients()
  }

  private initBlockchainClients() {
    const bscClient = createPublicClient({
      chain: bscTestnet,
      // chain: bsc,
      transport: http(),
    })
    const polygonClient = createPublicClient({
      chain: polygon,
      // chain: polygonMumbai,
      transport: http(),
    })

    this.clients.set(Blockchain.BSC, bscClient) // TODO: можно перейти на строки bscClient.chain.name, чтобы не создавать enum
    this.clients.set(Blockchain.POLYGON, polygonClient)
    console.log(this.defaultBlockchain)
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
      return null
    }
  }

  async getTokenInfo(tokenAddress: Hex) {
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
  }

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

  async executeSwap(swapParams: SwapParams) {
    console.log(swapParams)
    console.log(">>>>> имитация обмена произведена <<<<<<<")

      // TODO: проверить наличие токенов в кошельке

    // TODO: вернуть результат?

    return

    // TODO: при симуляции контракта возникает неизвестная ошибка, скорее всего из-за отсутствия средств на кошельке
    try {
      const priceSlippagePercent = swapParams.zeroForOne
        ? 0.99 // снижение на 1%
        : 1.01 // рост на 1%

      const sqrtPriceLimitX96 = swapParams.zeroForOne
        ? BigInt(Math.floor(Number(swapParams.sqrtPriceLimitX96) * priceSlippagePercent)) // допустимое снижение цены
        : BigInt(Math.ceil(Number(swapParams.sqrtPriceLimitX96) * priceSlippagePercent)) // допустимый рост цены


      const result = await this.getClient().simulateContract({
        address: swapParams.poolAddress,
        abi: poolAbi,
        functionName: "swap",
        args: [
          swapParams.recipient,
          swapParams.zeroForOne,
          swapParams.amountSpecified,
          sqrtPriceLimitX96,
          swapParams.data || "0x",
        ],
        account: swapParams.recipient,
      })
    } catch (error) {
      Logger.error(error)
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

/*
Токены BSC TestNet:
Токен USDT: 0x337610d27c682E347C9cD60BD4b3b107C9d34dDd
Токен BUSD: 0x8301F2213c0eeD49a7E28Ae4c3e91722919B8B47
Токен CAKE: 0x8d008B313C1d6C7fE2982F62d32Da7507cF43551

0xd0567bb38fa5bad45150026281c43fa6031577b9 - часто идут транзакции

0xF6dD294C065DDE53CcA856249FB34ae67BE5C54C - мой кошелек

0x22579CA45eE22E2E16dDF72D955D6cf4c767B0eF - кошелек (кран) с celo

Популярные адреса polygon uniswap
0xe592427a0aece92de3edee1f18e0157c05861564
0x802b65b5d9016621e66003aed0b16615093f328b
0x7f20a7a526d1bab092e3be0733d96287e93cef59
0x85cd07ea01423b1e937929b44e4ad8c40bbb5e71

====================
Токены BSC:
Токен USDT: 0x55d398326f99059fF775485246999027B3197955
Токен BUSD: 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56
Токен CAKE: 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82
 */

/*
TODO:
 Автоматическое повторение сделок
 Оповещение при недостатке баланса
 Перевод токенов (подключить блокчейн)
 */

// TODO: попробовать через pancake
// const pancakeSwapRouterAddress: Hex = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1" // для BSC Testnet
// export const pancakeSwapRouter = {
//   address: pancakeSwapRouterAddress,
//   abi: pancakeRouterV2Abi,
// }
