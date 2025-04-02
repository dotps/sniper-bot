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
    const balance = await this.blockchainService.getPublicClient().getBalance({
      address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    })
    console.log(balance)
    return balance
    // const address = this.blockchainService.createWallet()
    // console.log(address)
    // return address
  }
}
