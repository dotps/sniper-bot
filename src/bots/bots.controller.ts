import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes, ValidationPipe } from "@nestjs/common"
import { RequestTelegramDto } from "./telegram/request-telegram.dto"
import { BotsService } from "./bots.service"
import { TelegramApiProvider } from "../providers/bots/telegram/TelegramApiProvider"

@Controller("bots")
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Post("telegram")
  @HttpCode(HttpStatus.OK)
  @UsePipes(ValidationPipe)
  async handleTelegram(@Body() data: RequestTelegramDto): Promise<void> {
    await this.botsService.handleRequest(data)
  }

  @Post("vk")
  @HttpCode(HttpStatus.OK)
  @UsePipes(ValidationPipe)
  async handleVkontakte(@Body() data: any): Promise<void> {
    await this.botsService.handleRequest<TelegramApiProvider>(data, TelegramApiProvider)
  }
}

/*
// TODO: тут
В TypeScript и NestJS, вы не можете напрямую передать тип в метод как `await this.botsService<VKBot>.handleRequest(data)`. Вместо этого, вы можете использовать подход, который позволяет вам работать с разными типами ботов, например, через интерфейсы или наследование.

Вот как можно реализовать это:

1. **Создайте интерфейс для обработчиков ботов:**

```typescript
export interface BotHandler {
  handleRequest(data: any): Promise<void>;
}
```

2. **Реализуйте этот интерфейс для каждого бота:**

```typescript
import { Injectable } from '@nestjs/common';
import { BotHandler } from './bot-handler.interface';

@Injectable()
export class VKBot implements BotHandler {
  async handleRequest(data: any): Promise<void> {
    // Логика обработки запроса для VK
  }
}

@Injectable()
export class TelegramBot implements BotHandler {
  async handleRequest(data: any): Promise<void> {
    // Логика обработки запроса для Telegram
  }
}
```

3. **Используйте эти реализации в вашем контроллере:**

```typescript
import { Controller, HttpCode, HttpStatus, Post, UsePipes, ValidationPipe, Inject } from '@nestjs/common';
import { RequestTelegramDto } from './telegram/request-telegram.dto';
import { BotHandler } from './bot-handler.interface';
import { TelegramBot } from './telegram-bot.service';
import { VKBot } from './vk-bot.service';

@Controller('bots')
export class BotsController {
  constructor(
    @Inject('TelegramBot') private readonly telegramBot: BotHandler,
    @Inject('VKBot') private readonly vkBot: BotHandler,
  ) {}

  @Post('telegram')
  @HttpCode(HttpStatus.OK)
  @UsePipes(ValidationPipe)
  async handleTelegram(@Body() data: RequestTelegramDto): Promise<void> {
    await this.telegramBot.handleRequest(data);
  }

  @Post('vk')
  @HttpCode(HttpStatus.OK)
  @UsePipes(ValidationPipe)
  async handleVkontakte(@Body() data: any): Promise<void> {
    await this.vkBot.handleRequest(data);
  }
}
```

4. **Зарегистрируйте сервисы в модуле:**

```typescript
import { Module } from '@nestjs/common';
import { BotsController } from './bots.controller';
import { TelegramBot } from './telegram-bot.service';
import { VKBot } from './vk-bot.service';

@Module({
  controllers: [BotsController],
  providers: [
    {
      provide: 'TelegramBot',
      useClass: TelegramBot,
    },
    {
      provide: 'VKBot',
      useClass: VKBot,
    },
  ],
})
export class BotsModule {}
```

Таким образом, вы можете использовать разные реализации для обработки запросов от разных ботов, сохраняя при этом гибкость и возможность расширения.
 */


/*
// Ответ от телеграм
{
    "ok": true,
    "result": [
        {
            "update_id": 362309960,
            "message": {
                "message_id": 197,
                "from": {
                    "id": 318745628,
                    "is_bot": false,
                    "first_name": "Станислав",
                    "last_name": "Петров",
                    "username": "dotps",
                    "language_code": "ru"
                },
                "chat": {
                    "id": 318745628,
                    "first_name": "Станислав",
                    "last_name": "Петров",
                    "username": "dotps",
                    "type": "private"
                },
                "date": 1742476287,
                "text": "/start",
                "entities": [
                    {
                        "offset": 0,
                        "length": 6,
                        "type": "bot_command"
                    }
                ]
            }
        }
    ]
}
 */
