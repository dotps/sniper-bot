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
import { BotType } from "../src/bots/infrastructure/bot-provider.interface"
import { BotCommands } from "../src/commands/bot/bot-commands"
import { Token } from "../src/blockchain/token/token.entity"
import { FollowWallet } from "../src/blockchain/wallet/follow-wallet.entity"
import { Replicate } from "../src/blockchain/replicate.entity"
import { Wallet } from "../src/blockchain/wallet/wallet.entity"
import { Logger } from "../src/libs/core/logger/logger"
import { BlockchainModule } from "../src/blockchain/blockchain.module"

const mockLog = jest.fn((text) => {
  console.log("[LOG]", text)
})
Logger.init({
  isEnabled: () => true,
  log: mockLog,
  error: jest.fn(),
})

jest.mock("../src/libs/core/web-request/web-request-fetch.service", () => ({
  WebRequestFetchService: jest.fn().mockImplementation(() => ({
    tryGet: jest.fn().mockImplementation(async (url: string) => {
      Logger.log(`Query: ${url}`)
      return { ok: true, result: {} }
    }),
  })),
}))

jest.mock("../src/blockchain/swap-observer.service", () => ({
  SwapObserverService: jest.fn().mockImplementation(() => ({
    updateObservedWallets: jest.fn().mockResolvedValue(undefined),
    addFollowWalletIntoObserver: jest.fn(),
  })),
}))

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

