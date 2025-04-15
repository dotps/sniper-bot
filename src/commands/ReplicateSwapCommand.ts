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
    const replicates = await this.walletService.getReplicatesWithWallets(this.swap.users)
    if (!replicates) return null

    console.log(this.swap)

    const isUserBuyToken0 = this.swap.amount0 < 0n && this.swap.amount1 > 0n // пул обслужил покупку token0 пользователем за token1
    const isUserSellToken0 = this.swap.amount0 > 0n && this.swap.amount1 < 0n // пул обслужил продажу token0 пользователем за token1

    for (const replicateCommand of replicates) {
      const wallet = replicateCommand.user.wallets[0]
      if (!wallet || !isAddress(wallet.address)) continue

      if (isUserBuyToken0) console.log("isBuyToken0 " + isUserBuyToken0)
      else console.log("isSellToken0 " + isUserSellToken0)

      if (isUserSellToken0 && replicateCommand.command === ReplicateDealCommand.SELL) {
        // в логе пул обслужил продажу token0 пользователем за token1
        const swapParams = {
          recipient: wallet.address,
          zeroForOne: true, // направление обмена: token0 -> token1, отдаем token0, получаем token1
          amountSpecified: 200n, // сколько отдаем token0
          sqrtPriceLimitX96: 0n,
          data: "0x",
        }
        await this.blockchainService.executeSwap(swapParams)
      }
      if (isUserBuyToken0 && replicateCommand.command === ReplicateDealCommand.BUY) {
        // в логе пул обслужил покупку token0 пользователем за token1
        const swapParams = {
          recipient: wallet.address,
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

    if (isUserSellToken0) {
      // куплен token1 за token0
      // получить и проверить баланс token0 у пользователя
      // если денег хватает провести транзакцию
    } else if (isUserBuyToken0) {
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
