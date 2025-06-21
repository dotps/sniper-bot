import { Hex } from "viem"

import { PoolTokenPair } from "./pool-token-pair"

export interface ISwapProvider {
  getPools(): Map<Hex, PoolTokenPair>
  init(): Promise<void>
}
