import { Entity, Column, ManyToOne, Unique, OneToMany } from "typeorm"
import { Hex } from "viem"
import { User } from "../../users/user.entity"
import { Replicate } from "../replicate.entity"
import { BaseEntity } from "../../libs/entities/base.entity"

@Entity()
@Unique(["address", "userId"])
export class Token extends BaseEntity {
  @Column()
  address: Hex

  @Column()
  readonly symbol: string

  @Column("bigint")
  readonly balance: bigint

  @Column()
  readonly decimals: number

  @Column({ nullable: false })
  userId: number

  @ManyToOne(() => User, (user) => user.tokens)
  user: User

  @OneToMany(() => Replicate, (replicate) => replicate.token)
  replicates: Replicate[]
}
