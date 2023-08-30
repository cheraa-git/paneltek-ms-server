export function splitArray(array: any[], N: number) {
  const result = []
  for (let i = 0; i < array.length; i += N) {
    result.push(array.slice(i, i + N))
  }
  return result
}

export function formatNumber(number: number, width: number) {
  const formattedNumber = String(number)
  const padding = width - formattedNumber.length
  if (padding > 0) {
    return '0'.repeat(padding) + formattedNumber
  }
  return formattedNumber
}
