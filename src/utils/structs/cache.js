export class Cache {
  constructor () {
    this.cache = new Map()
  }

  async has (key) {
    return this.cache.has(key)
  }

  async get (key, defaultValue = null) {
    if (!this.cache.has(key)) {
      this.cache.set(key, defaultValue)
    }
    return this.cache.get(key)
  }

  async set (key, value) {
    this.cache.set(key, value)
    return value
  }

  async del (key) {
    this.cache.delete(key)
    return this
  }

  async clear () {
    this.cache = new Map()
  }

  async pop (key) {
    const value = await this.get(key)
    await this.del(key)
    return value
  }
}
