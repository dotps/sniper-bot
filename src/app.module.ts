import { Module } from "@nestjs/common"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { configModule } from "./config/config"
import { databaseService } from "./services/db/database.service"
import { BotsModule } from "./bots/bots.module"
import { ConsoleLogger } from "./services/logger/ConsoleLogger"
import { Logger } from "./services/logger/Logger"
import { BlockchainModule } from "./blockchain/blockchain.module"
import { EventEmitterModule } from "@nestjs/event-emitter"

Logger.init(new ConsoleLogger(true))

@Module({
  imports: [configModule, databaseService, BotsModule, BlockchainModule, EventEmitterModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
