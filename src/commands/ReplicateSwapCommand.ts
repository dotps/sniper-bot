import { ICommand } from "./infrastructure/ICommand"
import { ResponseData } from "../data/ResponseData"
import { BlockchainService } from "../blockchain/blockchain.service"
import { SwapLog } from "../blockchain/swap-observer.service"
import { UserService } from "../users/user.service"
import { WalletService } from "../blockchain/wallet.service"
import { ReplicateDealCommand } from "./ReplicateCommand"
import { Hex, isAddress } from "viem"
import { absBigInt, clampMax } from "../utils/Calc"

export class ReplicateSwapCommand implements ICommand {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly userService: UserService,
    private readonly walletService: WalletService,
    private readonly swapLog: SwapLog,
  ) {}

  async execute(): Promise<ResponseData | null> {
    // TODO: тут еще токены надо достать, т.к сделки то с конкретными токенами должны проводиться
    const usersReplicates = await this.walletService.getReplicatesWithUserWallet(this.swapLog.users)
    console.log("usersReplicates", usersReplicates)
    if (!usersReplicates) return null

    const isToken0BoughtInPool = this.swapLog.amount0 < 0n && this.swapLog.amount1 > 0n // пул обслужил покупку token0 пользователем за token1
    const isToken0SoldInPool = this.swapLog.amount0 > 0n && this.swapLog.amount1 < 0n // пул обслужил продажу token0 пользователем за token1
    if (this.swapLog.amount0 === 0n && this.swapLog.amount1 === 0n) return null

    for (const replicateCommand of usersReplicates) {
      const limit = BigInt(replicateCommand.limit)
      const userWallet = replicateCommand.user.wallets[0]
      if (!userWallet || !isAddress(userWallet.address)) continue

      if (isToken0SoldInPool && replicateCommand.command === ReplicateDealCommand.SELL) {
        // в логе пул обслужил продажу token0 пользователем за token1 [token0 (-) ушел из пула, token1 (+) пришел в пул]
        // поэтому для повтора сделки, использовать amountSpecified (отрицательное значение)
        const amountSpecified = clampMax(absBigInt(this.swapLog.amount0), limit)
        const swap: Swap = {
          recipient: userWallet.address,
          zeroForOne: true, // направление обмена: token0 -> token1, отдаем token0, получаем token1
          amountSpecified: -amountSpecified, // сколько отдаем token0
          sqrtPriceLimitX96: this.swapLog.sqrtPriceX96,
          data: "0x",
          poolAddress: this.swapLog.poolAddress,
        }
        await this.blockchainService.executeSwap(swap, this.swapLog.tokens.token0, replicateCommand.user)
      } else if (isToken0BoughtInPool && replicateCommand.command === ReplicateDealCommand.BUY) {
        // в логе пул обслужил покупку token0 пользователем за token1 [token0 (+) пришел в пул, token1 (-) ушел из пула]
        // поэтому для повтора сделки, использовать amountSpecified (отрицательное значение)
        const amountSpecified = clampMax(absBigInt(this.swapLog.amount1), limit)
        const swap: Swap = {
          recipient: userWallet.address,
          zeroForOne: false, // направление обмена: token1 -> token0, отдаем token1, получаем token0
          amountSpecified: -amountSpecified, // сколько отдаем token1
          sqrtPriceLimitX96: this.swapLog.sqrtPriceX96,
          data: "0x",
          poolAddress: this.swapLog.poolAddress,
        }
        await this.blockchainService.executeSwap(swap, this.swapLog.tokens.token1, replicateCommand.user)
      }
    }

    // TODO: сделать простой случай покупка / продажа за туже валюту
    // TODO: случай покупка / продажа за нативную валюту - найти в uniswap такой swap
    // TODO: покупка / продажа последовательно MATIC -> USDC -> WETH

    return null
  }

  /*
  =============
  Event Swap (логика изменения баланса пула)
  WPOL/USDT - pool
  token0/token1
  
  amount0: -313838714181212341112n, // токен ушел из пула (пул продал token0)
  amount1: 57963755n, // токен пришел в пул (пул купил token1)
  Если amount0 (-), а amount1 (+): значит, Итог для пула: пользователь купил token0 за token1, Итог для пользователя: он продал token1 за token0
  пул обслужил покупку token0 пользователем за token1 <<<<<<<<
  
  amount0: 313838714181212341112n, // токен пришел в пул (пул купил token0)
  amount1: -57963755n, // токен ушел из пула (пул продал token1)
  Если amount0 (+), а amount1 (-): значит, продал token0 за token1 (это именно продажа с точки зрения пула)
  пул обслужил продажу token0 пользователем за token1 <<<<<<<<
  */
}

export type Swap = {
  recipient: Hex
  zeroForOne: boolean
  amountSpecified: bigint
  sqrtPriceLimitX96: bigint
  data: Hex
  poolAddress: Hex
}
