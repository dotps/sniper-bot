import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm"
import { Hex } from "viem"
import { User } from "../users/user.entity"

@Entity()
export class Token {
  @PrimaryGeneratedColumn()
  readonly id: number

  @Column()
  readonly address: Hex

  @Column()
  readonly balance: number

  @Column({ nullable: false })
  userId: number

  @ManyToOne(() => User, (user) => user.tokens)
  user: User
}
