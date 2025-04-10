import { forwardRef, Inject, Injectable, OnModuleInit } from "@nestjs/common"
import { Hex, isAddress, Log, parseAbi, parseAbiItem, PublicClient, WatchEventOnLogsParameter } from "viem"
import { BlockchainService, swapEventAbi } from "./blockchain.service"
import { WalletService } from "./wallet.service"
import { FollowWallet } from "./follow-wallet.entity"
import { Uniswap } from "./uniswap"
import { ISwapProvider } from "./ISwapProvider"
import { IPoolTokenPair } from "./IPoolTokenPair"
import { ReplicateTransactionCommand } from "../commands/ReplicateTransactionCommand"

@Injectable()
export class SwapObserverService implements OnModuleInit {
  private readonly client: PublicClient
  private observedWallets: Map<Hex, number[]> = new Map<Hex, number[]>()
  private swapProvider: ISwapProvider
  private pools: Map<Hex, IPoolTokenPair> = new Map<Hex, IPoolTokenPair>()

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

  async watchSwaps() {
    this.pools = this.swapProvider.getPools()
    const poolsAddresses = [...this.pools.keys()]

    const unwatch = this.client.watchEvent({
      address: poolsAddresses,
      event: swapEventAbi,
      onLogs: (logs) => {
        const swaps = this.getSwapsOfObservableWallets(logs)
        console.log(logs.length)

        for (const swap of swaps) {
          console.log(swap)
          console.log("запустить команду повтора транзакции")
          // TODO: запустить команду повтора транзакции
          const command = new ReplicateTransactionCommand(this.blockchainService, swap)
          command.execute()
        }
      },
    })
  }

  private getSwapsOfObservableWallets(logs: WatchEventOnLogsParameter<typeof swapEventAbi>): Swap[] {
    const swaps: Swap[] = []

    for (const log of logs) {
      if (!log.args) continue
      if (!log.args.sender || !isAddress(log.args.sender)) continue
      if (!log.args.recipient || !isAddress(log.args.recipient)) continue

      const poolAddress = log.address.toLowerCase() as Hex
      const tokens = this.pools.get(poolAddress)
      if (!tokens) continue

      const sender = log.args.sender.toLowerCase() as Hex
      const recipient = log.args.recipient.toLowerCase() as Hex

      const subscribedUsersOnWallet = this.observedWallets.get(sender) ?? this.observedWallets.get(recipient)
      if (subscribedUsersOnWallet) {
        const swap: Swap = {
          sender: sender,
          recipient: recipient,
          poolAddress: poolAddress,
          amount0: log.args.amount0 ?? 0n,
          amount1: log.args.amount1 ?? 0n,
          sqrtPriceX96: log.args.sqrtPriceX96 ?? 0n,
          liquidity: log.args.liquidity ?? 0n,
          tick: log.args.tick ?? 0,
          tokens: tokens,
          users: subscribedUsersOnWallet,
        }
        swaps.push(swap)
      }
    }

    return swaps
  }

  addFollowWalletIntoObserver(followWallet: FollowWallet) {
    const users = this.observedWallets.get(followWallet.wallet)

    if (!users) {
      this.observedWallets.set(followWallet.wallet, [followWallet.userId])
    } else if (!users.includes(followWallet.userId)) {
      users.push(followWallet.userId)
    }
  }
}

export type Swap = {
  sender: Hex
  recipient: Hex
  poolAddress: Hex
  tokens: IPoolTokenPair
  amount0: bigint
  amount1: bigint
  sqrtPriceX96: bigint
  liquidity: bigint
  tick: number
  users: number[]
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
В логе токены не отображаются, нужно делать запрос или получить из пула
 */
