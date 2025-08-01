import { Module } from "@nestjs/common"
import { configModule } from "./libs/config/config"
import { databaseService } from "./libs/repository/database.service"
import { BotsModule } from "./bots/bots.module"
import { ConsoleLogger } from "./libs/core/logger/console-logger"
import { Logger } from "./libs/core/logger/logger"
import { BlockchainModule } from "./blockchain/blockchain.module"
import { EventEmitterModule } from "@nestjs/event-emitter"

Logger.init(new ConsoleLogger(true))

@Module({
  imports: [configModule, databaseService, BotsModule, BlockchainModule, EventEmitterModule.forRoot()],
})
export class AppModule {}
