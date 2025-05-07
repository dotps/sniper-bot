import { forwardRef, Inject, Injectable, OnModuleInit } from "@nestjs/common"
import { Hex, isAddress, Log, parseAbi, parseAbiItem, PublicClient, WatchEventOnLogsParameter } from "viem"
import { Logger } from "../services/logger/Logger"
import { BlockchainService } from "./blockchain.service"
import { WalletService } from "./wallet.service"
import { FollowWallet } from "./follow-wallet.entity"
import { ReplicateSwapCommand } from "../commands/blockchain/ReplicateSwapCommand"

@Injectable()
export class TransactionObserverService implements OnModuleInit {
  private readonly client: PublicClient
  private readonly updateObservedWalletsInterval: number = 60000
  private observedWallets: Map<Hex, number[]> = new Map<Hex, number[]>()

  constructor(
    private readonly blockchainService: BlockchainService,
    @Inject(forwardRef(() => WalletService)) // TODO: посмотреть как можно выйти из циклической зависимости
    private readonly walletService: WalletService,
  ) {
    this.client = this.blockchainService.getClient()
  }

  async onModuleInit() {
    await this.updateObservedWallets()
    this.client.watchPendingTransactions({
      onTransactions: (hashes) => void this.handleHashes(hashes),
    })

    setInterval(() => {
      this.updateObservedWallets().catch((error) => {
        Logger.error(error)
      })
    }, this.updateObservedWalletsInterval)

    const targetWallet = "0xd0567bb38fa5bad45150026281c43fa6031577b9"
    const balance = await this.client.getBalance({
      address: "0xF6dD294C065DDE53CcA856249FB34ae67BE5C54C",
      // address: "0xe92Ea8F400CB9bD368BD1185C9fC5e2664770341",
    })
    console.log(`Баланс: ${balance} wei`)
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

        // const walletUsers = this.observedWallets[fromAddress]
        // if (walletUsers) {
        //   const command = new ReplicateTransactionCommand(this.blockchainService, fromAddress, walletUsers, transaction)
        //   await command.execute()
        // }
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
