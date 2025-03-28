import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Token } from "./token.entity"
import { TokenDto } from "./token.dto"

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Token)
    private readonly repository: Repository<Token>,
  ) {}

  async addToken(tokenDto: TokenDto): Promise<Token> {
    const token = this.repository.create(tokenDto)
    return await this.repository.save(token)
  }
}
