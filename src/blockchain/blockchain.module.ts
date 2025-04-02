import { Module } from "@nestjs/common"
import { BlockchainService } from "./blockchain.service"

// TODO: перенести сюда инициализацию сервисов из папки /blockchain/
@Module({
  providers: [BlockchainService],
  exports: [BlockchainService],
})
export class BlockchainModule {}
