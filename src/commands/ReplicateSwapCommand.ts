import { ICommand } from "./infrastructure/ICommand"
import { ResponseData } from "../data/ResponseData"
import { BlockchainService } from "../blockchain/blockchain.service"
import { SwapLog } from "../blockchain/swap-observer.service"
import { UserService } from "../users/user.service"
import { WalletService } from "../blockchain/wallet.service"
import { ReplicateDealCommand } from "./ReplicateCommand"
import { Hex, isAddress } from "viem"
import { absBigInt, clampMax } from "../utils/Calc"
import { Wallet } from "../blockchain/wallet.entity"
import { Replicate } from "../blockchain/replicate.entity"

export class ReplicateSwapCommand implements ICommand {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly userService: UserService,
    private readonly walletService: WalletService,
    private readonly swapLog: SwapLog,
  ) {}

  async execute(): Promise<ResponseData | null> {
    const usersReplicates = await this.walletService.getReplicatesWithUserWallet(this.swapLog.users)
    if (!usersReplicates || usersReplicates.length === 0) return null
    if (this.swapLog.amount0 === 0n || this.swapLog.amount1 === 0n) return null

    const isToken0BoughtInPool = this.swapLog.amount0 < 0n && this.swapLog.amount1 > 0n // пул обслужил покупку token0 пользователем за token1
    const isToken0SoldInPool = this.swapLog.amount0 > 0n && this.swapLog.amount1 < 0n // пул обслужил продажу token0 пользователем за token1

    for (const replicate of usersReplicates) {
      if (this.swapLog.tokens.token0.address !== replicate.token.address) continue // не подписаны на повтор сделки для токена

      const limit = BigInt(replicate.limit)
      const userWallet = replicate.user.wallets[0]

      if (!userWallet || !isAddress(userWallet.address)) continue

      if (isToken0SoldInPool && replicate.command === ReplicateDealCommand.SELL) {
        await this.handleSellOperation(replicate, userWallet, limit)
      } else if (isToken0BoughtInPool && replicate.command === ReplicateDealCommand.BUY) {
        await this.handleBuyOperation(replicate, userWallet, limit)
      }
    }

    return null
  }

  private async handleSellOperation(replicate: Replicate, userWallet: Wallet, userLimit: bigint) {
    const amountSpecified = clampMax(absBigInt(this.swapLog.amount0), userLimit)
    // в логе пул обслужил продажу token0 пользователем за token1 [token0 (-) ушел из пула, token1 (+) пришел в пул]
    // поэтому для повтора сделки, использовать amountSpecified (отрицательное значение)
    const swapParams: Swap = {
      recipient: userWallet.address,
      zeroForOne: true, // направление обмена: token0 -> token1, отдаем token0, получаем token1
      amountSpecified: -amountSpecified, // сколько отдаем token0
      sqrtPriceLimitX96: this.swapLog.sqrtPriceX96,
      data: "0x",
      poolAddress: this.swapLog.poolAddress,
    }

    // TODO: добавить проскальзывание

    await this.blockchainService.executeSwap(swapParams, this.swapLog.tokens.token0, replicate.user)
  }

  private async handleBuyOperation(replicate: Replicate, userWallet: Wallet, userLimit: bigint) {
    const amountSpecified = clampMax(absBigInt(this.swapLog.amount1), userLimit)
    // в логе пул обслужил покупку token0 пользователем за token1 [token0 (+) пришел в пул, token1 (-) ушел из пула]
    // поэтому для повтора сделки, использовать amountSpecified (отрицательное значение)
    const swapParams: Swap = {
      recipient: userWallet.address,
      zeroForOne: false, // направление обмена: token1 -> token0, отдаем token1, получаем token0
      amountSpecified: -amountSpecified, // сколько отдаем token1
      sqrtPriceLimitX96: this.swapLog.sqrtPriceX96,
      data: "0x",
      poolAddress: this.swapLog.poolAddress,
    }

    await this.blockchainService.executeSwap(swapParams, this.swapLog.tokens.token1, replicate.user)
  }
}

export type Swap = {
  recipient: Hex
  zeroForOne: boolean
  amountSpecified: bigint
  sqrtPriceLimitX96: bigint
  data: Hex
  poolAddress: Hex
}
