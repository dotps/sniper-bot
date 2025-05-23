import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication, ValidationPipe } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { UserModule } from "../src/users/user.module"
import { User } from "../src/users/user.entity"
import { UserService } from "../src/users/user.service"
import * as request from "supertest"
import { BotsModule } from "../src/bots/bots.module"
import { TelegramUpdatesDto } from "../src/bots/telegram/telegram-updates.dto"
import { BotType } from "../src/bots/infrastructure/IBotProvider"
import { BotCommands } from "../src/commands/bot/BotCommands"
import { Token } from "../src/blockchain/token/token.entity"
import { FollowWallet } from "../src/blockchain/wallet/follow-wallet.entity"
import { Replicate } from "../src/blockchain/replicate.entity"
import { Wallet } from "../src/blockchain/wallet/wallet.entity"
import { Logger } from "../src/services/logger/Logger"

jest.mock("../src/blockchain/blockchain.service", () => ({
  BlockchainService: jest.fn().mockImplementation(() => ({
    initBlockchainClients: jest.fn().mockResolvedValue(undefined),
    getSwapProvider: jest.fn().mockReturnValue({}),
    getClient: jest.fn().mockReturnValue({}),
    getTokenService: jest.fn().mockReturnValue({}),
  })),
}))

jest.mock("../src/blockchain/swap-observer.service", () => ({
  SwapObserverService: jest.fn().mockImplementation(() => ({
    updateObservedWallets: jest.fn().mockResolvedValue(undefined),
  })),
}))

describe("TelegramBot (интеграционный): ", () => {
  jest.setTimeout(30000)

  let app: INestApplication
  let userService: UserService
  let mockLog: jest.Mock

  beforeAll(async () => {
    mockLog = jest.fn((text) => {
      console.log("[LOG]", text)
    })
    Logger.init({
      isEnabled: () => true,
      log: mockLog,
      error: jest.fn(),
    })

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ".env",
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: "postgres",
            url: configService.get("DATABASE_URL"),
            entities: [User, Token, FollowWallet, Replicate, Wallet],
            synchronize: true,
          }),
          inject: [ConfigService],
        }),
        UserModule,
        BotsModule,
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    userService = moduleFixture.get<UserService>(UserService)

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => {
          console.error("Validation errors:", errors)
          return errors
        },
      }),
    )
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    console.log("======================================================================")
    console.log(expect.getState().currentTestName)
    // Очищаем моки перед каждым тестом
    jest.clearAllMocks()
  })

  describe("команда /start: ", () => {
    const mockTelegramUpdate = (text: string, userId: number): TelegramUpdatesDto => ({
      ok: true,
      result: [
        {
          update_id: 123456789,
          message: {
            message_id: 1,
            from: {
              id: userId,
              is_bot: false,
              first_name: "Test",
              last_name: "User",
              username: "testuser",
              language_code: "ru",
            },
            chat: {
              id: userId,
              first_name: "Test",
              last_name: "User",
              username: "testuser",
              type: "private",
            },
            date: Date.now(),
            text: text,
          },
        },
      ],
    })

    it("успешная регистрация нового пользователя", async () => {
      const userId = Number(Date.now().toString().slice(-6))
      const textCommand = BotCommands.START
      const update = mockTelegramUpdate(textCommand, userId)

      const userBefore = await userService.getUser(userId, BotType.TELEGRAM)
      expect(userBefore).toBeNull()

      console.log("Запрос:", {
        command: textCommand,
        userId: userId,
      })

      await request(app.getHttpServer()).post("/bots/telegram").send(update).expect(200)

      const user = await userService.getUser(userId, BotType.TELEGRAM)
      expect(user).not.toBeNull()

      if (user) {
        expect(user.id).toBeDefined()
        expect(user.botType).toBe(BotType.TELEGRAM)
        expect(user.botUserId).toBe(userId)
      }

      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Регистрация в сервисе прошла успешно"))
    })

    it("запрет повторной регистрации существующего пользователя", async () => {
      const userId = Number(Date.now().toString().slice(-6))
      const textCommand = BotCommands.START
      const update = mockTelegramUpdate(textCommand, userId)

      console.log("Первая регистрация:", {
        command: textCommand,
        userId: userId,
      })

      await request(app.getHttpServer()).post("/bots/telegram").send(update).expect(200)

      console.log("Повторная регистрация:", {
        command: textCommand,
        userId: userId,
      })

      jest.clearAllMocks()

      await request(app.getHttpServer()).post("/bots/telegram").send(update).expect(200)

      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Вы уже зарегистрированы в сервисе"))
    })
  })
})
