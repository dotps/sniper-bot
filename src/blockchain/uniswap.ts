import { Hex, PublicClient } from "viem"

export class Uniswap {
  private pools: Hex[] = []

  constructor(private readonly client: PublicClient) {
    this.init().catch((error) => {
      console.log(error)
    })
  }

  async init() {
    this.pools = await this.getCachedPools()
  }

  getPools(): Hex[] {
    return this.pools
  }

  // для простоты просто список пулов polygon на uniswap
  async getCachedPools(): Promise<Hex[]> {
    return [
      "0xD36ec33c8bed5a9F7B6630855f1533455b98a418", // USDC.e/USDC
      "0xeEF1A9507B3D505f0062f2be9453981255b503c8", // WBTC/USDC.e
      "0xDaC8A8E6DBf8c690ec6815e0fF03491B2770255D", // USDC.e/USDT
      "0x50eaEDB835021E4A108B7290636d62E9765cc6d7", // WBTC/WETH
      "0x9B08288C3Be4F62bbf8d1C20Ac9C5e6f9467d8B7", // POL/USDT
      "0x45dDa9cb7c25131DF268515131f647d726f50608", // USDC.e/WETH
      "0xA4D8c89f0c20efbe54cBa9e7e7a7E509056228D9", // USDC/WETH
    ]
  }
}
