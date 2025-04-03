import { Injectable } from "@nestjs/common"
import { createPublicClient, erc20Abi, Hex, http, isAddress, PublicClient } from "viem"
import { bsc, bscTestnet, polygon } from "viem/chains"
import { Logger } from "../utils/Logger"
import { ResponseBotError } from "../errors/ResponseBotError"
import { Token } from "./token.entity"

@Injectable()
export class BlockchainService {
  private readonly client: PublicClient
  private readonly defaultBlockchain = Blockchain.BSC
  private clients: Map<Blockchain, PublicClient> = new Map()
  private readonly messages = {
    WRONG_WALLET_OR_TOKEN: "Неверный адрес кошелька или токена.",
    TOKEN_ERROR: "Ошибка с адресом токена. Возможно токен не принадлежит текущей сети.",
  } as const

  constructor() {
    this.initBlockchainClients()
  }

  private initBlockchainClients() {
    const bscClient = createPublicClient({
      chain: bscTestnet,
      // chain: bsc,
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

  async getTokenBalance(walletAddress: Hex, token: Token): Promise<bigint> {
    if (!isAddress(walletAddress) || !isAddress(token.address))
      throw new ResponseBotError(this.messages.WRONG_WALLET_OR_TOKEN)

    try {
      return await this.getClient().readContract({
        address: token.address,
        abi: erc20Abi, // TODO: в настройки, еще где-то встречается
        functionName: "balanceOf",
        args: [walletAddress],
      })
    } catch (error) {
      Logger.error(error)
      throw new ResponseBotError(`${this.messages.TOKEN_ERROR}\n${token.symbol} ${token.address}`)
    }
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
Токены BSC TestNet:
Токен USDT: 0x337610d27c682E347C9cD60BD4b3b107C9d34dDd
Токен BUSD: 0x8301F2213c0eeD49a7E28Ae4c3e91722919B8B47
Токен CAKE: 0x8d008B313C1d6C7fE2982F62d32Da7507cF43551

Токены BSC:
Токен USDT: 0x55d398326f99059fF775485246999027B3197955
Токен BUSD: 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56
Токен CAKE: 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82
 */
