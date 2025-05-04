import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Unique, Relation } from "typeorm"
import { Hex } from "viem"
import { User } from "../users/user.entity"
import { forwardRef } from "@nestjs/common"

@Entity()
@Unique(["wallet", "userId"])
// TODO: переименовать в Subscribes
export class FollowWallet {
  @PrimaryGeneratedColumn()
  readonly id: number

  @Column()
  readonly wallet: Hex

  @Column({ nullable: false })
  userId: number

  @ManyToOne(() => User, (user) => user.followWallets)
  user: User

  // TODO: разобраться с циклическими зависимостями для компилятора swc

  // @ManyToOne(() => User, (user) => user.followWallets)
  // user: Relation<User>
}
