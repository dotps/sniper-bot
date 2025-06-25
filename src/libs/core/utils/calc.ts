import BigNumber from "bignumber.js"

export function absBigInt(value: bigint): bigint {
  return value < 0n ? -value : value
}

export function clampMax(value: bigint, max: bigint): bigint {
  return value > max ? max : value
}

export function calculateSqrtPriceWithSlippage(
  sqrtPriceX96: bigint,
  slippagePercent: number,
  zeroForOne: boolean,
): bigint {
  const price = sqrtPriceX96ToPrice(sqrtPriceX96)
  const slippageFactor = zeroForOne ? 1 - slippagePercent / 100 : 1 + slippagePercent / 100
  const priceWithSlippage = price.times(slippageFactor)
  return priceToSqrtPriceX96(priceWithSlippage)
}

function sqrtPriceX96ToPrice(sqrtPriceX96: bigint): BigNumber {
  const Q96 = new BigNumber(2).pow(96)
  const sqrtPrice = new BigNumber(sqrtPriceX96.toString()).div(Q96)
  return sqrtPrice.pow(2)
}

function priceToSqrtPriceX96(price: BigNumber): bigint {
  const sqrtPrice = price.sqrt()
  const Q96 = new BigNumber(2).pow(96)
  return BigInt(sqrtPrice.times(Q96).integerValue(BigNumber.ROUND_FLOOR).toFixed(0))
}