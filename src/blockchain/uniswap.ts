import { Hex, parseAbi, PublicClient } from "viem"

export class Uniswap {
  private pools: Map<Hex, PoolTokenPair> = new Map<Hex, PoolTokenPair>()

  constructor(private readonly client: PublicClient) {}

  static async create(client: PublicClient): Promise<Uniswap> {
    const instance = new Uniswap(client)
    await instance.init()
    return instance
  }

  async init() {
    this.pools = await this.getPoolsInfo()
  }

  getPools(): Map<Hex, PoolTokenPair> {
    return this.pools
  }

  async getPoolsInfo(): Promise<Map<Hex, PoolTokenPair>> {
    const pools = new Map<Hex, PoolTokenPair>()
    for (const poolAddress of poolAddresses) {
      const { token0, token1 } = await this.getTokensForPool(poolAddress)
      const { symbol: symbol0 } = await this.getTokenInfo(token0)
      const { symbol: symbol1 } = await this.getTokenInfo(token1)
      pools.set(poolAddress, {
        token0: { symbol: symbol0, address: token0 },
        token1: { symbol: symbol1, address: token1 },
      })
    }
    return pools
  }

  async getTokensForPool(poolAddress: Hex) {
    const [token0, token1] = await Promise.all([
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

    return { token0, token1 }
  }

  async getTokenInfo(tokenAddress: Hex) {
    const [symbol, decimals] = await Promise.all([
      this.client.readContract({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: "symbol",
      }),
      this.client.readContract({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: "decimals",
      }),
    ])
    return { symbol, decimals }
  }
}

interface PoolTokenPair {
  token0: {
    address: string
    symbol: string
  }
  token1: {
    address: string
    symbol: string
  }
}

const tokenAbi = parseAbi(["function symbol() view returns (string)", "function decimals() view returns (uint8)"])
const poolAbi = parseAbi(["function token0() view returns (address)", "function token1() view returns (address)"])

const poolAddresses: Hex[] = [
  "0xD36ec33c8bed5a9F7B6630855f1533455b98a418", // USDC.e/USDC
  "0xeEF1A9507B3D505f0062f2be9453981255b503c8", // WBTC/USDC.e
  "0xDaC8A8E6DBf8c690ec6815e0fF03491B2770255D", // USDC.e/USDT
  "0x50eaEDB835021E4A108B7290636d62E9765cc6d7", // WBTC/WETH
  "0x9B08288C3Be4F62bbf8d1C20Ac9C5e6f9467d8B7", // POL/USDT
  "0x45dDa9cb7c25131DF268515131f647d726f50608", // USDC.e/WETH
  "0xA4D8c89f0c20efbe54cBa9e7e7a7E509056228D9", // USDC/WETH
]
