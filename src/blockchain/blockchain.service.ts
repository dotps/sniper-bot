import { Injectable } from "@nestjs/common"
import { createPublicClient, http, PublicClient } from "viem"
import { bsc, polygon } from "viem/chains"

@Injectable()
export class BlockchainService {
  private readonly client: PublicClient
  private readonly defaultBlockchain = Blockchain.BSC
  private clients: Map<Blockchain, PublicClient> = new Map()

  constructor() {
    this.initBlockchainClients()
  }

  private initBlockchainClients() {
    const bscClient = createPublicClient({
      chain: bsc,
      transport: http(),
    })
    const polygonClient = createPublicClient({
      chain: polygon,
      transport: http(),
    })

    this.clients.set(Blockchain.BSC, bscClient)
    this.clients.set(Blockchain.POLYGON, polygonClient)
  }

  getPublicClient(clientType: Blockchain = this.defaultBlockchain): PublicClient {
    const client = this.clients.get(clientType)
    if (!client) throw Error("Клиент не найден.")
    return client
  }
}

enum Blockchain {
  BSC = "bsc",
  POLYGON = "polygon",
}
