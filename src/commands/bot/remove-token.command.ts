import { ICommand } from "../infrastructure/command.interface"
import { BotResponseData } from "../../bots/infrastructure/bot-response-data"
import { Command } from "../infrastructure/bot-command.handler"
import { User } from "../../users/user.entity"
import { TokenService } from "../../blockchain/token/token.service"
import { isAddress } from "viem"
import { BotCommands } from "./bot-commands"
import { ErrorHandler } from "../../errors/error.handler"

export class RemoveTokenCommand implements ICommand {
  private readonly tokenService: TokenService
  private readonly commandData: Command
  private readonly user: User
  private readonly messages = {
    NEED_TOKEN: `Требуется адрес токена или all для удаления всех токенов из списка.\n${BotCommands.REMOVE_TOKEN} адрес_токена\n${BotCommands.REMOVE_TOKEN} all`,
    SUCCESS: "Токен успешно удален.",
    SUCCESS_ALL: "Все токены успешно удалены.",
  } as const
  private readonly removeAllTokensCommand: string = "all"

  constructor(tokenService: TokenService, user: User, commandData: Command) {
    this.user = user
    this.tokenService = tokenService
    this.commandData = commandData
  }

  async execute(): Promise<BotResponseData | null> {
    let [tokenAddress] = this.commandData.params || []
    if (!tokenAddress) return new BotResponseData(this.messages.NEED_TOKEN)

    tokenAddress = tokenAddress.toLowerCase()

    try {
      const canRemoveAllTokens = tokenAddress === this.removeAllTokensCommand
      const successMessage = canRemoveAllTokens ? this.messages.SUCCESS_ALL : this.messages.SUCCESS

      if (canRemoveAllTokens) {
        await this.tokenService.removeAllTokens(this.user.id)
      } else {
        if (!isAddress(tokenAddress)) return new BotResponseData(this.messages.NEED_TOKEN)
        await this.tokenService.removeToken(tokenAddress, this.user.id)
      }
      return new BotResponseData(successMessage)
    } catch (error) {
      return ErrorHandler.handleAndResponse(error)
    }
  }
}
