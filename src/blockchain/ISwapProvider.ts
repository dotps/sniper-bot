import { Hex } from "viem"

import { IPoolTokenPair } from "./IPoolTokenPair"

export interface ISwapProvider {
  getPools(): Map<Hex, IPoolTokenPair>
  init(): Promise<void>
}
