import { forwardRef, Inject, Injectable, OnModuleInit } from "@nestjs/common"
import {
  Block,
  createPublicClient,
  GetContractEventsReturnType,
  Hex,
  http,
  isAddress,
  Log,
  parseAbi,
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
    const balance = await this.client.getBalance({
      address: "0xF6dD294C065DDE53CcA856249FB34ae67BE5C54C",
      // address: "0xe92Ea8F400CB9bD368BD1185C9fC5e2664770341",
    })
    console.log(`Баланс: ${balance} wei`)
    await this.polygonWatch()
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

  async polygonWatch() {
    console.log("polygonWatch")

    const swapEventAbi = parseAbiItem(
      "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
    )

    // const walletAddress = "0xe92Ea8F400CB9bD368BD1185C9fC5e2664770341"
    // const walletAddress = "0x7f20a7A526D1BAB092e3Be0733D96287E93cEf59" // тут есть
    const walletAddress = "0x06959153B974D0D5fDfd87D561db6d8d4FA0bb0B"
    // TODO: продолжить
    const unwatch = this.client.watchEvent({
      event: swapEventAbi,
      onLogs: (logs) => {
        console.log("++++", logs.length)
        // for (const log of logs) {
        //   console.log(log.args.sender)
        // }
        logs
          .filter((log) => log.args.sender === walletAddress || log.args.recipient === walletAddress)
          .forEach((log) => {
            console.log("Найдена сделка:", log)
          })
      },
    })
  }

  // TODO: с использованием пула работает, мне нужно отслеживать все
  async polygonWatchPool() {
    const swapEventAbi = parseAbiItem(
      "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
    )

    // Адрес пула USDC/WETH на Polygon
    const poolAddress = "0x45dDa9cb7c25131DF268515131f647d726f50608"

    const unwatch = this.client.watchEvent({
      address: poolAddress,
      event: swapEventAbi,
      onLogs: (logs) => {
        logs.forEach((log) => {
          const { args } = log
          console.log("Новая сделка:")
          console.log("Sender:", args.sender)
          console.log("Recipient:", args.recipient)
          console.log("Amount0 (delta):", args?.amount0?.toString())
          console.log("Amount1 (delta):", args?.amount1?.toString())
          console.log("------------------")
        })
      },
    })
  }

  async getTokenInfo(tokenAddress: Hex) {
    const [symbol, decimals] = await Promise.all([
      this.client.readContract({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: "symbol",
      }),
      this.client.readContract({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: "decimals",
      }),
    ])
    return { symbol, decimals }
  }
}

/*
NOTE:
transaction.from - всегда кошелек
transaction.to -
 */

const tokenAbi = parseAbi(["function symbol() view returns (string)", "function decimals() view returns (uint8)"])
