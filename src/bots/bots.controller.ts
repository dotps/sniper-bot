import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes, ValidationPipe } from "@nestjs/common"
import { RequestTelegramDto } from "./telegram/request-telegram.dto"
import { BotsService } from "./bots.service"

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
  async handleVkontakte(@Body() data: any): Promise<void> {}
}

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
