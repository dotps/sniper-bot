import { BotType } from "src/bots/infrastructure/bot-provider.interface"
import { Entity, Column, OneToMany } from "typeorm"
import { Expose } from "class-transformer"
import { Token } from "../blockchain/token/token.entity"
import { FollowWallet } from "../blockchain/wallet/follow-wallet.entity"
import { Wallet } from "../blockchain/wallet/wallet.entity"
import { BaseEntity } from "../libs/entities/base.entity"

@Entity()
export class User extends BaseEntity {
  @Expose()
  @Column()
  readonly firstName: string

  @Expose()
  @Column()
  readonly lastName: string

  @Expose()
  @Column()
  readonly username: string

  @Expose()
  @Column()
  readonly chatId: number

  @Expose({ name: "userId" })
  @Column()
  readonly botUserId: number

  @Expose()
  @Column({
    type: "enum",
    enum: BotType,
    default: BotType.Telegram,
  })
  readonly botType: BotType

  @OneToMany(() => Token, (token) => token.user)
  tokens: Token[]

  @OneToMany(() => FollowWallet, (followWallet) => followWallet.user)
  followWallets: FollowWallet[]

  @OneToMany(() => Wallet, (wallet) => wallet.user)
  wallets: Wallet[]
}
