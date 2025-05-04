import { Hex } from "viem"
import { ISwapProvider } from "../../blockchain/ISwapProvider"
import { PoolTokenPair } from "../../blockchain/PoolTokenPair"
import { BlockchainService } from "../../blockchain/blockchain.service"

export class Pancake implements ISwapProvider {
  constructor(private readonly blockchainService: BlockchainService) {}

  getPools(): Map<Hex, PoolTokenPair> {
    throw new Error("Не реализовано.")
  }

  async init(): Promise<void> {
    throw new Error("Не реализовано.")
  }
}
