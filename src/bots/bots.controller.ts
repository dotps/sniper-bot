import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common"
import { BotProvider } from "../providers/bots/BotProvider"
import { CommandHandler } from "../Commands/CommandHandler"
import { QueryDto } from "./query.dto"

@Controller("bots")
export class BotsController {
  constructor(
    private readonly botProvider: BotProvider,
    private readonly commandHandler: CommandHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UsePipes(ValidationPipe)
  async query(@Body() data: QueryDto): Promise<void> {
    // TODO: перенести в BotsService
    console.log(data)
    const queryData = await this.botProvider.handleUpdate([data])
    console.log(queryData)
    const response = await this.commandHandler.handleQuery(queryData)
    console.log(response)
    //TODO: донастроить бота
    if (!response) return
    const responseData = response?.data || []
    for (const text of responseData) {
      await this.botProvider.sendResponse(text, queryData)
    }
  }
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
