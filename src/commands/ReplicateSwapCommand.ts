import { ICommand } from "./infrastructure/ICommand"
import { ResponseData } from "../data/ResponseData"
import { Commands } from "./Commands"
import { BlockchainService } from "../blockchain/blockchain.service"
import { Swap } from "../blockchain/swap-observer.service"
import { UserService } from "../users/user.service"
import { WalletService } from "../blockchain/wallet.service"
import { ReplicateDealCommand } from "./ReplicateCommand"
import { isAddress } from "viem"
import { Token } from "@uniswap/sdk-core"

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

    /*
    WPOL/USDT - pool
    token0/token1
    amount0: - / amount1: +
    
    - токен уходит из пула
    + токен приходит в пул
    
    Если amount0 < 0 → Пользователь купил token0 (продал token1).  
    Если amount1 < 0 → Пользователь купил token1 (продал token0).  
    
    ====
    
    amount0: - / amount1: +
    Продать WPOL → Купить USDT
    
    amount0: + / amount1: -
    Купить WPOL → Продать USDT
    
    ====
    пул WPOL/USDT
    Продажа token0 за token1:	amount0 (-, токен ушел из пула) 	amount1 (+, токен пришел в пул) 	Продали WPOL → получили USDT
    Покупка token0 за token1:	amount0 (+, токен пришел в пул) 	amount1 (-, токен ушел из пула) 	Купили WPOL → потратили USDT
    
    ==============
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

    const isBuyToken0 = this.swap.amount0 < 0n && this.swap.amount1 > 0n // пул обслужил покупку token0 пользователем за token1
    const isSellToken0 = this.swap.amount0 > 0n && this.swap.amount1 < 0n // пул обслужил продажу token0 пользователем за token1
    const deadline = Date.now() + 60 * 20 * 1000 // +20 минут
    const slippage = 1n

    for (const replicateCommand of replicates) {
      const wallet = replicateCommand.user.wallets[0]
      if (!wallet || !isAddress(wallet.address)) continue

      if (isBuyToken0) console.log("isBuyToken0 " + isBuyToken0)
      else console.log("isSellToken0 " + isSellToken0)
      // this.swap.tokens.token0.address

      // TODO: попробовать через uniswap sdk
      // TODO: добавить decimals

      // const tokenIn = isBuy ? this.swap.tokens.token0 : this.swap.tokens.token1
      // const tokenOut = isBuy ? this.swap.tokens.token1 : this.swap.tokens.token0
      // const amountIn = isBuy ? this.swap.amount0 : this.swap.amount1

      // const _tokenIn = new Token(
      //   137, //polygon.id
      //   tokenIn.address,
      //   tokenIn.decimals,
      //   tokenIn.symbol,
      // )
      // const _tokenOut = new Token(
      //   137, // polygon.id,
      //   tokenOut.address,
      //   tokenOut.decimals,
      //   tokenOut.symbol,
      // )

      /////////////////////

      // const swapParams = {
      //   tokenIn: isBuy ? this.swap.tokens.token0.address : this.swap.tokens.token1.address, // токен, который отдаем
      //   tokenOut: isBuy ? this.swap.tokens.token1.address : this.swap.tokens.token0.address, // токен, который получаем
      //   fee: 500, // комиссия пула TODO: брать из пула
      //   recipient: wallet.address,
      //   deadline: deadline,
      //   amountIn: isBuy ? this.swap.amount0 : -this.swap.amount1, // сумма, которую отдаем
      //   amountOutMinimum: isBuy // минимальная сумма, которую получим
      //     ? (-this.swap.amount1 * 99n) / 100n // 1% проскальзывания
      //     : (this.swap.amount0 * 99n) / 100n, // 1% проскальзывания
      //   sqrtPriceLimitX96: 0n, // без ограничения цены
      // }

      // const swapParams = {
      // tokenIn: isBuy ? this.swap.tokens.token0.address : this.swap.tokens.token1.address,
      // tokenOut: isBuy ? this.swap.tokens.token1.address : this.swap.tokens.token0.address,
      // fee: 500,
      // recipient: wallet.address,
      // deadline: deadline, // 20 минут
      // amountIn: isBuy ? this.swap.amount0 : -this.swap.amount1, // Всегда положительный
      // amountOutMinimum: isBuy
      //   ? (-this.swap.amount1 * (100n - slippage)) / 100n // Для покупки: amount1 (отрицательный) → инвертируем
      //   : (this.swap.amount0 * (100n - slippage)) / 100n, // Для продажи: amount0 (отрицательный) → инвертируем
      // sqrtPriceLimitX96: 0n,

      // tokenIn: isBuy ? this.swap.tokens.token0.address : this.swap.tokens.token1.address,
      // tokenOut: isBuy ? this.swap.tokens.token1.address : this.swap.tokens.token0.address,
      // fee: 500,
      // recipient: wallet.address,
      // deadline: deadline,
      // amountIn: isBuy ? this.swap.amount0 : -this.swap.amount0, // Фикс здесь!
      // amountOutMinimum: isBuy
      //   ? (-this.swap.amount1 * (100n - slippage)) / 100n
      //   : (this.swap.amount1 * (100n - slippage)) / 100n,
      // sqrtPriceLimitX96: 0n,

      // }
      // console.log(swapParams)

      if (isSellToken0 && replicateCommand.command === ReplicateDealCommand.SELL) {
        // в логе пул обслужил продажу token0 пользователем за token1
        const swapParams = {
          recipient: wallet.address,
          zeroForOne: true, // направление обмена: token0 -> token1, отдаем token0, получаем token1
          amountSpecified: 200n, // сколько отдаем token0
          sqrtPriceLimitX96: 0n,
          data: "0x",
        }
        // куплен token0 за token1
        // console.log(replicateCommand)
        // запустить покупку
        // const swapParams = {
        //   tokenIn: this.swap.tokens.token0.address, // токен, который отдаем
        //   tokenOut: this.swap.tokens.token1.address, // токен, который получаем
        //   fee: 500, // комиссия пула TODO: брать из пула
        //   recipient: wallet.address,
        //   deadline: deadline,
        //   amountIn: this.swap.amount0, // сумма, которую отдаем
        //   amountOutMinimum: (-this.swap.amount1 * 99n) / 100n, // минимальная сумма, которую получим (с учётом проскальзывания)
        //   sqrtPriceLimitX96: 0n,
        // }
        // const swapParams = {
        //   walletAddress: wallet.address, // из replicateCommand
        //   tokenIn: this.swap.tokens.token0.address,
        //   tokenOut: this.swap.tokens.token1.address,
        //   amountIn: -this.swap.amount0, // 8007872n (делаем положительным)
        //   amountOutMinimum: (this.swap.amount0 * (100n - slippage)) / 100n, // 43478401973648084012n * 0.99
        //   deadline: deadline,
        //   poolAddress: this.swap.poolAddress,
        //   sqrtPriceLimitX96: 0n, // или можно использовать this.swap.sqrtPriceX96
        // }
        // console.log(swapParams)
      }
      if (isBuyToken0 && replicateCommand.command === ReplicateDealCommand.BUY) {
        // в логе пул обслужил покупку token0 пользователем за token1
        const swapParams = {
          recipient: wallet.address,
          zeroForOne: false, // направление обмена: token1 -> token0, отдаем token1, получаем token0
          amountSpecified: -200n, // сколько отдаем token1
          sqrtPriceLimitX96: 0n,
          data: "0x",
        }

        // продан token0 за token1
        // console.log(`Selling ${isSell ? this.swap.tokens.token0.symbol : this.swap.tokens.token1.symbol} for ${isSell ? this.swap.tokens.token1.symbol : this.swap.tokens.token0.symbol}`);
        // console.log("isSell " + isSell)
        // console.log(replicateCommand)
        // запустить продажу
        // const swapParams = {
        //   tokenIn: this.swap.tokens.token1.address, // токен, который отдаем
        //   tokenOut: this.swap.tokens.token0.address, // токен, который получаем
        //   fee: 500, // комиссия пула TODO: брать из пула
        //   recipient: wallet.address,
        //   deadline: deadline,
        //   amountIn: this.swap.amount1, // сумма, которую получим
        //   amountInMaximum: (-this.swap.amount0 * 99n) / 100n, // минимальная сумма, которую получим (с учётом проскальзывания)
        //   sqrtPriceLimitX96: 0n,
        // }
        // const swapParams = {
        //   walletAddress: wallet.address, // из replicateCommand
        //   tokenIn: this.swap.tokens.token0.address, // WPOL
        //   tokenOut: this.swap.tokens.token1.address, // USDT
        //   amountIn: -this.swap.amount0, // 219806287992197147887n (делаем положительным)
        //   amountOutMinimum: (this.swap.amount1 * (100n - slippage)) / 100n, // 40509172n * 0.99
        //   deadline: deadline,
        //   poolAddress: this.swap.poolAddress,
        //   sqrtPriceLimitX96: 0n, // или можно использовать this.swap.sqrtPriceX96
        // }
        // console.log(swapParams)
      }
    }

    // const users = this.userService.getUsers(this.swap.users)
    // this.swap.users
    // USDC/WETH
    // token0: USDC (стабильная монета)
    // token1: WETH (Wrapped ETH)

    // const trade = new Trade(route, amountIn, TradeType.EXACT_INPUT)
    // const { calldata, value } = SwapRouter.swapCallParameters(trade)

    // TODO: сделать простой случай покупка / продажа за туже валюту
    // TODO: случай покупка / продажа за нативную валюту - найти в uniswap такой swap
    // TODO: покупка / продажа последовательно MATIC -> USDC -> WETH

    if (isSellToken0) {
      // куплен token1 за token0
      // получить и проверить баланс token0 у пользователя
      // если денег хватает провести транзакцию
    } else if (isBuyToken0) {
      // продан token1 за token0
    } else return null

    // TODO: продолжить
    return null
  }
}
