import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Unique, OneToMany } from "typeorm"
import { Hex } from "viem"
import { User } from "../users/user.entity"
import { Replicate } from "./replicate.entity"

@Entity()
@Unique(["address", "userId"])
export class Token {
  @PrimaryGeneratedColumn()
  readonly id: number

  @Column()
  readonly address: Hex

  @Column()
  readonly symbol: string

  // @Column("decimal", { precision: 78, scale: 18 })
  // readonly balance: number
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
