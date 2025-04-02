import { ICommand } from "./infrastructure/ICommand"
import { ResponseData } from "../data/ResponseData"
import { Command } from "./infrastructure/CommandHandler"
import { User } from "../users/user.entity"
import { isAddress } from "viem"
import { Commands } from "./Commands"
import { ErrorHandler } from "../errors/ErrorHandler"
import { WalletService } from "../blockchain/wallet.service"

export class SendCommand implements ICommand {
  private readonly messages = {
    NEED_FROM_ADDRESS: `Требуется адрес токена.\n${Commands.SEND} адрес_токена сумма адрес_получателя`,
    NEED_TO_ADDRESS: `Требуется адрес получателя.\n${Commands.SEND} адрес_токена сумма адрес_получателя`,
    NEED_AMOUNT: `Требуется сумма для перевода.\n${Commands.SEND} адрес_токена сумма адрес_получателя`,
    SUCCESS: "Перевод на кошелек успешно проведен.",
  } as const

  constructor(
    private readonly walletService: WalletService,
    private readonly user: User,
    private readonly commandData: Command,
  ) {}

  async execute(): Promise<ResponseData | null> {
    const [fromAddress, amount, toAddress] = this.commandData.params || []
    const transferAmount = Number(amount) || 0

    if (!fromAddress || !isAddress(fromAddress)) return new ResponseData(this.messages.NEED_FROM_ADDRESS)
    if (!toAddress || !isAddress(toAddress)) return new ResponseData(this.messages.NEED_TO_ADDRESS)
    if (!transferAmount) return new ResponseData(this.messages.NEED_AMOUNT)

    try {
      await this.walletService.send(fromAddress, toAddress, transferAmount, this.user.id)
      return new ResponseData(this.messages.SUCCESS)
    } catch (error) {
      return ErrorHandler.handleAndResponse(error)
    }
  }
}
