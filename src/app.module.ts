import { Module } from "@nestjs/common"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { configModule } from "./config/config"
import { databaseProvider } from "./providers/database.provider"

@Module({
  imports: [configModule, databaseProvider],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
