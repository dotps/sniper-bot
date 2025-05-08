import { Injectable } from "@nestjs/common"
import { createPublicClient, Hex, http, PublicClient } from "viem"
import { bscTestnet, polygon } from "viem/chains"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { ConfigService } from "@nestjs/config"
import { Config } from "../config/config"
import { ISwapProvider } from "./dex/ISwapProvider"
import { Uniswap } from "./dex/Uniswap"
import { Pancake } from "./dex/Pancake"
import { BlockchainTokenService } from "./blockchain-token.service"
import { BlockchainPoolService } from "./blockchain-pool.service"

@Injectable()
export class BlockchainService {
  private readonly blockchainTokenService: BlockchainTokenService
  private readonly blockchainPoolService: BlockchainPoolService
  private readonly defaultBlockchain: Blockchain
  private clients: Map<Blockchain, PublicClient> = new Map()
  private swapProviders: Map<Blockchain, ISwapProvider> = new Map()
  private readonly messages = {
    CLIENT_NOT_FOUND: "Клиент не найден.",
    SWAP_PROVIDER_NOT_FOUND: "Обменник не найден.",
  } as const

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    const blockchain = this.configService.get<string>(Config.BLOCKCHAIN)
    this.defaultBlockchain = Object.values(Blockchain).includes(blockchain as Blockchain)
      ? (blockchain as Blockchain)
      : Blockchain.POLYGON

    this.initBlockchainClients()

    this.blockchainTokenService = new BlockchainTokenService(this.getClient())
    this.blockchainPoolService = new BlockchainPoolService(this.getClient(), this.blockchainTokenService, eventEmitter)

    this.initSwapProviders()
  }

  private initBlockchainClients(): void {
    const bscClient = createPublicClient({
      chain: bscTestnet,
      transport: http(),
    })
    const polygonClient = createPublicClient({
      chain: polygon,
      transport: http(),
    })

    this.clients.set(Blockchain.POLYGON, polygonClient)
    this.clients.set(Blockchain.BSC, bscClient)

    console.log(this.defaultBlockchain)
  }

  private initSwapProviders(): void {
    this.swapProviders.set(Blockchain.POLYGON, new Uniswap(this.blockchainTokenService, this.blockchainPoolService))
    this.swapProviders.set(Blockchain.BSC, new Pancake())
  }

  getSwapProvider(poolType: Blockchain = this.defaultBlockchain): ISwapProvider {
    const swapProvider = this.swapProviders.get(poolType)
    if (!swapProvider) throw Error(this.messages.SWAP_PROVIDER_NOT_FOUND)
    return swapProvider
  }

  getClient(clientType: Blockchain = this.defaultBlockchain): PublicClient {
    const client = this.clients.get(clientType)
    if (!client) throw Error(this.messages.CLIENT_NOT_FOUND)
    return client
  }

  async getBalance(address: Hex): Promise<bigint> {
    return await this.getClient().getBalance({ address: address })
  }

  getTokenService(): BlockchainTokenService {
    return this.blockchainTokenService
  }

  getPoolService(): BlockchainPoolService {
    return this.blockchainPoolService
  }
}

enum Blockchain {
  BSC = "bsc",
  POLYGON = "polygon",
}

/*
0xd0567bb38fa5bad45150026281c43fa6031577b9 - часто идут транзакции
0xF6dD294C065DDE53CcA856249FB34ae67BE5C54C - мой кошелек

Популярные адреса polygon uniswap
0xe592427a0aece92de3edee1f18e0157c05861564
0x802b65b5d9016621e66003aed0b16615093f328b
0x7f20a7a526d1bab092e3be0733d96287e93cef59
0x85cd07ea01423b1e937929b44e4ad8c40bbb5e71

токены
0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359
0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619

 */
