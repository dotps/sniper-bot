import { Hex } from "viem"

export class TokenDto {
  readonly address: Hex
  readonly balance: bigint
  readonly decimals: number
  readonly symbol: string
  userId: number
}
