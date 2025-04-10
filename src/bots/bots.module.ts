import { forwardRef, Module } from "@nestjs/common"
import { BotsController } from "./bots.controller"
import { BotsService } from "./bots.service"
import { TelegramApiProvider } from "../providers/bots/telegram/TelegramApiProvider"
import { WebRequestFetchService } from "../providers/WebRequestFetchService"
import { UserModule } from "../users/user.module"
import { VkApiProvider } from "../providers/bots/vk/VkApiProvider"
import { UserService } from "../users/user.service"
import { CommandFactory } from "../commands/infrastructure/CommandFactory"
import { CommandHandler } from "../commands/infrastructure/CommandHandler"
import { TokenService } from "../blockchain/token.service"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Token } from "../blockchain/token.entity"
import { WalletService } from "../blockchain/wallet.service"
import { FollowWallet } from "../blockchain/follow-wallet.entity"
import { Replicate } from "../blockchain/replicate.entity"
import { Wallet } from "../blockchain/wallet.entity"
import { BlockchainService } from "../blockchain/blockchain.service"
import { BlockchainModule } from "../blockchain/blockchain.module"
import { SwapObserverService } from "../blockchain/swap-observer.service"

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
  useFactory: (
    userService: UserService,
    tokenService: TokenService,
    walletService: WalletService,
    blockchainService: BlockchainService,
  ) => {
    return new CommandFactory(userService, tokenService, walletService, blockchainService)
  },
  inject: [UserService, TokenService, WalletService, BlockchainService],
}

const commandHandler = {
  provide: CommandHandler,
  useFactory: (commandFactory: CommandFactory, userService: UserService) => {
    return new CommandHandler(commandFactory, userService)
  },
  inject: [CommandFactory, UserService],
}

// TODO: раскидать по разным модулям? что-то тут много всего (часть перенести в AppModule)
@Module({
  imports: [
    UserModule,
    BlockchainModule,
    BlockchainModule,
    TypeOrmModule.forFeature([Token, FollowWallet, Replicate, Wallet]),
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
    // TransactionObserverService,
    SwapObserverService,
  ],
})
export class BotsModule {}