describe("TelegramBot (интеграционный): ", () => {
  jest.setTimeout(30000)

  let app: INestApplication
  let userService: UserService
  let globalUserId = 0

  beforeAll(async () => {
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
        BlockchainModule,
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

  beforeEach(() => {
    console.log("======================================================================")
    console.log(expect.getState().currentTestName)
    jest.clearAllMocks()
  })

  describe("команда /start: ", () => {
    it("успешная регистрация нового пользователя", async () => {
      const userId = Number(Date.now().toString().slice(-6))
      globalUserId = userId
      const textCommand = BotCommands.Start
      const update = mockTelegramUpdate(textCommand, userId)

      const userBefore = await userService.getUser(userId, BotType.Telegram)
      expect(userBefore).toBeNull()

      console.log("Запрос:", {
        command: textCommand,
        userId: userId,
      })

      await request(app.getHttpServer()).post("/bots/telegram").send(update).expect(200)

      const user = await userService.getUser(userId, BotType.Telegram)
      expect(user).not.toBeNull()

      if (user) {
        expect(user.id).toBeDefined()
        expect(user.botType).toBe(BotType.Telegram)
        expect(user.botUserId).toBe(userId)
      }

      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Регистрация в сервисе прошла успешно"))
    })
    it("запрет повторной регистрации существующего пользователя", async () => {
      const userId = Number(Date.now().toString().slice(-6))
      const textCommand = BotCommands.Start
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

  describe("несуществующие команды: ", () => {
    it("/test", async () => {
      const userId = globalUserId
      const textCommand = "/test"
      const update = mockTelegramUpdate(textCommand, userId)

      const user = await userService.getUser(userId, BotType.Telegram)
      expect(user).not.toBeNull()

      console.log("Запрос:", {
        command: textCommand,
        userId: userId,
      })

      await request(app.getHttpServer()).post("/bots/telegram").send(update).expect(200)

      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Неизвестная команда"))
    })

    it("test", async () => {
      const userId = globalUserId
      const textCommand = "test"
      const update = mockTelegramUpdate(textCommand, userId)

      const user = await userService.getUser(userId, BotType.Telegram)
      expect(user).not.toBeNull()

      console.log("Запрос:", {
        command: textCommand,
        userId: userId,
      })

      await request(app.getHttpServer()).post("/bots/telegram").send(update).expect(200)

      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining("Для взаимодействия с ботом необходимо ввести команду"),
      )
    })
  })

  describe("работа с токенами: ", () => {
    const commands = [
      { command: "/addtoken", expect: "Укажите токен" },
      { command: "/addtoken test", expect: "Укажите токен" },
      { command: "/addtoken 0x7ceb23fd6bc0add59e62ac25578270cff1b9f619", expect: "Токен успешно добавлен" },
      { command: "/addtoken 0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", expect: "Токен успешно добавлен" },
      { command: "/addtoken 0xB25e20De2F2eBb4CfFD4D16a55C7B395e8a94762", expect: "Токен успешно добавлен" },
      { command: "/addtoken 0x7ceb23fd6bc0add59e62ac25578270cff1b9f619", expect: "Такой токен уже добавлен" },
      { command: "/addtoken 0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", expect: "Такой токен уже добавлен" },
      { command: "/addtoken 0xB25e20De2F2eBb4CfFD4D16a55C7B395e8a94762", expect: "Такой токен уже добавлен" },
      { command: "/removetoken 0xB25e20De2F2eBb4CfFD4D16a55C7B395e8a94762", expect: "Токен успешно удален" },
      { command: "/removetoken 0xB25e20De2F2eBb4CfFD4D16a55C7B395e8a94762", expect: "Токен не найден" },
      { command: "/removetoken test", expect: "Требуется адрес токена" },
      { command: "/removetoken all", expect: "Все токены успешно удалены" },
      { command: "/addtoken 0x7ceb23fd6bc0add59e62ac25578270cff1b9f619", expect: "Токен успешно добавлен" },
      { command: "/addtoken 0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", expect: "Токен успешно добавлен" },
      { command: "/addtoken 0xB25e20De2F2eBb4CfFD4D16a55C7B395e8a94762", expect: "Токен успешно добавлен" },
    ]

    commands.forEach((command) => {
      it(command.command, async () => {
        const userId = globalUserId
        const update = mockTelegramUpdate(command.command, userId)

        console.log("Запрос:", {
          command: command.command,
          userId: userId,
        })

        await request(app.getHttpServer()).post("/bots/telegram").send(update).expect(200)

        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining(command.expect))
      })
    })
  })

  describe("баланс: ", () => {
    const commands = [{ command: "/balance", expect: "Текущий баланс" }]

    commands.forEach((command) => {
      it(command.command, async () => {
        const userId = globalUserId
        const update = mockTelegramUpdate(command.command, userId)

        console.log("Запрос:", {
          command: command.command,
          userId: userId,
        })

        await request(app.getHttpServer()).post("/bots/telegram").send(update).expect(200)

        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining(command.expect))
      })
    })
  })

  describe("подписка на кошельки: ", () => {
    const commands = [
      { command: "/subscriptions", expect: "Подписки не найдены" },
      { command: "/follow", expect: "Требуется адрес кошелька" },
      { command: "/follow test", expect: "Требуется адрес кошелька" },
      { command: "/follow test test", expect: "Требуется адрес кошелька" },
      {
        command: "/follow 0x85cd07ea01423b1e937929b44e4ad8c40bbb5e61",
        expect: "Подписка на кошелек успешно оформлена",
      },
      {
        command: "/follow 0x85cd07ea01423b1e937929b44e4ad8c40bbb5e71",
        expect: "Подписка на кошелек успешно оформлена",
      },

      {
        command:
          "/follow 0x7f20a7a526d1bab092e3be0733d96287e93cef59 0xe592427a0aece92de3edee1f18e0157c05861564 0x802b65b5d9016621e66003aed0b16615093f328b",
        expect: "Подписка на кошелек успешно оформлена",
      },
      { command: "/follow 0x85cd07ea01423b1e937929b44e4ad8c40bbb5e61", expect: "Такой кошелек уже отслеживается" },
      { command: "/subscriptions", expect: "Вы подписаны на кошельки" },
      { command: "/unfollow", expect: "Требуется адрес кошелька" },
      { command: "/unfollow test", expect: "Требуется адрес кошелька" },
      {
        command: "/unfollow 0x85cd07ea01423b1e937929b44e4ad8c40bbb5e61",
        expect: "Подписка на кошелек успешно удалена",
      },
      {
        command: "/unfollow 0x85cd07ea01423b1e937929b44e4ad8c40bbb5e61",
        expect: "Подписка не найдена",
      },
    ]

    commands.forEach((command) => {
      it(command.command, async () => {
        const userId = globalUserId
        const update = mockTelegramUpdate(command.command, userId)

        console.log("Запрос:", {
          command: command.command,
          userId: userId,
        })

        await request(app.getHttpServer()).post("/bots/telegram").send(update).expect(200)

        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining(command.expect))
      })
    })
  })

  describe("повторные сделки: ", () => {
    const commands = [
      { command: "/replicate", expect: "Неверные параметры команды" },
      { command: "/replicate test", expect: "Неверные параметры команды" },
      { command: "/replicate buy test", expect: "Неверный формат адреса токена" },
      { command: "/replicate buy 0x7ceb23fd6bc0add59e62ac25578270cff1b9f619 test", expect: "Неверный формат лимита" },
      { command: "/replicate buy 0x7ceb23fd6bc0add59e62ac25578270cff1b9f619 -1", expect: "Неверный формат лимита" },
      { command: "/replicate buy 0x7ceb23fd6bc0add59e62ac25578270cff1b9f619 0,1", expect: "Неверный формат лимита" },
      { command: "/replicate buy 0x7ceb23fd6bc0add59e62ac25578270cff1b9f619 1WETH", expect: "Неверный формат лимита" },
      { command: "/replicate buy 0x7ceb23fd6bc0add59e62ac25578270cff1b9f619 1", expect: "Повторные сделки подключены" },
      {
        command: "/replicate sell 0x7ceb23fd6bc0add59e62ac25578270cff1b9f619 1",
        expect: "Повторные сделки подключены",
      },
      {
        command: "/replicate buy 0x6f8a06447Ff6FcF75d803135a7de15CE88C1d4ec 1",
        expect: "Токен не обнаружен в списке для торговли",
      },
    ]

    commands.forEach((command) => {
      it(command.command, async () => {
        const userId = globalUserId
        const update = mockTelegramUpdate(command.command, userId)

        console.log("Запрос:", {
          command: command.command,
          userId: userId,
        })

        await request(app.getHttpServer()).post("/bots/telegram").send(update).expect(200)

        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining(command.expect))
      })
    })
  })
})
