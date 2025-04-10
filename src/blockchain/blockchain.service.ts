import { Injectable } from "@nestjs/common"
import { createPublicClient, erc20Abi, Hex, http, isAddress, PublicClient, webSocket } from "viem"
import { bsc, bscTestnet, polygon, polygonMumbai } from "viem/chains"
import { Logger } from "../utils/Logger"
import { ResponseBotError } from "../errors/ResponseBotError"
import { Token } from "./token.entity"
import { pancakeRouterV2Abi } from "../providers/nets/pancakeRouterAbi"
import { watchPendingTransactions } from "viem/actions"

@Injectable()
export class BlockchainService {
  // private readonly defaultBlockchain = Blockchain.BSC
  private readonly defaultBlockchain = Blockchain.POLYGON
  private clients: Map<Blockchain, PublicClient> = new Map()
  private readonly messages = {
    WRONG_WALLET_OR_TOKEN: "Неверный адрес кошелька или токена.",
    TOKEN_ERROR: "Ошибка с адресом токена. Возможно токен не принадлежит текущей сети.",
  } as const

  constructor() {
    this.initBlockchainClients()
    // this.watchDeals("0x7c810d8bb90634b040f9ee913f5639f3d3914d93f4a361ab89c747eb8fa546ec")
  }

  private initBlockchainClients() {
    const bscClient = createPublicClient({
      chain: bscTestnet,
      // chain: bsc,
      transport: http(),
    })
    const polygonClient = createPublicClient({
      chain: polygon,
      // chain: polygonMumbai,
      transport: http(),
    })

    this.clients.set(Blockchain.BSC, bscClient) // TODO: можно перейти на строки bscClient.chain.name, чтобы не создавать enum
    this.clients.set(Blockchain.POLYGON, polygonClient)
  }

  getClient(clientType: Blockchain = this.defaultBlockchain): PublicClient {
    const client = this.clients.get(clientType)
    console.log(clientType)
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
      // Logger.error(error)
      return null
    }
  }

  // private watchDeals(walletAddress: Hex) {
  //   this.getClient().watchPendingTransactions({
  //     onTransactions: (hashes) => void this.handleHashes(hashes, walletAddress),
  //   })
  // }
  //
  // // TODO: walletAddress.toLowerCase происходит ввод где возможно (адрес не чуствителен к регистру и могут быть ошибки)
  //
  // // TODO: сделать сервис для отслеживания сделок, при старте он загружает в себя список отслеживаемых токенов,
  // // при добавлении/удалении подписок список изменяется, переодически сам обновляется
  //
  // private async handleHashes(hashes: Hex[], walletAddress: Hex) {
  //   for (const hash of hashes) {
  //     console.log(hash)
  //     try {
  //       const transaction = await this.getClient().getTransaction({ hash })
  //       if (transaction.from.toLowerCase() === walletAddress.toLowerCase()) {
  //         console.log(transaction.from.toLowerCase())
  //         // TODO: запустить команду Повтора сделки
  //       }
  //     } catch (error) {
  //       Logger.error(error)
  //     }
  //   }
  // }
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

0xd0567bb38fa5bad45150026281c43fa6031577b9 - часто идут транзакции

0xF6dD294C065DDE53CcA856249FB34ae67BE5C54C - мой кошелек

0x22579CA45eE22E2E16dDF72D955D6cf4c767B0eF - кошелек (кран) с celo

Популярные адреса polygon uniswap
0xe592427a0aece92de3edee1f18e0157c05861564
0x802b65b5d9016621e66003aed0b16615093f328b
0x802b65b5d9016621e66003aed0b16615093f328b
0x7f20a7a526d1bab092e3be0733d96287e93cef59
0x85cd07ea01423b1e937929b44e4ad8c40bbb5e71

====================
Токены BSC:
Токен USDT: 0x55d398326f99059fF775485246999027B3197955
Токен BUSD: 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56
Токен CAKE: 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82
 */

/*
TODO:
 Автоматическое повторение сделок
 Оповещение при недостатке баланса
 Перевод токенов (подключить блокчейн)
 */

const pancakeSwapRouterAddress: Hex = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1" // для BSC Testnet
export const pancakeSwapRouter = {
  address: pancakeSwapRouterAddress,
  abi: pancakeRouterV2Abi,
}
