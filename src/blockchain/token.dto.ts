import { Hex } from "viem"

export class TokenDto {
  readonly address: Hex
  readonly balance: number
  readonly symbol: string
  userId: number
}
