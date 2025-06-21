import { Hex } from "viem"
import { ISwapProvider } from "./swap-provider.interface"
import { PoolTokenPair } from "./pool-token-pair"
import { Logger } from "../../services/logger/logger"
import { BlockchainTokenService } from "../blockchain-token.service"
import { BlockchainPoolService } from "../blockchain-pool.service"

export class Uniswap implements ISwapProvider {
  private pools: Map<Hex, PoolTokenPair> = new Map<Hex, PoolTokenPair>()

  constructor(
    private readonly blockchainTokenService: BlockchainTokenService,
    private readonly blockchainPoolService: BlockchainPoolService,
  ) {}

  async init(): Promise<void> {
    this.pools = await this.getPoolsInfo()
  }

  getPools(): Map<Hex, PoolTokenPair> {
    return this.pools
  }

  private async getPoolsInfo(): Promise<Map<Hex, PoolTokenPair>> {
    const pools = new Map<Hex, PoolTokenPair>()
    try {
      for (let poolAddress of poolAddresses) {
        poolAddress = poolAddress.toLowerCase() as Hex
        const { tokenAddress0, tokenAddress1 } = await this.blockchainPoolService.getTokensForPool(poolAddress)
        const [token0, token1] = await this.blockchainTokenService.getTokenInfo([tokenAddress0, tokenAddress1])
        pools.set(poolAddress, {
          tokenAddress0: { symbol: token0.symbol, address: tokenAddress0 },
          tokenAddress1: { symbol: token1.symbol, address: tokenAddress1 },
        })
      }
    } catch (error) {
      Logger.error(error)
    }

    return pools
  }
}

const poolAddresses: Hex[] = [
  "0xD36ec33c8bed5a9F7B6630855f1533455b98a418", // USDC.e/USDC
  "0xeEF1A9507B3D505f0062f2be9453981255b503c8", // WBTC/USDC.e
  "0xDaC8A8E6DBf8c690ec6815e0fF03491B2770255D", // USDC.e/USDT
  "0x50eaEDB835021E4A108B7290636d62E9765cc6d7", // WBTC/WETH
  "0x9B08288C3Be4F62bbf8d1C20Ac9C5e6f9467d8B7", // POL/USDT
  "0x45dDa9cb7c25131DF268515131f647d726f50608", // USDC.e/WETH
  "0xA4D8c89f0c20efbe54cBa9e7e7a7E509056228D9", // USDC/WETH
]
