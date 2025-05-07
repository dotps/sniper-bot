import { Hex } from "viem"

import { PoolTokenPair } from "../PoolTokenPair"

export interface ISwapProvider {
  getPools(): Map<Hex, PoolTokenPair>
  init(): Promise<void>
}
