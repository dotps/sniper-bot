import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { ValidationPipe } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Config } from "./config/config"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
  const configService = app.get(ConfigService)
  const port = configService.get<number>(Config.AppPort) ?? 3000

  await app.listen(port)
}

bootstrap()
