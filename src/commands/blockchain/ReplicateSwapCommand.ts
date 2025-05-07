import { ICommand } from "../infrastructure/ICommand"
import { BotResponseData } from "../../bots/infrastructure/BotResponseData"
import { SwapLog } from "../../blockchain/swap-observer.service"
import { WalletService } from "../../blockchain/wallet/wallet.service"
import { ReplicateDealCommand } from "../bot/ReplicateCommand"
import { Hex, isAddress } from "viem"
import { absBigInt, calculateSqrtPriceWithSlippage, clampMax } from "../../utils/Calc"
import { Wallet } from "../../blockchain/wallet/wallet.entity"
import { Replicate } from "../../blockchain/replicate.entity"
import { ErrorHandler } from "../../errors/ErrorHandler"
import { BlockchainPoolService } from "../../blockchain/blockchain-pool.service"

export class ReplicateSwapCommand implements ICommand {
  private readonly slippagePercent = 0.5

  constructor(
    private readonly blockchainPoolService: BlockchainPoolService,
    private readonly walletService: WalletService,
    private readonly swapLog: SwapLog,
  ) {}

  async execute(): Promise<BotResponseData | null> {
    if (this.swapLog.amount0 === 0n || this.swapLog.amount1 === 0n) return null

    try {
      const usersReplicates = await this.walletService.getReplicatesWithUserWallet(this.swapLog.users)
      if (!usersReplicates || usersReplicates.length === 0) return null

      for (const replicate of usersReplicates) {
        if (!this.isUserSubscribedOnToken(replicate.token.address)) continue // не подписаны на повтор сделки для токена
        await this.executeReplicateOperation(replicate)
      }
    } catch (error) {
      return ErrorHandler.handleAndResponse(error)
    }

    return null
  }

  private async executeReplicateOperation(replicate: Replicate): Promise<void> {
    const limit = BigInt(replicate.limit)
    const userWallet = replicate.user.wallets[0]

    if (!userWallet || !isAddress(userWallet.address)) return

    if (this.isToken0SoldInPool() && replicate.command === ReplicateDealCommand.SELL) {
      await this.handleSellOperation(replicate, userWallet, limit)
    } else if (this.isToken0BoughtInPool() && replicate.command === ReplicateDealCommand.BUY) {
      await this.handleBuyOperation(replicate, userWallet, limit)
    }
  }

  private isUserSubscribedOnToken(replicateTokenAddress: Hex): boolean {
    return this.swapLog.tokens.tokenAddress0.address === replicateTokenAddress
  }

  // пул обслужил покупку token0 пользователем за token1
  private isToken0BoughtInPool(): boolean {
    return this.swapLog.amount0 < 0n && this.swapLog.amount1 > 0n
  }

  // пул обслужил продажу token0 пользователем за token1
  private isToken0SoldInPool(): boolean {
    return this.swapLog.amount0 > 0n && this.swapLog.amount1 < 0n
  }

  private async handleSellOperation(replicate: Replicate, userWallet: Wallet, userLimit: bigint): Promise<void> {
    const amountSpecified = clampMax(absBigInt(this.swapLog.amount0), userLimit)
    const zeroForOne = true
    // в логе пул обслужил продажу token0 пользователем за token1 [token0 (-) ушел из пула, token1 (+) пришел в пул]
    // поэтому для повтора сделки, использовать amountSpecified (отрицательное значение)
    const swap: Swap = {
      recipient: userWallet.address,
      zeroForOne: zeroForOne, // направление обмена: token0 -> token1, отдаем token0, получаем token1
      amountSpecified: -amountSpecified, // сколько отдаем token0
      sqrtPriceLimitX96: calculateSqrtPriceWithSlippage(this.swapLog.sqrtPriceX96, this.slippagePercent, zeroForOne),
      data: "0x",
      poolAddress: this.swapLog.poolAddress,
    }

    await this.blockchainPoolService.executeSwap(swap, this.swapLog.tokens.tokenAddress0, replicate.user)
  }

  private async handleBuyOperation(replicate: Replicate, userWallet: Wallet, userLimit: bigint): Promise<void> {
    const amountSpecified = clampMax(absBigInt(this.swapLog.amount1), userLimit)
    const zeroForOne = false
    // в логе пул обслужил покупку token0 пользователем за token1 [token0 (+) пришел в пул, token1 (-) ушел из пула]
    // поэтому для повтора сделки, использовать amountSpecified (отрицательное значение)
    const swap: Swap = {
      recipient: userWallet.address,
      zeroForOne: zeroForOne, // направление обмена: token1 -> token0, отдаем token1, получаем token0
      amountSpecified: -amountSpecified, // сколько отдаем token1
      sqrtPriceLimitX96: calculateSqrtPriceWithSlippage(this.swapLog.sqrtPriceX96, this.slippagePercent, zeroForOne),
      data: "0x",
      poolAddress: this.swapLog.poolAddress,
    }

    await this.blockchainPoolService.executeSwap(swap, this.swapLog.tokens.tokenAddress1, replicate.user)
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
