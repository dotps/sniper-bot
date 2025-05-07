import { Hex, parseAbi } from "viem"
import { ISwapProvider } from "./ISwapProvider"
import { PoolTokenPair } from "./PoolTokenPair"
import { BlockchainService } from "../blockchain.service"
import { Logger } from "../../services/logger/Logger"
import { BlockchainTokenService } from "../blockchain-token.service"

export class Uniswap implements ISwapProvider {
  private pools: Map<Hex, PoolTokenPair> = new Map<Hex, PoolTokenPair>()

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly blockchainTokenService: BlockchainTokenService,
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
        const { token0, token1 } = await this.blockchainService.getTokensForPool(poolAddress)
        const { symbol: symbol0 } = await this.blockchainTokenService.getTokenInfo(token0)
        const { symbol: symbol1 } = await this.blockchainTokenService.getTokenInfo(token1)
        pools.set(poolAddress, {
          token0: { symbol: symbol0, address: token0 },
          token1: { symbol: symbol1, address: token1 },
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

export const uniswapRouterAbi = parseAbi([
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
  "function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountIn)"
])
