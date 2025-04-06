import { forwardRef, Inject, Injectable, OnModuleInit } from "@nestjs/common"
import {
  Block,
  createPublicClient,
  GetContractEventsReturnType,
  Hex,
  http,
  isAddress,
  Log,
  parseAbiItem,
  PublicClient,
  webSocket,
} from "viem"
import { Logger } from "../utils/Logger"
import { BlockchainService, pancakeSwapRouter } from "./blockchain.service"
import { WalletService } from "./wallet.service"
import { FollowWallet } from "./follow-wallet.entity"
import { ReplicateTransactionCommand } from "../commands/ReplicateTransactionCommand"
import { bscTestnet } from "viem/chains"

@Injectable()
export class TransactionObserverService implements OnModuleInit {
  private readonly client: PublicClient
  private readonly updateObservedWalletsInterval: number = 60000
  private observedWallets: Record<Hex, number[]> = {}
  private tempWalletAddresses: Map<Hex, number> = new Map<Hex, number>()

  constructor(
    private readonly blockchainService: BlockchainService,
    @Inject(forwardRef(() => WalletService)) // TODO: посмотреть как можно выйти из циклической зависимости
    private readonly walletService: WalletService,
  ) {
    this.client = this.blockchainService.getClient()
  }

  async onModuleInit() {
    await this.updateObservedWallets()
    /*
        this.client.watchPendingTransactions({
          onTransactions: (hashes) => void this.handleHashes(hashes),
        })
    
        setInterval(() => {
          this.updateObservedWallets().catch((error) => {
            Logger.error(error)
          })
        }, this.updateObservedWalletsInterval)
    */
    const targetWallet = "0xd0567bb38fa5bad45150026281c43fa6031577b9"
    // const unwatch = await this.trackSwaps(targetWallet)
    // const swaps = await this.getRecentSwaps(targetWallet)
    // console.log("Последние свапы:", swaps)

    // const unwatch = await this.watchSwaps(targetWallet)
    // const unwatch = await this.watchSwaps()
  }

  private async updateObservedWallets() {
    this.observedWallets = await this.walletService.getFollowWallets()
    console.log(this.observedWallets)
  }

  // TODO: walletAddress.toLowerCase происходит ввод? добавить где возможно (адрес не чуствителен к регистру и могут быть ошибки)

  private async handleHashes(hashes: Hex[]) {
    for (const hash of hashes) {
      try {
        const transaction = await this.client.getTransaction({ hash })
        const fromAddress = transaction.from.toLowerCase()
        if (!isAddress(fromAddress)) return
        if (!transaction.to || !isAddress(transaction.to)) return

        if (transaction.to && isAddress(transaction.to)) {
          console.log(fromAddress)

          // const currentValue = this.tempWalletAddresses.get(fromAddress) || 0
          // this.tempWalletAddresses.set(fromAddress, currentValue + 1)
          // console.log("getMaxAddress", this.getMaxAddress())

          const code = await this.client.getCode({ address: transaction.to })
          // console.log(code)
          const isTokenContract = code && code !== "0x"
          if (isTokenContract) {
            const symbol = await this.blockchainService.getTokenSymbol(transaction.to)
            console.log(symbol)
          }
          console.log("isTokenContract", isTokenContract)
          console.log("chain", transaction.chainId)
          console.log("value", transaction.value)
          console.log("------")
        }

        const walletUsers = this.observedWallets[fromAddress]
        if (walletUsers) {
          const command = new ReplicateTransactionCommand(this.blockchainService, fromAddress, walletUsers, transaction)
          await command.execute()
        }
      } catch (error) {
        Logger.error(error)
      }
    }
  }

  addFollowWalletIntoObserver(followWallet: FollowWallet) {
    if (!this.observedWallets[followWallet.wallet]) {
      this.observedWallets[followWallet.wallet] = [followWallet.userId]
    } else if (!this.observedWallets[followWallet.wallet].includes(followWallet.userId)) {
      this.observedWallets[followWallet.wallet].push(followWallet.userId)
    }
  }

  /*
  async watchSwaps(targetWallet: `0x${string}`) {
    // Подписываемся на новые блоки
    const unwatch = publicClient.watchBlocks({
      onBlock: async (block) => {
        console.log(`Новый блок: ${block.number}`)

        // Получаем свапы за последний блок
        const logs = await publicClient.getLogs({
          address: pancakeRouterTestnet,
          event: pancakeSwapRouterAbi[0],
          fromBlock: block.number - 1n,
          toBlock: block.number,
        })

        // Фильтруем только нужный кошелек
        const walletSwaps = logs.filter((log) => log.args.sender === targetWallet)

        if (walletSwaps.length > 0) {
          console.log("Найдены новые свапы:", walletSwaps)
          // Можно сразу копировать сделку
          // await copySwap(walletSwaps[0])
        }
      },
    })

    return unwatch
  }
*/
  // Запуск мониторинга
  //   const targetWallet = '0x...'; // Адрес, который отслеживаем
  //   const unwatch = await watchSwaps(targetWallet);

