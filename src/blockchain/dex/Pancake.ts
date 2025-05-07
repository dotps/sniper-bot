import { Hex } from "viem"
import { ISwapProvider } from "./ISwapProvider"
import { PoolTokenPair } from "../PoolTokenPair"
import { BlockchainService } from "../blockchain.service"

export class Pancake implements ISwapProvider {
  constructor(private readonly blockchainService: BlockchainService) {}

  getPools(): Map<Hex, PoolTokenPair> {
    console.log("Pancake - не реализовано.")
    throw new Error("Pancake - не реализовано.")
  }

  async init(): Promise<void> {
    console.log("Pancake - не реализовано.")
  }
}
