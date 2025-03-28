import { Module } from "@nestjs/common"
import { BotsController } from "./bots.controller"
import { BotsService } from "./bots.service"
import { TelegramApiProvider } from "../providers/bots/telegram/TelegramApiProvider"
import { WebRequestFetchService } from "../providers/WebRequestFetchService"
import { UserModule } from "../users/user.module"
import { VkApiProvider } from "../providers/bots/vk/VkApiProvider"
import { UserService } from "../users/user.service"
import { CommandFactory } from "../commands/CommandFactory"
import { CommandHandler } from "../commands/CommandHandler"
import { TokenService } from "../blockchain/token.service"
import { TypeOrmModule } from "@nestjs/typeorm"
import { User } from "../users/user.entity"
import { Token } from "../blockchain/token.entity"

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
  useFactory: (userService: UserService, tokenService: TokenService) => {
    return new CommandFactory(userService, tokenService)
  },
  inject: [UserService, TokenService],
}

const commandHandler = {
  provide: CommandHandler,
  useFactory: (commandFactory: CommandFactory, userService: UserService) => {
    return new CommandHandler(commandFactory, userService)
  },
  inject: [CommandFactory, UserService],
}

@Module({
  imports: [UserModule, TypeOrmModule.forFeature([Token])],
  controllers: [BotsController],
  providers: [telegramBot, vkBot, BotsService, commandFactory, commandHandler, TokenService],
})
export class BotsModule {}
