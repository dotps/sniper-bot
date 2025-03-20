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