  // Чтобы остановить мониторинг:
  // unwatch();

  /*
  async getRecentSwaps(walletAddress: `0x${string}`) {
    const latestBlock = await this.client.getBlockNumber()

    // Получаем логи событий Swap
    const logs = await this.client.getLogs({
      address: pancakeSwapRouter.address,
      event: pancakeSwapAbi,
      fromBlock: latestBlock - 10n, // Смотрим последние 1000 блоков (~15 минут)
      toBlock: "latest",
    })

    // Фильтруем только транзакции от нужного адреса
    return logs.filter((log) => log.args.sender === walletAddress)
  }
  */

  /*
  async watchSwaps() {
    console.log("WATCH")
    const unwatch = publicClient.watchEvent({
      address: PANCAKE_ROUTER,
      event: pancakeSwapAbi,
      onLogs: (logs) => {
        logs.forEach((log) => {
          console.log("Новый свап:", {
            sender: log.args.sender,
            amountIn: log.args.amount0In || log.args.amount1In,
            amountOut: log.args.amount0Out || log.args.amount1Out,
            to: log.args.to,
          })
        })
      },
    })
    return unwatch
  }*/

  async trackSwaps(targetWallet: `0x${string}`): Promise<() => void> {
    console.log("Starting swap tracking...")

    // Подписываемся на новые блоки
    const unwatch = publicClient.watchBlocks({
      onBlock: async (block: Block) => {
        try {
          // Получаем все события Swap за блок
          const logs: Log[] = await publicClient.getContractEvents({
            ...pancakeSwapRouter,
            eventName: "Swap",
            fromBlock: BigInt(block.number!),
            toBlock: BigInt(block.number!),
            strict: true,
          })

          // Фильтруем по целевому кошельку
          const targetSwaps = logs.filter(
            (log: Log & { args: { sender: `0x${string}`; to: `0x${string}` } }) =>
              (log.args.sender as `0x${string}`)?.toLowerCase() === targetWallet.toLowerCase() ||
              (log.args.to as `0x${string}`)?.toLowerCase() === targetWallet.toLowerCase(),
          )

          // Обрабатываем найденные свапы
          for (const swap of targetSwaps) {
            const tx = await this.client.getTransaction({
              hash: swap.transactionHash as `0x${string}`,
            })

            // Здесь можно добавить логику для повторения сделки
            // await replicateSwap(tx)
          }
        } catch (error: unknown) {
          console.error("Block processing error:", error)
        }
      },
      onError: (error: Error) => console.error("Block watch error:", error),
    })

    return unwatch
  }
}

const pancakeSwapAbi = {
  type: "event",
  name: "Swap",
  inputs: [
    { name: "sender", type: "address", indexed: true },
    { name: "amount0In", type: "uint256", indexed: false },
    { name: "amount1In", type: "uint256", indexed: false },
    { name: "amount0Out", type: "uint256", indexed: false },
    { name: "amount1Out", type: "uint256", indexed: false },
    { name: "to", type: "address", indexed: true },
  ],
} as const

/*
NOTE:
transaction.from - всегда кошелек
transaction.to -
 */

const publicClient = createPublicClient({
  chain: bscTestnet,
  // transport: http('https://data-seed-prebsc-1-s1.binance.org:8545/') // Альтернативный RPC
  transport: http("https://rpc.ankr.com/bsc_testnet_chapel"),
  // transport: webSocket("wss://bsc-testnet-dataseed.bnbchain.org"), // WebSocket RPC
})

const pancakeSwapRouterAbi = [
  {
    type: "event",
    name: "Swap",
    inputs: [
      { name: "sender", type: "address", indexed: true },
      { name: "amount0In", type: "uint256", indexed: false },
      { name: "amount1In", type: "uint256", indexed: false },
      { name: "amount0Out", type: "uint256", indexed: false },
      { name: "amount1Out", type: "uint256", indexed: false },
      { name: "to", type: "address", indexed: true },
    ],
  },
] as const

// Адрес PancakeSwap Router в BSC Testnet
const pancakeRouterTestnet = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3"

const PANCAKE_ROUTER = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3"
const PANCAKE_FACTORY = "0x6725F303b657a9451d8BA641348b6761A6CC7a17"
