import { Module } from "@nestjs/common"
import { BotsController } from "./bots.controller"
import { BotsService } from "./bots.service"
import { TelegramApiProvider } from "./telegram/telegram-api.provider"
import { WebRequestFetchService } from "../services/web-request/web-request-fetch.service"
import { UserModule } from "../users/user.module"
import { VkApiProvider } from "./vk/vk-api.provider"
import { UserService } from "../users/user.service"
import { BotCommandFactory } from "../commands/infrastructure/bot-command.factory"
import { BotCommandHandler } from "../commands/infrastructure/bot-command.handler"
import { TokenService } from "../blockchain/token/token.service"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Token } from "../blockchain/token/token.entity"
import { WalletService } from "../blockchain/wallet/wallet.service"
import { FollowWallet } from "../blockchain/wallet/follow-wallet.entity"
import { Replicate } from "../blockchain/replicate.entity"
import { Wallet } from "../blockchain/wallet/wallet.entity"
import { BlockchainService } from "../blockchain/blockchain.service"
import { BlockchainModule } from "../blockchain/blockchain.module"
import { SwapObserverService } from "../blockchain/swap-observer.service"
import { EventEmitterModule } from "@nestjs/event-emitter"
import { ConfigModule, ConfigService } from "@nestjs/config"

const webRequestService = new WebRequestFetchService()

const telegramBot = {
  provide: TelegramApiProvider,
  useFactory: (configService: ConfigService) => {
    return new TelegramApiProvider(webRequestService, configService)
  },
  inject: [ConfigService],
}

const vkBot = {
  provide: VkApiProvider,
  useFactory: (configService: ConfigService) => {
    return new VkApiProvider(webRequestService, configService)
  },
  inject: [ConfigService],
}

const commandFactory = {
  provide: BotCommandFactory,
  useFactory: (
    userService: UserService,
    tokenService: TokenService,
    walletService: WalletService,
    blockchainService: BlockchainService,
  ) => {
    return new BotCommandFactory(
      userService,
      tokenService,
      walletService,
      blockchainService,
      blockchainService.getTokenService(),
    )
  },
  inject: [UserService, TokenService, WalletService, BlockchainService],
}

const commandHandler = {
  provide: BotCommandHandler,
  useFactory: (commandFactory: BotCommandFactory, userService: UserService) => {
    return new BotCommandHandler(commandFactory, userService)
  },
  inject: [BotCommandFactory, UserService],
}

@Module({
  imports: [
    UserModule,
    BlockchainModule,
    TypeOrmModule.forFeature([Token, FollowWallet, Replicate, Wallet]),
    EventEmitterModule.forRoot(),
    ConfigModule,
  ],
  controllers: [BotsController],
  providers: [
    telegramBot,
    vkBot,
    BotsService,
    commandFactory,
    commandHandler,
    TokenService,
    WalletService,
    SwapObserverService,
    ConfigService,
  ],
})
export class BotsModule {}
