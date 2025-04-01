import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Unique } from "typeorm"
import { Hex } from "viem"
import { User } from "../users/user.entity"

@Entity()
@Unique(["address", "userId"])
export class Token {
  @PrimaryGeneratedColumn()
  readonly id: number

  @Column()
  readonly address: Hex

  @Column("decimal", { precision: 78, scale: 18 })
  readonly balance: number

  @Column({ nullable: false })
  userId: number

  @ManyToOne(() => User, (user) => user.tokens)
  user: User
}
