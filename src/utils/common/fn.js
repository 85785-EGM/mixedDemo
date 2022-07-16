export async function delay (ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

export function delayFunc (func, ms) {
  return async (...args) => Promise.all([asyncFunc(func)(...args), delay(ms)])
}

export async function debounce (func, ms) {
  return await delayFunc(func, ms)()
}

export function asyncFunc (func) {
  return async (...args) => func(...args)
}

export async function trampoline (func, { maxdeep = Number.MAX_VALUE }) {
  const funcs = [func]
  for (let i = 0, f; (f = funcs.pop()) && i < maxdeep; i++) {
    funcs.push(...(await f()).reverse())
  }
}

export async function withRetry (func, opt) {
  return await retry(func, opt)()
}

export function retry (func, opts) {
  opts = { delay: 1000, times: 3, ...opts }
  return async (...args) => {
    const errors = []
    for (let i = 0; i < opts.times; i++) {
      try {
        return await func(...args)
      } catch (error) {
        errors.push(error)
        console.warn(error)
      }
      await delay(opts.delay)
    }
    throw errors.pop()
  }
}
