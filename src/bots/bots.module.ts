import { Module } from "@nestjs/common"
import { BotsController } from "./bots.controller"
import { BotsService } from "./bots.service"
import { TelegramApiProvider } from "../providers/bots/telegram/TelegramApiProvider"
import { WebRequestFetchService } from "../providers/WebRequestFetchService"
import { Model } from "../Model/Model"
import { BotProvider } from "../providers/bots/BotProvider"
import { CommandFactory } from "../Factory/CommandFactory"
import { CommandHandler } from "../Commands/CommandHandler"

const model = new Model()
const webRequestService = new WebRequestFetchService()

const botProvider = {
  provide: BotProvider,
  useFactory: () => {
    // return await TelegramApiProvider.create(model, webRequestService)
    return new TelegramApiProvider(model, webRequestService)
  },
}

const commandFactory = new CommandFactory(model)
const commandHandler = {
  provide: CommandHandler,
  useFactory: () => {
    return new CommandHandler(commandFactory)
  },
}

@Module({
  controllers: [BotsController],
  providers: [botProvider, commandHandler, BotsService],
})
export class BotsModule {}
