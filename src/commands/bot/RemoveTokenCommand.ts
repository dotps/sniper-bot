import { ICommand } from "../infrastructure/ICommand"
import { ResponseData } from "../../data/ResponseData"
import { Command } from "../infrastructure/BotCommandHandler"
import { User } from "../../users/user.entity"
import { TokenService } from "../../blockchain/token.service"
import { TokenDto } from "../../blockchain/token.dto"
import { Hex, isAddress } from "viem"
import { BotCommands } from "./BotCommands"
import { ErrorHandler } from "../../errors/ErrorHandler"

export class RemoveTokenCommand implements ICommand {
  private readonly tokenService: TokenService
  private readonly commandData: Command
  private readonly user: User
  private readonly messages = {
    NEED_TOKEN: `Требуется адрес токена или all для удаления всех токенов из списка.\n${BotCommands.REMOVE_TOKEN} адрес_токена\n${BotCommands.REMOVE_TOKEN} all`,
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

    try {
      const canRemoveAllTokens = tokenAddress === this.removeAllTokensCommand
      const successMessage = canRemoveAllTokens ? this.messages.SUCCESS_ALL : this.messages.SUCCESS

      if (canRemoveAllTokens) {
        await this.tokenService.removeAllTokens(this.user.id)
      } else {
        if (!isAddress(tokenAddress)) return new ResponseData(this.messages.NEED_TOKEN)
        await this.tokenService.removeToken(tokenAddress, this.user.id)
      }
      return new ResponseData(successMessage)
    } catch (error) {
      return ErrorHandler.handleAndResponse(error)
    }
  }
}
