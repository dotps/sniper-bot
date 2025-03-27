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
  test(): string {
    const address = this.blockchainService.createWallet()
    console.log(address)
    return address
  }
}
