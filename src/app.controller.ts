import { Controller, Get } from "@nestjs/common"
import { AppService } from "./app.service"
import { BlockchainService } from "./blockchain/blockchain.service"
import { Logger } from "./utils/Logger"

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly blockchainService: BlockchainService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  @Get("test")
  async test(): Promise<unknown> {
    try {
      const balance = await this.blockchainService.getTokenBalance(
        "0x55179F1bB0F26640f12994e94D0A49968Ddc462E",
        "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
      )
      console.log(balance)
      return balance
    } catch (error) {
      Logger.error(error)
    }
  }
}
