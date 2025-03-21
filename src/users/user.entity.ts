import { BotType } from "src/providers/bots/IBotProvider"
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  readonly id: number

  @Column()
  readonly firstName: string

  @Column()
  readonly lastName: string

  @Column()
  readonly username: string

  @Column()
  readonly chatId: number

  @Column()
  readonly userId: number

  @Column({
    type: "enum",
    enum: BotType,
    default: BotType.TELEGRAM,
  })
  readonly botType: BotType

  @Column({ default: "ru" })
  readonly languageCode: string
}
