import { Injectable } from "@nestjs/common"
import { createPublicClient, erc20Abi, Hex, http, PublicClient } from "viem"
import { bsc, bscTestnet, polygon } from "viem/chains"
import { Logger } from "../utils/Logger"

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
      // chain: bscTestnet,
      chain: bsc,
      transport: http(),
    })
    const polygonClient = createPublicClient({
      chain: polygon,
      transport: http(),
    })

    this.clients.set(Blockchain.BSC, bscClient) // TODO: можно перейти на строки bscClient.chain.name, чтобы не создавать enum
    this.clients.set(Blockchain.POLYGON, polygonClient)
  }

  getClient(clientType: Blockchain = this.defaultBlockchain): PublicClient {
    const client = this.clients.get(clientType)
    if (!client) throw Error("Клиент не найден.")
    return client
  }

  async getBalance(address: Hex) {
    return await this.getClient().getBalance({ address: address })
  }

  async getTokenBalance(address: Hex): Promise<void> {
    // const tokenBalance = await this.getPublicClient().readContract({
    //   address: address,
    //   abi: [{
    //     constant: true,
    //     inputs: [{ name: "_owner", type: "address" }],
    //     name: "balanceOf",
    //     outputs: [{ name: "balance", type: "uint256" }],
    //     type: "function"
    //   }],
    //   functionName: 'balanceOf',
    //   args: [userAddress]
    // })
  }

  async getTokenSymbol(address: Hex): Promise<string | null> {
    try {
      return await this.getClient().readContract({
        address: address,
        abi: erc20Abi,
        functionName: "symbol",
      })
    } catch (error) {
      Logger.error(error)
      return null
    }
  }
}

enum Blockchain {
  BSC = "bsc",
  POLYGON = "polygon",
}

/*
Токены BSC:
Токен USDT: 0x55d398326f99059fF775485246999027B3197955
Токен BUSD: 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56
Токен CAKE: 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82
 */
