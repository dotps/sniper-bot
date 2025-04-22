export function absBigInt(value: bigint): bigint {
  return value < 0n ? -value : value
}
