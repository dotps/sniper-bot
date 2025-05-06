import { Hex } from "viem"

import { PoolTokenPair } from "../../blockchain/PoolTokenPair"

export interface ISwapProvider {
  getPools(): Map<Hex, PoolTokenPair>
  init(): Promise<void>
}
