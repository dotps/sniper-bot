import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { User } from "./user.entity"
import { BotType } from "../providers/bots/IBotProvider"

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async isUserExist(userId: number, botType: BotType): Promise<boolean> {
    const user = await this.repository.findOneBy({ userId, botType })
    return user ? true : false
  }

  async getUser(userId: number, botType: BotType): Promise<User | null> {
    return await this.repository.findOneBy({ userId, botType })
  }

  async createUser(user: User): Promise<User> {
    // const user = this.repository.create(data)
    // const user = this.repository.create([data])
    return await this.repository.save(user)
  }

  // async getUser(id: number): Promise<User> {
  //   const user = await this.repository.findOneBy({ id })
  //   if (!user) throw new NotFoundException(Errors.displayId(id) + ErrorsMessages.USER_NOT_FOUND)
  //   return user
  // }
  //
  // async getUserByName(name: string): Promise<User> {
  //   const user = await this.repository.findOneBy({ name: name.trim() })
  //   if (!user) throw new NotFoundException(ErrorsMessages.USER_NOT_FOUND)
  //   return user
  // }
  //
  // async updateUser(id: number, data: UserDto): Promise<User> {
  //   const result = await this.repository.update(id, data)
  //   if (!result.affected) throw new NotFoundException(Errors.displayId(id) + ErrorsMessages.NOT_FOUND)
  //   return await this.getUser(id)
  // }
  //
  // async getAll(): Promise<User[]> {
  //   return this.repository.find()
  // }
  //
  // async deleteUser(id: number): Promise<void> {
  //   const result = await this.repository.delete(id)
  //   if (!result.affected) throw new NotFoundException(Errors.displayId(id) + ErrorsMessages.NOT_FOUND)
  // }
}
