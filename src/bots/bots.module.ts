import { Module } from "@nestjs/common"
import { BotsController } from "./bots.controller"
// import { BotsService } from "./bots.service"
import { TelegramApiProvider } from "../providers/bots/telegram/TelegramApiProvider"
import { WebRequestFetchService } from "../providers/WebRequestFetchService"
import { Model } from "../Model/Model"
import { IBotProvider } from "../providers/bots/IBotProvider"

const model = new Model()
const webRequestService = new WebRequestFetchService()

const telegramApiProvider = {
  provide: IBotProvider,
  useFactory: () => {
    return new TelegramApiProvider(model, webRequestService)
  },
}

@Module({
  controllers: [BotsController],
  providers: [telegramApiProvider],
})
export class BotsModule {}
