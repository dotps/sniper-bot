import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Token } from "./token.entity"
import { TokenDto } from "./token.dto"
import { ResponseBotError } from "../../errors/ResponseBotError"
import { Hex } from "viem"

@Injectable()
export class TokenService {
  private readonly maxTokenAmountForUser: number = 5
  private readonly messages = {
    TOKEN_EXIST: "Такой токен уже добавлен.",
    TOKEN_NOT_FOUND: "Токен не найден.",
    TOKENS_NOT_FOUND: "Токены не найдены.",
    MAX_AMOUNT_TOKENS: "Максимальное количество токенов ",
    ERROR: "Что-то пошло не так.",
  } as const

  constructor(
    @InjectRepository(Token)
    private readonly repository: Repository<Token>,
  ) {}

  async addToken(tokenDto: TokenDto): Promise<Token> {
    const currentToken = await this.repository.findOneBy({ address: tokenDto.address, userId: tokenDto.userId })
    if (currentToken) throw new ResponseBotError(this.messages.TOKEN_EXIST)

    const tokenAmount = await this.repository.countBy({ userId: tokenDto.userId })
    if (tokenAmount >= this.maxTokenAmountForUser)
      throw new ResponseBotError(this.messages.MAX_AMOUNT_TOKENS + this.maxTokenAmountForUser)

    return await this.createToken(tokenDto)
  }

  async createToken(tokenDto: TokenDto): Promise<Token> {
    const token = this.repository.create(tokenDto)
    return await this.repository.save(token)
  }

  async getUserTokens(userId: number): Promise<Token[]> {
    return await this.repository.findBy({ userId })
  }

  async removeToken(address: Hex, userId: number): Promise<boolean> {
    const result = await this.repository.delete({
      userId: userId,
      address: address,
    })

    if (!result || result.affected === 0) throw new ResponseBotError(this.messages.TOKEN_NOT_FOUND)
    return true
  }

  async removeAllTokens(userId: number): Promise<boolean> {
    const result = await this.repository.delete({ userId })

    if (!result || result.affected === 0) throw new ResponseBotError(this.messages.TOKENS_NOT_FOUND)
    return true
  }
}
