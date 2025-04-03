import { Controller, Get } from "@nestjs/common"
import { AppService } from "./app.service"
import { BlockchainService } from "./blockchain/blockchain.service"
import { Logger } from "./utils/Logger"
import { createPublicClient, erc20Abi, formatUnits, http } from "viem"
import { bscTestnet } from "viem/chains"
import { Token } from "./blockchain/token.entity"

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
  async test(): Promise<void> {
    const walletAddress = "0x55179F1bB0F26640f12994e94D0A49968Ddc462E"
    const tokenAddress = "0x8301F2213c0eeD49a7E28Ae4c3e91722919B8B47"
    const token = { symbol: "TEST", address: tokenAddress }

    try {
      const balance = await this.blockchainService.getTokenBalance(walletAddress, token as Token)
      console.log(balance)
    } catch (error) {
      Logger.error(error)
    }
  }
}
