import { enumerate } from './gen'

export class Pipe {
  constructor (generator) {
    this.generator = generator
  }

  * [Symbol.Iterator] () {
    yield * this.iter()
  }

  iter () {
    return this.generator
  }

  array () {
    return [...this.generator]
  }

  * _map (func) {
    for (const [item, index] of enumerate(this.generator)) {
      yield func(item, index, this.generator)
    }
  }

  map (func) {
    return new this.constructor(this._map(func))
  }

  * _forEach (func) {
    for (const [item, index] of enumerate(this.generator)) {
      func(item, index, this.generator)
      yield
    }
  }

  forEach (func) {
    return new this.constructor(this._forEach(func))
  }

  * _filter (func) {
    for (const [item, index] of enumerate(this.generator)) {
      if (func(item, index, this.generator)) {
        yield item
      }
    }
  }

  filter (func) {
    return new this.constructor(this._filter(func))
  }

  find (func) {
    for (const [item, index] of enumerate(this.generator)) {
      if (func(item, index, this.generator)) {
        return item
      }
    }
  }
}
