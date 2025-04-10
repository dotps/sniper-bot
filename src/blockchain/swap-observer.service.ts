import { forwardRef, Inject, Injectable, OnModuleInit } from "@nestjs/common"
import { Hex, isAddress, Log, parseAbi, parseAbiItem, PublicClient, WatchEventOnLogsParameter } from "viem"
import { BlockchainService, swapEventAbi } from "./blockchain.service"
import { WalletService } from "./wallet.service"
import { FollowWallet } from "./follow-wallet.entity"
import { Uniswap } from "./uniswap"
import { ISwapProvider } from "./ISwapProvider"

@Injectable()
export class SwapObserverService implements OnModuleInit {
  private readonly client: PublicClient
  private observedWallets: Record<Hex, number[]> = {}
  private swapProvider: ISwapProvider

  constructor(
    private readonly blockchainService: BlockchainService,
    @Inject(forwardRef(() => WalletService)) // TODO: посмотреть как можно выйти из циклической зависимости
    private readonly walletService: WalletService,
  ) {
    this.client = this.blockchainService.getClient()
  }

  async onModuleInit() {
    this.swapProvider = new Uniswap(this.blockchainService)
    await this.swapProvider.init()
    await this.updateObservedWallets()
    await this.watchSwaps()
  }

  private async updateObservedWallets() {
    this.observedWallets = await this.walletService.getFollowWallets()
    console.log(this.observedWallets)
  }

  // TODO: walletAddress.toLowerCase происходит ввод? добавить где возможно (адрес не чуствителен к регистру и могут быть ошибки)

  async watchSwaps() {
    const pools = this.swapProvider.getPools()
    const poolsAddresses = [...pools.keys()]

    const unwatch = this.client.watchEvent({
      address: poolsAddresses,
      event: swapEventAbi,
      onLogs: (logs) => {
        const filteredLogs = this.getLogsForObservableWallets(logs)
        console.log(logs.length)
        // console.log(filteredLogs)

        for (const log of filteredLogs) {
          console.log(log)
          // TODO: запустить команду повтора транзакции
        }

        // logs.forEach((log) => {
        //   const { args } = log
        //   console.log("Новая сделка:")
        //   console.log("Sender:", args.sender)
        //   console.log("Recipient:", args.recipient)
        //   console.log("Amount0 (delta):", args?.amount0?.toString())
        //   console.log("Amount1 (delta):", args?.amount1?.toString())
        //   console.log("------------------")
        // })
      },
    })
  }

  private getLogsForObservableWallets(logs: WatchEventOnLogsParameter<typeof swapEventAbi>): Log[] {
    const filteredLogs: Log[] = []

    for (const log of logs) {
      if (!log.args) continue
      if (!log.args.sender || !isAddress(log.args.sender)) continue
      if (!log.args.recipient || !isAddress(log.args.recipient)) continue

      log.args.sender = log.args.sender.toLowerCase() as Hex
      log.args.recipient = log.args.recipient.toLowerCase() as Hex
      log.address = log.address.toLowerCase() as Hex

      if (this.observedWallets[log.args.sender] || this.observedWallets[log.args.recipient]) {
        filteredLogs.push(log)
      }
    }

    return filteredLogs
  }

  addFollowWalletIntoObserver(followWallet: FollowWallet) {
    if (!this.observedWallets[followWallet.wallet]) {
      this.observedWallets[followWallet.wallet] = [followWallet.userId]
    } else if (!this.observedWallets[followWallet.wallet].includes(followWallet.userId)) {
      this.observedWallets[followWallet.wallet].push(followWallet.userId)
    }
  }
}

/*
NOTE:
transaction.from - всегда кошелек
transaction.to -
 */



/*
address - адрес контракта пула, где произошел обмен
sender - адрес, инициировавший обмен
recipient - адрес получателя
  * может быть равен sender - тогда это покупка/продажа
  * != sender, то это перевод?
amount0 - изменение количества первого токена, если положительный, то был продан
amount1 - изменение количества второго токена, если отризацельный, то был куплен

Логика обмена токенов:
Пользователь sender продал токены token0 и получил токены token1 в пуле address

 */
