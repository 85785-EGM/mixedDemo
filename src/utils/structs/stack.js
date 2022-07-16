export class Stack {
  constructor () {
    this.array = []
  }

  get length () {
    return this.array.length
  }

  push (value) {
    this.array.push(value)
    return this
  }

  pop () {
    return this.array.shift()
  }
}

export class RecursiveStack extends Stack {
  constructor () {
    super()
    this.walkedMap = new Map()
    this.nextMap = new Map()
  }

  isWalked (key) {
    return this.walkedMap.has(key)
  }

  isNext (key) {
    return this.nextMap.has(key)
  }

  has (key) {
    return this.isWalked(key) || this.isNext(key)
  }

  push (value) {
    this.nextMap.set(value.key)
    return super.push(value)
  }

  pop () {
    const value = super.pop()
    this.walkedMap.set(value.key)
    this.nextMap.delete(value.key)
    return value
  }
}
