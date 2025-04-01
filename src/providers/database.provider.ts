import { TypeOrmModule } from "@nestjs/typeorm"
import { ConfigService } from "@nestjs/config"
import { Config } from "../config/config"
import { User } from "../users/user.entity"
import { Token } from "../blockchain/token.entity"
import { FollowWallet } from "../blockchain/follow-wallet.entity"

export const databaseProvider = TypeOrmModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    type: "postgres",
    url: configService.get<string>(Config.DATABASE_URL),
    entities: [User, Token, FollowWallet],
    synchronize: true,
    logging: false,
  }),
  inject: [ConfigService],
})
