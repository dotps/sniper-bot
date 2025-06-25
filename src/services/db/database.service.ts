import { TypeOrmModule } from "@nestjs/typeorm"
import { ConfigService } from "@nestjs/config"
import { Config } from "../../config/config"
import { User } from "../../users/user.entity"
import { Token } from "../../blockchain/token/token.entity"
import { FollowWallet } from "../../blockchain/wallet/follow-wallet.entity"
import { Replicate } from "../../blockchain/replicate.entity"
import { Wallet } from "../../blockchain/wallet/wallet.entity"

export const databaseService = TypeOrmModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    type: "postgres",
    url: configService.get<string>(Config.DatabaseUrl),
    entities: [User, Token, FollowWallet, Replicate, Wallet],
    synchronize: true,
    logging: false,
  }),
  inject: [ConfigService],
})
