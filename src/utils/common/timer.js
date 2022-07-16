export class Timer {
  constructor (fun, time = 120000) {
    this.fun = fun
    this.time = time
    this.timeId = 0
    this.queue = []
    this.handleQ = null
    this.timeOn = false
  }

  startLoop () {
    this.addQueue(() => {
      if (!this.timeOn) {
        this.timeOn = true
        this.timeoutLoop()
      }
    })
  }

  stopLoop () {
    if (this.timeOn) {
      this.timeOn = false
      this.queue = []
      clearTimeout(this.timeId)
      this._timeoutResolve?.()
    }
  }

  async timeoutLoop () {
    this.addQueue(() => this.timeout(this.time))
    this.addQueue(this.fun)
    this.addQueue(this.timeoutLoop.bind(this))
  }

  addQueue (fun) {
    this.queue.push(fun)
    this.handleQueue()
    return this.queue.length
  }

  async handleQueue () {
    if (!this.handleQ) {
      this.handleQ = this.queue.shift()
      await this.handleQ()
      this.handleQ = null
      if (this.queue.length) this.handleQueue()
    }
  }

  timeout (time) {
    return new Promise(resolve => {
      this._timeoutResolve = resolve
      this.timeId = setTimeout(() => {
        resolve()
      }, time)
    })
  }
}
