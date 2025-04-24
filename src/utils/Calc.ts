export function absBigInt(value: bigint): bigint {
  return value < 0n ? -value : value
}

export function clampMax(value: bigint, max: bigint): bigint {
  return value > max ? max : value
}