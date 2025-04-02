import { ICommand } from "./infrastructure/ICommand"
import { ResponseData } from "../data/ResponseData"
import { Command } from "./infrastructure/CommandHandler"
import { User } from "../users/user.entity"
import { TokenService } from "../blockchain/token.service"
import { TokenDto } from "../blockchain/token.dto"
import { Hex } from "viem"
import { Commands } from "./Commands"
import { ErrorHandler } from "../errors/ErrorHandler"

export class RemoveTokenCommand implements ICommand {
  private readonly tokenService: TokenService
  private readonly commandData: Command
  private readonly user: User
  private readonly messages = {
    NEED_TOKEN: `Требуется адрес токена или all для удаления всех токенов из списка.\n${Commands.REMOVE_TOKEN} адрес_токена\n${Commands.REMOVE_TOKEN} all`,
    SUCCESS: "Токен успешно удален.",
    SUCCESS_ALL: "Все токены успешно удалены.",
  } as const
  private readonly removeAllTokensCommand: string = "all" // TODO: переделать как у ReplicateCommand

  constructor(tokenService: TokenService, user: User, commandData: Command) {
    this.user = user
    this.tokenService = tokenService
    this.commandData = commandData
  }

  async execute(): Promise<ResponseData | null> {
    const [tokenAddress] = this.commandData.params || []
    if (!tokenAddress) return new ResponseData(this.messages.NEED_TOKEN)
    // TODO: валидация формата токена

    try {
      const canRemoveAllTokens = tokenAddress === this.removeAllTokensCommand
      const successMessage = canRemoveAllTokens ? this.messages.SUCCESS_ALL : this.messages.SUCCESS

      if (canRemoveAllTokens) {
        await this.tokenService.removeAllTokens(this.user.id)
      } else {
        const tokenDto: TokenDto = {
          balance: 0,
          address: tokenAddress as Hex,
          userId: this.user.id,
        }
        await this.tokenService.removeToken(tokenDto)
      }
      return new ResponseData(successMessage)
    } catch (error) {
      return ErrorHandler.handleAndResponse(error)
    }
  }
}
