import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Unique } from "typeorm"
import { User } from "../users/user.entity"
import { ReplicateDealCommand } from "../commands/ReplicateCommand"

@Entity()
@Unique(["command", "userId", "limit"])
export class Replicate {
  @PrimaryGeneratedColumn()
  readonly id: number

  @Column("decimal", { precision: 78, scale: 18 })
  readonly limit: number

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
}
