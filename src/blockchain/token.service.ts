import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Token } from "./token.entity"
import { TokenDto } from "./token.dto"
import { ResponseBotError } from "../errors/ResponseBotError"

@Injectable()
export class TokenService {
  private readonly maxTokenAmountForUser: number = 5

  constructor(
    @InjectRepository(Token)
    private readonly repository: Repository<Token>,
  ) {}

  async addToken(tokenDto: TokenDto): Promise<Token> {
    const currentToken = await this.repository.findOneBy({ address: tokenDto.address, userId: tokenDto.userId })
    if (currentToken) throw new ResponseBotError("Такой токен уже добавлен.")

    const tokenAmount = await this.repository.countBy({ userId: tokenDto.userId })
    if (tokenAmount >= this.maxTokenAmountForUser)
      throw new ResponseBotError("Максимальное количество токенов " + this.maxTokenAmountForUser)

    return await this.createToken(tokenDto)
  }

  async createToken(tokenDto: TokenDto): Promise<Token> {
    const token = this.repository.create(tokenDto)
    return await this.repository.save(token)
  }

  async getUserTokens(userId: number): Promise<Token[]> {
    return await this.repository.findBy({ userId })
  }
}
