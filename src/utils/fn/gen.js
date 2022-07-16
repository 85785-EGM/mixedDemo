export function * enumerate (generator) {
  const index = 0
  for (const item of generator) {
    yield [item, index]
  }
}

export function * gen (obj) {
  for (const item of obj) {
    yield item
  }
}

export function * range (...args) {
  let begin, end, step
  switch (args.length) {
    case 0: {
      ;[begin, end, step] = [0, 0, 1]
      break
    }
    case 1: {
      ;[begin, end, step] = [0, ...args, 1]
      break
    }
    case 2: {
      ;[begin, end, step] = [...args, 1]
      break
    }
    default: {
      ;[begin, end, step] = args
      break
    }
  }
  for (let i = begin; i < end; i += step) {
    yield i
  }
}

export function * zip (...args) {
  if (args.length === 0) {
    return
  }
  const gens = args.map(i => gen(i))
  while (true) {
    const results = gens.map(g => g.next())
    if (results.some(({ done }) => done)) {
      return
    }
    yield results.map(({ value }) => value)
  }
}

export function * combine (...args) {
  if (args.length === 0) {
    return
  }
  const [cur, ...rest] = args
  for (const item of cur) {
    if (rest.length === 0) {
      yield [item]
    } else {
      for (const items of combine(...rest)) {
        yield [item, ...items]
      }
    }
  }
}
