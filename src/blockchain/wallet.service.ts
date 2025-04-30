import { forwardRef, Inject, Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { In, Repository } from "typeorm"
import { FollowWallet } from "./follow-wallet.entity"
import { createWalletClient, Hex, http, WalletClient } from "viem"
import { ResponseBotError } from "../errors/ResponseBotError"
import { ReplicateDealCommand } from "../commands/ReplicateCommand"
import { Replicate } from "./replicate.entity"
import { DBError } from "../errors/DBError"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { Wallet } from "./wallet.entity"
import { BlockchainService } from "./blockchain.service"
import { Commands } from "../commands/Commands"
import { SwapObserverService } from "./swap-observer.service"
import { Token } from "./token.entity"

@Injectable()
export class WalletService {
  private readonly messages = {
    FOLLOW_WALLET_EXIST: "Такой кошелек уже отслеживается.",
    FOLLOW_WALLET_NOT_FOUND: "Подписка не найдена.",
    REPEATED_DEALS: "Повторные сделки: ",
    WALLET_NOT_FOUND: `Кошелек не найден. ${Commands.WALLET} для создания кошелька.`,
  } as const

  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(FollowWallet)
    private readonly followRepository: Repository<FollowWallet>,
    @InjectRepository(Replicate)
    private readonly replicateRepository: Repository<Replicate>,
    private readonly blockchainService: BlockchainService,
    @Inject(forwardRef(() => SwapObserverService)) // TODO: посмотреть как можно выйти из циклической зависимости
    private readonly swapObserverService: SwapObserverService,
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

  // TODO: вынести в blockchainService
  async getWalletClient(userId: number): Promise<WalletClient> {
    const wallet = await this.walletRepository.findOneBy({ userId: userId })
    if (!wallet) throw new ResponseBotError(this.messages.WALLET_NOT_FOUND)

    const privateKey = this.decrypt(wallet.encryptedKey)
    const account = privateKeyToAccount(privateKey)
    const client = this.blockchainService.getClient()

    return createWalletClient({
      account,
      chain: client.chain,
      transport: http(),
    })
  }

  async getWalletAddressOrCreate(userId: number): Promise<Hex> {
    const existedWallet = await this.walletRepository.findOneBy({ userId })
    if (existedWallet) return existedWallet.address

    return this.createWallet(userId)
  }

  async getWalletAddress(userId: number): Promise<Hex> {
    const wallet = await this.walletRepository.findOneBy({ userId: userId })
    if (!wallet) throw new ResponseBotError(this.messages.WALLET_NOT_FOUND)

    return wallet.address
  }

  async createFollowWallet(walletAddress: Hex, userId: number): Promise<FollowWallet> {
    const followWalletDto: Partial<FollowWallet> = {
      wallet: walletAddress.toLowerCase() as Hex,
      userId: userId,
    }

    const currentFollow = await this.followRepository.findOneBy(followWalletDto)
    if (currentFollow) throw new ResponseBotError(this.messages.FOLLOW_WALLET_EXIST)

    const followWallet = this.followRepository.create(followWalletDto)
    const wallet = await this.followRepository.save(followWallet)

    this.swapObserverService.addFollowWalletIntoObserver(wallet) // TODO: через события отправить, чтобы не инжектить сервис
    return wallet
  }

  async createReplicate(
    command: ReplicateDealCommand,
    userId: number,
    limit: bigint,
    token: Token,
  ): Promise<Replicate> {
    const replicateDto: Partial<Replicate> = {
      command: command,
      limit: limit,
      userId: userId,
      token: token,
    }
    try {
      const replicate = this.replicateRepository.create(replicateDto)
      return await this.replicateRepository.save(replicate)
    } catch (error) {
      DBError.handle(error, this.messages.REPEATED_DEALS)
      throw error
    }
  }

  async getFollowWalletsForUser(userId: number): Promise<FollowWallet[]> {
    return await this.followRepository.findBy({ userId })
  }

  async getFollowWallets(): Promise<Map<Hex, number[]>> {
    const result = new Map<Hex, number[]>()
    const walletsWithGroupedUsers: Array<{ wallet: Hex; userIdList: number[] }> = await this.followRepository
      .createQueryBuilder("follow_wallet")
      .select("follow_wallet.wallet", "wallet")
      .addSelect("ARRAY_AGG(follow_wallet.userId)", "userIdList")
      .groupBy("follow_wallet.wallet")
      .getRawMany()

    for (const item of walletsWithGroupedUsers) {
      result.set(item.wallet, item.userIdList)
    }

    return result
  }

  async unfollow(walletAddress: Hex, userId: number) {
    const result = await this.followRepository.delete({
      userId: userId,
      wallet: walletAddress,
    })

    if (!result || result.affected === 0) throw new ResponseBotError(this.messages.FOLLOW_WALLET_NOT_FOUND)
  }

  async sendToken(tokenAddress: Hex, toAddress: Hex, transferAmount: bigint, userId: number) {
    // await this.blockchainService.executeTokenTransfer(fromAddress, toAddress, transferAmount, this.user.id)
    console.log(tokenAddress, toAddress, transferAmount, userId)
  }

  private encrypt(data: Hex) {
    return data
  }

  private decrypt(data: string): Hex {
    return data as Hex
  }

  async getReplicatesWithUserWallet(users: number[]): Promise<Replicate[]> {
    const commands = await this.replicateRepository.find({
      where: { userId: In(users) },
      relations: ["user.wallets", "token"],
    })

    return commands
  }
}
