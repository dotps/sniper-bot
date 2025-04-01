import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { FollowWallet } from "./follow-wallet.entity"
import { Hex } from "viem"
import { ResponseBotError } from "../errors/ResponseBotError"

@Injectable()
export class WalletService {
  private readonly messages = {
    FOLLOW_WALLET_EXIST: "Такой кошелек уже отслеживается.",
  } as const

  constructor(
    @InjectRepository(FollowWallet)
    private readonly followRepository: Repository<FollowWallet>,
  ) {}

  async createFollowWallet(walletAddress: Hex, userId: number): Promise<FollowWallet> {
    const followWalletDto: Partial<FollowWallet> = {
      wallet: walletAddress,
      userId: userId,
    }

    const currentFollow = await this.followRepository.findOneBy(followWalletDto)
    if (currentFollow) throw new ResponseBotError(this.messages.FOLLOW_WALLET_EXIST)

    const followWallet = this.followRepository.create(followWalletDto)

    return await this.followRepository.save(followWallet)
  }
}
