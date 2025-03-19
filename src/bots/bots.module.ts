import { Module } from "@nestjs/common"
import { BotsController } from "./bots.controller"
// import { BotsService } from "./bots.service"
import { TelegramApiProvider } from "../providers/bots/telegram/TelegramApiProvider"

// TODO: закинуть экземпляр TelegramApiProvider
// TODO: через интерфейс получится?
// const telegramApiProvider = {
//   provide: "IBotProvider",
//   useClass: TelegramApiProvider
// }

@Module({
  controllers: [BotsController],
  providers: [TelegramApiProvider],
})
export class BotsModule {}
