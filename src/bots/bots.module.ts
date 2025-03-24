import { Module } from "@nestjs/common"
import { BotsController } from "./bots.controller"
import { BotsService } from "./bots.service"
import { TelegramApiProvider } from "../providers/bots/telegram/TelegramApiProvider"
import { WebRequestFetchService } from "../providers/WebRequestFetchService"
import { BotProvider } from "../providers/bots/BotProvider"
import { UserModule } from "../users/user.module"
import { VkApiProvider } from "../providers/bots/vk/VkApiProvider"

const webRequestService = new WebRequestFetchService()

// TODO: реализовать регистрацию ботов telegram, vk в  сервис локаторе?
// TODO: переписать бота используя возможности nest

const telegramBot = {
  provide: TelegramApiProvider,
  useFactory: () => {
    return new TelegramApiProvider(webRequestService)
  },
}

const vkBot = {
  provide: VkApiProvider,
  useFactory: () => {
    return new VkApiProvider(webRequestService)
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
  providers: [telegramBot, vkBot, BotsService],
})
export class BotsModule {}
