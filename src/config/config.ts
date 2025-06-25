import { ConfigModule } from "@nestjs/config"

export const configModule = ConfigModule.forRoot({
  envFilePath: ".env",
  isGlobal: true,
})

export enum Config {
  AppPort = "APP_PORT",
  DatabaseUrl = "DATABASE_URL",
  Blockchain = "BLOCKCHAIN",
  TelegramApiUrl = "TELEGRAM_API_URL",
  TelegramToken = "TELEGRAM_TOKEN",
  TelegramUseWebhook = "TELEGRAM_USE_WEBHOOK",
  TelegramUseUpdate = "TELEGRAM_USE_UPDATE",
}
