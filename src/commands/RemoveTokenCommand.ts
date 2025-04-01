import { ICommand } from "./ICommand"
import { ResponseData } from "../data/ResponseData"
import { Command } from "./CommandHandler"
import { User } from "../users/user.entity"
import { TokenService } from "../blockchain/token.service"
import { TokenDto } from "../blockchain/token.dto"
import { Hex } from "viem"
import { ResponseBotError } from "../errors/ResponseBotError"
import { Logger } from "../utils/Logger"
import { Commands } from "./Commands"

export class RemoveTokenCommand implements ICommand {
  private readonly tokenService: TokenService
  private readonly commandData: Command
  private readonly user: User
  private readonly messages = {
    NEED_TOKEN: `Требуется адрес токена или all для удаления всех токенов из списка.\n${Commands.REMOVE_TOKEN} адрес_токена\n${Commands.REMOVE_TOKEN} all`,
    SUCCESS: "Токен успешно удален.",
    SUCCESS_ALL: "Все токены успешно удалены.",
  } as const
  private readonly removeAllTokensCommand: string = "all"

  constructor(tokenService: TokenService, user: User, commandData: Command) {
    this.user = user
    this.tokenService = tokenService
    this.commandData = commandData
  }

  async execute(): Promise<ResponseData | null> {
    const response: string[] = []
    const [tokenAddress] = this.commandData.params || []

    try {
      if (!tokenAddress) return new ResponseData(this.messages.NEED_TOKEN)
      if (tokenAddress === this.removeAllTokensCommand) {
        if (await this.tokenService.removeAllTokens(this.user.id)) {
          response.push(this.messages.SUCCESS_ALL)
          return new ResponseData(response)
        }
      }

      const tokenDto: TokenDto = {
        balance: 0,
        address: tokenAddress as Hex,
        userId: this.user.id,
      }

      if (await this.tokenService.removeToken(tokenDto)) {
        response.push(this.messages.SUCCESS)
      }
    } catch (error) {
      if (error instanceof ResponseBotError) response.push(error.message)
      else Logger.error(error)
    }
    return new ResponseData(response)
  }
}
