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
    TOKEN_LIST: "Список токенов:\n",
    ADDED: "Токен успешно добавлен.",
    NEED_TOKEN: "Укажите токен. " + Commands.ADD_TOKEN + " адрес_токена",
  } as const

  constructor(tokenService: TokenService, user: User, commandData: Command) {
    this.user = user
    this.tokenService = tokenService
    this.commandData = commandData
  }

  async execute(): Promise<ResponseData | null> {
    const response: string[] = []

    // TODO: сделать команду /removetoken

    // if (!this.commandData.params) return new ResponseData(this.messages.NEED_TOKEN)
    //
    // const [tokenAddress] = this.commandData.params
    // const tokenDto: TokenDto = {
    //   balance: 0,
    //   address: tokenAddress as Hex,
    //   userId: this.user.id,
    // }

    // try {
    //   await this.tokenService.addToken(tokenDto)
    //   const tokens = await this.tokenService.getUserTokens(this.user.id)
    //   const addresses = tokens.map((token) => token.address).join("\n")
    //
    //   response.push(this.messages.ADDED)
    //   response.push(this.messages.TOKEN_LIST + addresses)
    // } catch (error) {
    //   if (error instanceof ResponseBotError) response.push(error.message)
    //   else Logger.error(error)
    // }
    return new ResponseData(response)
  }
}
