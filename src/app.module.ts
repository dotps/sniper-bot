import { Module } from "@nestjs/common"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { configModule } from "./config/config"
import { databaseProvider } from "./providers/database.provider"
import { BotsModule } from "./bots/bots.module"
import { ConsoleLogger } from "./utils/ConsoleLogger"
import { Logger } from "./utils/Logger"
import { BlockchainModule } from "./blockchain/blockchain.module"

Logger.init(new ConsoleLogger(true))

@Module({
  imports: [configModule, databaseProvider, BotsModule, BlockchainModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
