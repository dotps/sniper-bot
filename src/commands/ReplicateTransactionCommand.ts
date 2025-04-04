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
    private readonly transaction: unknown,
  ) {}

  async execute(): Promise<ResponseData | null> {
    console.log(">>>>>>>>>>>", this.walletAddress)
    // TODO: продолжить
    return null
  }
}
