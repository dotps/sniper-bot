import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Unique } from "typeorm"
import { Hex } from "viem"
import { User } from "../../users/user.entity"

@Entity()
@Unique(["address", "userId"])
export class Wallet {
  @PrimaryGeneratedColumn()
  readonly id: number

  @Column()
  readonly encryptedKey: string

  @Column()
  readonly address: Hex

  @Column({ nullable: false })
  userId: number

  @ManyToOne(() => User, (user) => user.wallets)
  user: User
}
