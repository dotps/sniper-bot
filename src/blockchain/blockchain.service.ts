import { Injectable } from "@nestjs/common"
import { createPublicClient, http, PublicClient } from "viem"
import { mainnet } from "viem/chains"

@Injectable()
export class BlockchainService {
  private client: PublicClient

  constructor() {
    this.client = createPublicClient({
      chain: mainnet,
      transport: http(),
    })
  }
}
