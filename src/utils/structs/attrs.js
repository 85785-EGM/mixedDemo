export class Attrs {
  constructor () {
    this.attrs = new Map()
  }

  get (key) {
    return this.attrs.get(key)
  }

  set (key, attr) {
    attr.version = this.getVersion(key) + 1
    this.attrs.set(key, attr)
    return this
  }

  del (key) {
    this.attrs.delete(key)
    return this
  }

  getVersion (key) {
    return this.get(key)?.version ?? -1
  }
}
