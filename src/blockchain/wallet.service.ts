import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { FollowWallet } from "./follow-wallet.entity"
import { createWalletClient, Hex, http, Transport, TransportConfig, WalletClient } from "viem"
import { ResponseBotError } from "../errors/ResponseBotError"
import { ReplicateDealCommand } from "../commands/ReplicateCommand"
import { Replicate } from "./replicate.entity"
import { DBError } from "../errors/DBError"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { Wallet } from "./wallet.entity"
import { BlockchainService } from "./blockchain.service"

@Injectable()
export class WalletService {
  private readonly messages = {
    FOLLOW_WALLET_EXIST: "Такой кошелек уже отслеживается.",
    FOLLOW_WALLET_NOT_FOUND: "Подписка не найдена.",
    REPEATED_DEALS: "Повторные сделки: ",
    WALLET_NOT_FOUND: "Кошелек не найден.",
  } as const

  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(FollowWallet)
    private readonly followRepository: Repository<FollowWallet>,
    @InjectRepository(Replicate)
    private readonly replicateRepository: Repository<Replicate>,
    private readonly blockchainService: BlockchainService,
  ) {}

  async createWallet(userId: number): Promise<Hex> {
    const privateKey = generatePrivateKey()
    const account = privateKeyToAccount(privateKey)

    const encryptedKey = this.encrypt(privateKey)
    const wallet = this.walletRepository.create({
      userId,
      encryptedKey,
      address: account.address,
    })

    const createdWallet = await this.walletRepository.save(wallet)
    return createdWallet.address
  }

  async getWalletClient(userId: number): Promise<WalletClient> {
    const wallet = await this.walletRepository.findOneBy({ userId: userId })
    if (!wallet) throw new ResponseBotError(this.messages.WALLET_NOT_FOUND)

    const privateKey = this.decrypt(wallet.encryptedKey)
    const account = privateKeyToAccount(privateKey)
    const client = this.blockchainService.getPublicClient()

    return createWalletClient({
      account,
      chain: client.chain,
      transport: http(),
    })
  }

  // TODO: продолжить подключение к блокчейну

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

  async send(fromAddress: Hex, toAddress: Hex, transferAmount: number, userId: number) {
    console.log(fromAddress, toAddress, transferAmount, userId)
  }

  private encrypt(data: Hex) {
    return data
  }

  private decrypt(data: string): Hex {
    return data as Hex
  }
}
