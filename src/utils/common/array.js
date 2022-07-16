export function range (start, end, step = 1) {
  if (!end) {
    end = start
    start = 0
  }
  const items = []
  for (let i = start; i < end; i += step) {
    items.push(i)
  }
  return items
}

export function zip (...arrays) {
  const maxlen = Math.min(...arrays.map(a => a.length))
  return range(maxlen).map(i => arrays.map(a => a[i]))
}
