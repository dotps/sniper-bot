import { Controller, Get } from "@nestjs/common"
import { AppService } from "./app.service"
import { BlockchainService } from "./blockchain/blockchain.service"

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
  async test(): Promise<bigint> {
    const balance = await this.blockchainService.getClient().getBalance({
      address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    })
    console.log(balance)
    return balance
  }
}
