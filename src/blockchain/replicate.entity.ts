import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Unique } from "typeorm"
import { User } from "../users/user.entity"
import { ReplicateDealCommand } from "../commands/bot/replicate.command"
import { Token } from "./token/token.entity"
import { BaseEntity } from "../libs/entities/base.entity"

@Entity()
@Unique(["command", "userId", "token", "limit"])
export class Replicate extends BaseEntity {
  @Column("bigint")
  readonly limit: bigint

  @Column({ nullable: false })
  userId: number

  @ManyToOne(() => User, (user) => user.tokens)
  user: User

  @Column({
    type: "enum",
    enum: ReplicateDealCommand,
    default: ReplicateDealCommand.Buy,
  })
  readonly command: ReplicateDealCommand

  @ManyToOne(() => Token, (token) => token.replicates)
  token: Token
}
