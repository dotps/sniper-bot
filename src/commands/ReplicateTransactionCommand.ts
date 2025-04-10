import { ICommand } from "./infrastructure/ICommand"
import { ResponseData } from "../data/ResponseData"
import { Commands } from "./Commands"
import { BlockchainService } from "../blockchain/blockchain.service"
import { Swap } from "../blockchain/swap-observer.service"

export class ReplicateTransactionCommand implements ICommand {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly swap: Swap,
  ) {}

  private readonly messages = {
    WRONG_COMMAND: `Неверные параметры команды.\nПример: ${Commands.REPLICATE} buy/sell лимит_суммы`,
    SUCCESS: "Повторные сделки подключены.",
  } as const

  async execute(): Promise<ResponseData | null> {
    console.log(this.swap)
    // const client = this.blockchainService.getClient()
    // const code = await client.getCode({ address: this.transaction.to })
    // console.log(code)
    // const isTokenContract = code && code !== "0x"

    // console.log(">>>>>>>>>>>", this.walletAddress)
    // console.log(">>>>>>>>>>>", this.transaction)
    // TODO: продолжить
    return null
  }
}
