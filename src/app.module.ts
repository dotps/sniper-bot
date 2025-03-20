import { Module } from "@nestjs/common"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { configModule } from "./config/config"
import { databaseProvider } from "./providers/database.provider"
import { BotsModule } from "./bots/bots.module"
import { ConsoleLogger } from "./Utils/ConsoleLogger"
import { Logger } from "./Utils/Logger"

Logger.init(new ConsoleLogger(true))

@Module({
  imports: [configModule, databaseProvider, BotsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
