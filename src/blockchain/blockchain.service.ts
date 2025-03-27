import { Injectable } from "@nestjs/common"
import { createPublicClient, defineChain, Hex, http, PublicClient } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"

@Injectable()
export class BlockchainService {
  private readonly client: PublicClient

  constructor() {
    this.client = createPublicClient({
      chain: bsc,
      transport: http(),
    })
  }

  getClient(): PublicClient {
    return this.client
  }

  createWallet(): Hex {
    const privateKey = generatePrivateKey()
    const account = privateKeyToAccount(privateKey)
    return account.address
  }
}

const bsc = defineChain({
  id: 56,
  name: "Binance Smart Chain",
  network: "bsc",
  nativeCurrency: {
    decimals: 18,
    name: "Binance Chain Native Token",
    symbol: "BNB",
  },
  rpcUrls: {
    default: { http: ["https://bsc-dataseed1.binance.org"] },
    public: { http: ["https://bsc-dataseed1.binance.org"] },
  },
  blockExplorers: {
    default: { name: "BscScan", url: "https://bscscan.com" },
  },
})
