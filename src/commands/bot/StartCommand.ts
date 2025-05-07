import { ICommand } from "../infrastructure/ICommand"
import { BotResponseData } from "../../bots/infrastructure/BotResponseData"
import { UserService } from "../../users/user.service"
import { User } from "../../users/user.entity"
import { WalletService } from "../../blockchain/wallet.service"

export class StartCommand implements ICommand {
  private readonly messages = {
    EXIST: "Вы уже зарегистрированы в сервисе.",
    SUCCESS: "Регистрация в сервисе прошла успешно.",
    ERROR: "Ошибка регистрации. Попробуйте позже.",
    WALLET_CREATED: "Создан кошелек: ",
  } as const

  constructor(
    private readonly userService: UserService,
    private readonly walletService: WalletService,
    private readonly user: User,
  ) {}

  async execute(): Promise<BotResponseData | null> {
    const response: string[] = []

    if (this.user.id) {
      response.push(this.messages.EXIST)
    } else {
      const user = await this.userService.createUser(this.user)
      if (user) {
        const walletAddress = await this.walletService.createWallet(user.id)
        response.push(this.messages.SUCCESS)
        response.push(this.messages.WALLET_CREATED + walletAddress)
      } else {
        response.push(this.messages.ERROR)
      }
    }

    return new BotResponseData(response)
  }
}
