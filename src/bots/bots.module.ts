import { Module } from "@nestjs/common"
import { BotsController } from "./bots.controller"
import { BotsService } from "./bots.service"
import { TelegramApiProvider } from "../providers/bots/telegram/TelegramApiProvider"
import { WebRequestFetchService } from "../providers/WebRequestFetchService"
import { BotProvider } from "../providers/bots/BotProvider"
import { UserModule } from "../users/user.module"

const webRequestService = new WebRequestFetchService()

// TODO: реализовать регистрацию ботов telegram, vk в  сервис локаторе?
// TODO: переписать бота используя возможности nest

const botProvider = {
  provide: BotProvider,
  useFactory: () => {
    return new TelegramApiProvider(webRequestService)
  },
}

// const commandFactory = new CommandFactory()
// const commandHandler = {
//   provide: CommandHandler,
//   useFactory: () => {
//     return new CommandHandler(commandFactory)
//   },
// }

@Module({
  // imports: [forwardRef(() => UserModule)],
  imports: [UserModule],
  controllers: [BotsController],
  // providers: [botProvider, commandHandler, BotsService],
  providers: [botProvider, BotsService],
})
export class BotsModule {}
