import { BotType } from "src/providers/bots/IBotProvider"
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"
import { Expose } from "class-transformer"

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  readonly id: number

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

  @Expose()
  @Column()
  readonly userId: number

  @Expose()
  @Column({
    type: "enum",
    enum: BotType,
    default: BotType.TELEGRAM,
  })
  readonly botType: BotType
}
