import { forwardRef, Inject, Injectable, OnModuleInit } from "@nestjs/common"
import { Hex, isAddress, PublicClient, WatchEventOnLogsParameter } from "viem"
import { BlockchainService } from "./blockchain.service"
import { WalletService } from "./wallet/wallet.service"
import { FollowWallet } from "./wallet/follow-wallet.entity"
import { ISwapProvider } from "./dex/swap-provider.interface"
import { PoolTokenPair } from "./dex/pool-token-pair"
import { ReplicateSwapCommand } from "../commands/blockchain/replicate-swap.command"
import { Logger } from "src/services/logger/logger"
import { BlockchainPoolService } from "./blockchain-pool.service"
import { swapEventAbi } from "../libs/constants/pool.abi"

@Injectable()
export class SwapObserverService implements OnModuleInit {
  private readonly client: PublicClient
  private readonly blockchainPoolService: BlockchainPoolService
  private observedWallets: Map<Hex, number[]> = new Map<Hex, number[]>()
  private swapProvider: ISwapProvider
  private pools: Map<Hex, PoolTokenPair> = new Map<Hex, PoolTokenPair>()

  constructor(
    private readonly blockchainService: BlockchainService,
    @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
  ) {
    this.client = this.blockchainService.getClient()
    this.swapProvider = this.blockchainService.getSwapProvider()
    this.blockchainPoolService = this.blockchainService.getPoolService()
  }

  async onModuleInit(): Promise<void> {
    await this.swapProvider.init()
    await this.updateObservedWallets()
    this.watchSwaps()
  }

  private async updateObservedWallets(): Promise<void> {
    this.observedWallets = await this.walletService.getFollowWallets()
    console.log("Наблюдаемые кошельки и пользователи", this.observedWallets)
  }

  watchSwaps(): void {
    try {
      this.pools = this.swapProvider.getPools()
      const poolsAddresses = [...this.pools.keys()]

      this.client.watchEvent({
        address: poolsAddresses,
        event: swapEventAbi,
        onLogs: (logs) => {
          const swaps = this.getSwapsOfObservableWallets(logs)
          // console.log("Подписка на кошельки. Зафиксированы обмены в DEX", swaps.length)
          for (const swap of swaps) {
            const command = new ReplicateSwapCommand(this.blockchainPoolService, this.walletService, swap)
            command.execute().catch((error) => Logger.error(error))
          }
        },
      })
    } catch (error) {
      Logger.error(error)
    }
  }

  private getSwapsOfObservableWallets(logs: WatchEventOnLogsParameter<typeof swapEventAbi>): SwapLog[] {
    const swaps: SwapLog[] = []

    for (const log of logs) {
      const addresses = this.getAddressesFromLog(log)
      if (!addresses) continue

      const tokens = this.pools.get(addresses.poolAddress)
      if (!tokens) continue

      const subscribedUsersOnWallet = this.observedWallets.get(addresses.sender) ?? this.observedWallets.get(addresses.recipient)
      if (!subscribedUsersOnWallet) continue

      const swap: SwapLog = {
        sender: addresses.sender,
        recipient: addresses.recipient,
        poolAddress: addresses.poolAddress,
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

    return swaps
  }

  private getAddressesFromLog(log: WatchEventOnLogsParameter<typeof swapEventAbi>[number]): Addresses | null {
    if (!log.args) return null

    const sender = log.args.sender
    const recipient = log.args.recipient
    const poolAddress = log.address

    if (!sender || !isAddress(sender)) return null
    if (!recipient || !isAddress(recipient)) return null
    if (!poolAddress || !isAddress(poolAddress)) return null

    return {
      sender: sender.toLowerCase() as Hex,
      recipient: recipient.toLowerCase() as Hex,
      poolAddress: poolAddress.toLowerCase() as Hex,
    }
  }

  addFollowWalletIntoObserver(followWallet: FollowWallet): void {
    const users = this.observedWallets.get(followWallet.wallet)

    if (!users) {
      this.observedWallets.set(followWallet.wallet, [followWallet.userId])
    } else if (!users.includes(followWallet.userId)) {
      users.push(followWallet.userId)
    }
  }
}

export type SwapLog = {
  sender: Hex
  recipient: Hex
  poolAddress: Hex
  tokens: PoolTokenPair
  amount0: bigint
  amount1: bigint
  sqrtPriceX96: bigint
  liquidity: bigint
  tick: number
  users: number[]
}

type Addresses = {
  sender: Hex
  recipient: Hex
  poolAddress: Hex
}
