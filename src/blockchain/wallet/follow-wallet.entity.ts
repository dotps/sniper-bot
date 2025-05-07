import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Unique } from "typeorm"
import { Hex } from "viem"
import { User } from "../../users/user.entity"

@Entity()
@Unique(["wallet", "userId"])
export class FollowWallet {
  @PrimaryGeneratedColumn()
  readonly id: number

  @Column()
  readonly wallet: Hex

  @Column({ nullable: false })
  userId: number

  @ManyToOne(() => User, (user) => user.followWallets)
  user: User
}
