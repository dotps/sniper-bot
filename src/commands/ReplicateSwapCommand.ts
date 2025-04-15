import { ICommand } from "./infrastructure/ICommand"
import { ResponseData } from "../data/ResponseData"
import { BlockchainService } from "../blockchain/blockchain.service"
import { Swap } from "../blockchain/swap-observer.service"
import { UserService } from "../users/user.service"
import { WalletService } from "../blockchain/wallet.service"
import { ReplicateDealCommand } from "./ReplicateCommand"
import { isAddress } from "viem"

export class ReplicateSwapCommand implements ICommand {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly userService: UserService,
    private readonly walletService: WalletService,
    private readonly swap: Swap,
  ) {}

  async execute(): Promise<ResponseData | null> {
    const usersReplicates = await this.walletService.getReplicatesWithUserWallet(this.swap.users)
    if (!usersReplicates) return null

    const isToken0BoughtInPool = this.swap.amount0 < 0n && this.swap.amount1 > 0n // пул обслужил покупку token0 пользователем за token1
    const isToken0SoldInPool = this.swap.amount0 > 0n && this.swap.amount1 < 0n // пул обслужил продажу token0 пользователем за token1
    if (this.swap.amount0 === 0n && this.swap.amount1 === 0n) return null

    for (const replicateCommand of usersReplicates) {
      const userWallet = replicateCommand.user.wallets[0]
      console.log(userWallet)
      if (!userWallet || !isAddress(userWallet.address)) continue

      if (isToken0BoughtInPool) {
        console.log("isToken0BoughtInPool " + isToken0BoughtInPool)
        console.log(this.swap)
      } else {
        console.log("isToken0SoldInPool " + isToken0SoldInPool)
        console.log(this.swap)
      }

      if (isToken0SoldInPool && replicateCommand.command === ReplicateDealCommand.SELL) {
        // в логе пул обслужил продажу token0 пользователем за token1
        const swapParams = {
          recipient: userWallet.address,
          zeroForOne: true, // направление обмена: token0 -> token1, отдаем token0, получаем token1
          amountSpecified: 200n, // сколько отдаем token0
          sqrtPriceLimitX96: 0n,
          data: "0x",
        }
        // TODO: добавить executeSwap
        // await this.blockchainService.executeSwap(swapParams)
      }
      if (isToken0BoughtInPool && replicateCommand.command === ReplicateDealCommand.BUY) {
        // в логе пул обслужил покупку token0 пользователем за token1
        const swapParams = {
          recipient: userWallet.address,
          zeroForOne: false, // направление обмена: token1 -> token0, отдаем token1, получаем token0
          amountSpecified: -200n, // сколько отдаем token1
          sqrtPriceLimitX96: 0n,
          data: "0x",
        }
      }
    }

    // TODO: сделать простой случай покупка / продажа за туже валюту
    // TODO: случай покупка / продажа за нативную валюту - найти в uniswap такой swap
    // TODO: покупка / продажа последовательно MATIC -> USDC -> WETH

    if (isToken0SoldInPool) {
      // куплен token1 за token0
      // получить и проверить баланс token0 у пользователя
      // если денег хватает провести транзакцию
    } else if (isToken0BoughtInPool) {
      // продан token1 за token0
    } else return null

    // TODO: продолжить
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
