import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes, ValidationPipe } from "@nestjs/common"
import { TelegramUpdatesDto } from "./telegram/telegram-updates.dto"
import { BotsService } from "./bots.service"
import { VkUpdatesDto } from "./vk/vk-updates.dto"
import { TelegramApiProvider } from "./telegram/telegram-api.provider"
import { VkApiProvider } from "./vk/vk-api.provider"

@Controller("bots")
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Post("telegram")
  @HttpCode(HttpStatus.OK)
  @UsePipes(ValidationPipe)
  async handleTelegram(@Body() data: TelegramUpdatesDto): Promise<void> {
    await this.botsService.handleRequest(data, TelegramApiProvider)
  }

  @Post("vk")
  @HttpCode(HttpStatus.OK)
  @UsePipes(ValidationPipe)
  async handleVkontakte(@Body() data: VkUpdatesDto): Promise<void> {
    await this.botsService.handleRequest(data, VkApiProvider)
  }
}
