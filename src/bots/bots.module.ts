import { Module } from "@nestjs/common"
import { BotsController } from "./bots.controller"
import { BotsService } from "./bots.service"
import { TelegramApiProvider } from "../providers/bots/telegram/TelegramApiProvider"
import { WebRequestFetchService } from "../providers/WebRequestFetchService"
import { UserModule } from "../users/user.module"
import { VkApiProvider } from "../providers/bots/vk/VkApiProvider"
import { UserService } from "../users/user.service"
import { CommandFactory } from "../Commands/CommandFactory"
import { CommandHandler } from "../Commands/CommandHandler"

const webRequestService = new WebRequestFetchService()

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

const commandFactory = {
  provide: CommandFactory,
  useFactory: (userService: UserService) => {
    return new CommandFactory(userService)
  },
  inject: [UserService],
}

const commandHandler = {
  provide: CommandHandler,
  useFactory: (commandFactory: CommandFactory) => {
    return new CommandHandler(commandFactory)
  },
  inject: [CommandFactory],
}

@Module({
  imports: [UserModule],
  controllers: [BotsController],
  providers: [telegramBot, vkBot, BotsService, commandFactory, commandHandler],
})
export class BotsModule {}
