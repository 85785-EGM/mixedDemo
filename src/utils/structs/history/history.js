class Stack {
  constructor ({ maxlen = 0 }) {
    this.maxlen = maxlen
    this.stack = []
    this.cursor = -1
  }

  get current () {
    return this.stack[this.cursor]
  }

  reset () {
    this.stack.splice(0, this.length)
    this.cursor = -1
  }

  setMaxlen (maxlen) {
    if (maxlen < this.length) {
      this.stack = this.stack.slice(0, maxlen)
    }
    this.maxlen = maxlen
  }

  push (...items) {
    if (this.hasNext(1)) {
      this.stack = this.stack.slice(0, this.cursor + 1)
    }
    const rest = this.length + items.length - this.maxlen
    if (rest > 0) {
      this.stack = this.stack.slice(rest)
      this.cursor -= rest
    }
    this.stack.push(...items)
    this.cursor += items.length
    return this.length
  }

  * walk (n) {
    if (n > 0) {
      for (let i = 0; i < n; i++) {
        if (!this.hasNext(1)) break
        this.cursor++
        yield this.current
      }
    } else if (n < 0) {
      for (let i = 0; i < -n; i++) {
        if (!this.hasPrev(0)) break
        yield this.current
        this.cursor--
      }
    }
  }

  hasPrev (n) {
    return this.cursor + 1 > n
  }

  hasNext (n) {
    return this.length - this.cursor > n
  }

  get length () {
    return this.stack.length
  }
}

export class History extends Stack {
  go (n) {
    if (n > 0) {
      for (const commit of this.walk(n)) {
        commit.redo()
      }
    } else if (n < 0) {
      for (const commit of this.walk(n)) {
        commit.undo()
      }
    }
  }
}
