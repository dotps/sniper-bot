import { TypeOrmModule } from "@nestjs/typeorm"
import { ConfigService } from "@nestjs/config"
import { Config } from "../config/config"
import { User } from "../users/user.entity"
import { Token } from "../blockchain/token.entity"

export const databaseProvider = TypeOrmModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    type: "postgres",
    url: configService.get<string>(Config.DATABASE_URL),
    entities: [User, Token],
    synchronize: true,
    logging: false,
  }),
  inject: [ConfigService],
})
