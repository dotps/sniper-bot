import { ICommand } from "./ICommand"
import { ResponseData } from "../data/ResponseData"
import { Command } from "./CommandHandler"
import { User } from "../users/user.entity"
import { TokenService } from "../blockchain/token.service"
import { ResponseBotError } from "../errors/ResponseBotError"
import { Logger } from "../utils/Logger"

export class GetTokenBalanceCommand implements ICommand {
  private readonly tokenService: TokenService
  private readonly commandData: Command
  private readonly user: User
  private readonly messages = {
    NOT_FOUND: "Токены не найдены.",
    CURRENT_BALANCE: "Текущий баланс:\n",
  } as const

  constructor(tokenService: TokenService, user: User, commandData: Command) {
    this.user = user
    this.tokenService = tokenService
    this.commandData = commandData
  }

  async execute(): Promise<ResponseData | null> {
    const response: string[] = []

    try {
      const tokens = await this.tokenService.getUserTokens(this.user.id)
      if (tokens.length === 0) return new ResponseData(this.messages.NOT_FOUND)
      const balanceMessage = tokens.map((token) => `${token.address}: ${token.balance}`).join("\n")
      response.push(this.messages.CURRENT_BALANCE + balanceMessage)
    } catch (error) {
      if (error instanceof ResponseBotError) response.push(error.message)
      else Logger.error(error)
    }
    return new ResponseData(response)
  }
}
