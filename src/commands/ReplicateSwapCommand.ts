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
    const isBuy = this.swap.amount0 > 0n && this.swap.amount1 < 0n // куплен token1 за token0
    const isSell = this.swap.amount0 < 0n && this.swap.amount1 > 0n // продан token1 за token0
    const deadline = Date.now() + 60 * 20 * 1000 // +20 минут
    const slippage = 1n

    for (const replicateCommand of replicates) {
      const wallet = replicateCommand.user.wallets[0]
      if (!wallet || !isAddress(wallet.address)) continue

      if (isSell) console.log("isSell " + isSell)
      else console.log("isBuy " + isBuy)
      // this.swap.tokens.token0.address

      // TODO: попробовать через uniswap sdk
      // TODO: добавить decimals

      const tokenIn = isBuy ? this.swap.tokens.token0 : this.swap.tokens.token1
      const tokenOut = isBuy ? this.swap.tokens.token1 : this.swap.tokens.token0
      const amountIn = isBuy ? this.swap.amount0 : this.swap.amount1

      const _tokenIn = new Token(
        137, //polygon.id
        tokenIn.address,
        tokenIn.decimals,
        tokenIn.symbol,
      )
      const _tokenOut = new Token(
        137, // polygon.id,
        tokenOut.address,
        tokenOut.decimals,
        tokenOut.symbol,
      )

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

      if (isBuy && replicateCommand.command === ReplicateDealCommand.BUY) {
        // куплен token1 за token0
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
      if (isSell && replicateCommand.command === ReplicateDealCommand.SELL) {
        // продан token1 за token0
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

    if (isBuy) {
      // куплен token1 за token0
      // получить и проверить баланс token0 у пользователя
      // если денег хватает провести транзакцию
    } else if (isSell) {
      // продан token1 за token0
    } else return null

    // TODO: продолжить
    return null
  }
}
