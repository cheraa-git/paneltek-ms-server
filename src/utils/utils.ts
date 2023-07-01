export function splitArray(array: any[], N: number) {
  const result = []
  for (let i = 0; i < array.length; i += N) {
    result.push(array.slice(i, i + N))
  }
  return result
}
