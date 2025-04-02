import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { FollowWallet } from "./follow-wallet.entity"
import { Hex } from "viem"
import { ResponseBotError } from "../errors/ResponseBotError"
import { ReplicateDealCommand } from "../commands/ReplicateCommand"
import { Replicate } from "./replicate.entity"
import { DBError } from "../errors/DBError"

@Injectable()
export class WalletService {
  private readonly messages = {
    FOLLOW_WALLET_EXIST: "Такой кошелек уже отслеживается.",
    FOLLOW_WALLET_NOT_FOUND: "Такой кошелек уже отслеживается.",
    REPEATED_DEALS: "Повторные сделки: ",
  } as const

  constructor(
    @InjectRepository(FollowWallet)
    private readonly followRepository: Repository<FollowWallet>,
    @InjectRepository(Replicate)
    private readonly replicateRepository: Repository<Replicate>,
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

  async createReplicate(command: ReplicateDealCommand, userId: number, limit: number): Promise<Replicate | undefined> {
    const replicateDto: Partial<Replicate> = {
      command: command,
      limit: limit,
      userId: userId,
    }
    try {
      const replicate = this.replicateRepository.create(replicateDto)
      return await this.replicateRepository.save(replicate)
    } catch (error) {
      DBError.handle(error, this.messages.REPEATED_DEALS)
    }
  }

  async getFollowWallets(userId: number): Promise<FollowWallet[]> {
    return await this.followRepository.findBy({ userId })
  }

  async unfollow(walletAddress: Hex, userId: number) {
    const result = await this.followRepository.delete({
      userId: userId,
      wallet: walletAddress,
    })

    if (!result || result.affected === 0) throw new ResponseBotError(this.messages.FOLLOW_WALLET_NOT_FOUND)
  }
}
