import { Entity, Column, ManyToOne, Unique } from "typeorm"
import { Hex } from "viem"
import { User } from "../../users/user.entity"
import { BaseEntity } from "../../libs/entities/base.entity"

@Entity()
@Unique(["address", "userId"])
export class Wallet extends BaseEntity {
  @Column()
  readonly encryptedKey: string

  @Column()
  readonly address: Hex

  @Column({ nullable: false })
  userId: number

  @ManyToOne(() => User, (user) => user.wallets)
  user: User
}
