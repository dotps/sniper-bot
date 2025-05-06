import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Unique } from "typeorm"
import { User } from "../users/user.entity"
import { ReplicateDealCommand } from "../commands/bot/ReplicateCommand"
import { Token } from "./token.entity"

@Entity()
@Unique(["command", "userId", "token", "limit"])
export class Replicate {
  @PrimaryGeneratedColumn()
  readonly id: number

  @Column("bigint")
  readonly limit: bigint

  @Column({ nullable: false })
  userId: number

  @ManyToOne(() => User, (user) => user.tokens)
  user: User

  @Column({
    type: "enum",
    enum: ReplicateDealCommand,
    default: ReplicateDealCommand.BUY,
  })
  readonly command: ReplicateDealCommand

  @ManyToOne(() => Token, (token) => token.replicates)
  token: Token
}
