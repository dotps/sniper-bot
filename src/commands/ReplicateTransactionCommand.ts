import { ICommand } from "./infrastructure/ICommand"
import { ResponseData } from "../data/ResponseData"
import { Commands } from "./Commands"
import { BlockchainService } from "../blockchain/blockchain.service"
import { Hex } from "viem"

export class ReplicateTransactionCommand implements ICommand {
  private readonly messages = {
    WRONG_COMMAND: `Неверные параметры команды.\nПример: ${Commands.REPLICATE} buy/sell лимит_суммы`,
    SUCCESS: "Повторные сделки подключены.",
  } as const

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly walletAddress: Hex,
    private readonly walletUsers: number[],
    private readonly transaction: any,
  ) {}

  async execute(): Promise<ResponseData | null> {
    const client = this.blockchainService.getClient()
    // const code = await client.getCode({ address: this.transaction.to })
    // console.log(code)
    // const isTokenContract = code && code !== "0x"

    console.log(">>>>>>>>>>>", this.walletAddress)
    console.log(">>>>>>>>>>>", this.transaction)
    // TODO: продолжить
    return null
  }
}
