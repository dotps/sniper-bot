export function absBigInt(value: bigint): bigint {
  return value < 0n ? -value : value
}

export function clampMax(value: bigint, max: bigint): bigint {
  return value > max ? max : value
}

function sqrtPriceX96ToPrice(sqrtPriceX96: bigint): number {
  const Q96 = 2n ** 96n
  const sqrtPrice = Number(sqrtPriceX96) / Number(Q96)
  return sqrtPrice * sqrtPrice
}

function priceToSqrtPriceX96(price: number): bigint {
  const sqrtPrice = Math.sqrt(price)
  const Q96 = 2 ** 96
  return BigInt(Math.floor(sqrtPrice * Q96))
}

export function calculateSqrtPriceWithSlippage(sqrtPriceX96: bigint, slippagePercent: number, zeroForOne: boolean) {
  const price = sqrtPriceX96ToPrice(sqrtPriceX96)
  const slippageFactor = zeroForOne ? 1 - slippagePercent / 100 : 1 + slippagePercent / 100
  const priceWithSlippage = price * slippageFactor
  return priceToSqrtPriceX96(priceWithSlippage)
}
