import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { User } from "./user.entity"
import { BotType } from "../providers/bots/IBotProvider"
import { IBotResponseDto } from "../providers/bots/IBotResponseDto"
import { plainToClass } from "class-transformer"

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async getUser(userId: number, botType: BotType): Promise<User | null> {
    return await this.repository.findOneBy({ botUserId: userId, botType })
  }

  async createUser(user: User): Promise<User> {
    return await this.repository.save(user)
  }

  createUnregisteredUser(data: IBotResponseDto): User {
    return plainToClass(User, data, { excludeExtraneousValues: true })
  }
}
