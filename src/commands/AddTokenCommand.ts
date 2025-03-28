import { ICommand } from "./ICommand"
import { ResponseData } from "../data/ResponseData"
import { Command } from "./CommandHandler"
import { User } from "../users/user.entity"
import { Commands } from "./Commands"
import { TokenService } from "../blockchain/token.service"
import { TokenDto } from "../blockchain/token.dto"
import { Hex } from "viem"

export class AddTokenCommand implements ICommand {
  private readonly tokenService: TokenService
  private readonly commandData: Command
  private readonly user: User
  private needTokenResponse: string = `Укажите токен. ${Commands.ADD_TOKEN} адрес_токена`

  constructor(tokenService: TokenService, user: User, commandData: Command) {
    this.user = user
    this.tokenService = tokenService
    this.commandData = commandData
  }

  async execute(): Promise<ResponseData | null> {
    const response: string[] = []

    if (!this.commandData.params) return new ResponseData(this.needTokenResponse)

    const [tokenAddress] = this.commandData.params
    const tokenDto: TokenDto = {
      balance: 0,
      address: tokenAddress as Hex,
      userId: this.user.id,
    }

    const token = await this.tokenService.addToken(tokenDto)
    console.log(token)
    // TODO: 5 токенов на пользователя + проверка на дубль

    return new ResponseData(response)
  }
}

export enum StartCommandMessages {
  EXIST = "Вы уже зарегистрированы в сервисе.",
  SUCCESS = "Регистрация в сервисе прошла успешно.",
  ERROR = "Ошибка регистрации. Попробуйте позже.",
}
