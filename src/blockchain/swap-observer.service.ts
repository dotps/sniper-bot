import { forwardRef, Inject, Injectable, OnModuleInit } from "@nestjs/common"
import { Hex, isAddress, PublicClient, WatchEventOnLogsParameter } from "viem"
import { BlockchainService, swapEventAbi } from "./blockchain.service"
import { WalletService } from "./wallet.service"
import { FollowWallet } from "./follow-wallet.entity"
import { Uniswap } from "../providers/nets/Uniswap"
import { ISwapProvider } from "./ISwapProvider"
import { PoolTokenPair } from "./PoolTokenPair"
import { ReplicateSwapCommand } from "../commands/ReplicateSwapCommand"
import { UserService } from "../users/user.service"

@Injectable()
export class SwapObserverService implements OnModuleInit {
  private readonly client: PublicClient
  private observedWallets: Map<Hex, number[]> = new Map<Hex, number[]>()
  private swapProvider: ISwapProvider
  private pools: Map<Hex, PoolTokenPair> = new Map<Hex, PoolTokenPair>()

  constructor(
    private readonly blockchainService: BlockchainService,
    @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
    private readonly userService: UserService,
  ) {
    this.client = this.blockchainService.getClient()
    this.swapProvider = this.blockchainService.getSwapProvider()
  }

  async onModuleInit() {
    await this.swapProvider.init()
    await this.updateObservedWallets()
    await this.watchSwaps()
  }

  private async updateObservedWallets() {
    this.observedWallets = await this.walletService.getFollowWallets()
    console.log(this.observedWallets)
  }

  async watchSwaps() {
    // TODO: для сделок нужен fee его надо загружать из пула, доработать getPoolsInfo
    // сейчас fee просто число в ReplicateSwapCommand
    /*
  const fee = await client.readContract({
  address: poolAddress,
  abi: poolAbi,
  functionName: 'fee'
})
     */
    this.pools = this.swapProvider.getPools()
    const poolsAddresses = [...this.pools.keys()]

    const unwatch = this.client.watchEvent({
      address: poolsAddresses,
      event: swapEventAbi,
      onLogs: (logs) => {
        const swaps = this.getSwapsOfObservableWallets(logs)
        for (const swap of swaps) {
          const command = new ReplicateSwapCommand(this.blockchainService, this.userService, this.walletService, swap)
          command.execute()
        }
      },
    })
  }

  private getSwapsOfObservableWallets(logs: WatchEventOnLogsParameter<typeof swapEventAbi>): SwapLog[] {
    const swaps: SwapLog[] = []

    for (const log of logs) {
      if (!log.args) continue
      let sender = log.args.sender
      let recipient = log.args.recipient

      if (!sender || !isAddress(sender)) continue
      if (!recipient || !isAddress(recipient)) continue

      sender = sender.toLowerCase() as Hex
      recipient = recipient.toLowerCase() as Hex

      const poolAddress = log.address.toLowerCase() as Hex
      const tokens = this.pools.get(poolAddress)
      if (!tokens) continue

      const subscribedUsersOnWallet = this.observedWallets.get(sender) ?? this.observedWallets.get(recipient)
      if (subscribedUsersOnWallet) {
        const swap: SwapLog = {
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
