import { forwardRef, Inject, Injectable, OnModuleInit } from "@nestjs/common"
import { Hex, isAddress, PublicClient } from "viem"
import { Logger } from "../utils/Logger"
import { BlockchainService } from "./blockchain.service"
import { WalletService } from "./wallet.service"
import { FollowWallet } from "./follow-wallet.entity"

@Injectable()
export class TransactionObserverService implements OnModuleInit {
  private readonly client: PublicClient
  private observedWallets: Record<Hex, number[]> = {}
  private updateObservedWalletsInterval: number = 60000

  constructor(
    private readonly blockchainService: BlockchainService,
    @Inject(forwardRef(() => WalletService)) // TODO: посмотреть как можно выйти из циклической зависимости
    private readonly walletService: WalletService,
  ) {
    this.client = blockchainService.getClient()
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

        const walletUsers = this.observedWallets[fromAddress]
        if (walletUsers) {
          console.log("TODO: запустить команду Повтора сделки")
          // TODO: запустить команду Повтора сделки
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
}
