export function sum (array) {
  return array.reduce((a, b) => a + b, 0)
}

export function avg (array) {
  return sum(array) / array.length
}

export function round (base, exponent = 0) {
  const n = Math.pow(10, exponent)
  const x = Math.round((base + Number.EPSILON) * n) / n
  if (x === 0) return 0
  return x
}
