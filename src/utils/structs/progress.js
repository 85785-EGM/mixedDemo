import { sum } from '@/utils/common'
import { reactive } from 'vue'

export class Progress {
  constructor (opts) {
    this.options = {
      total: 100,
      ...opts
    }
    this._p = 0
    this.children = []
  }

  get total () {
    return this.options.total
  }

  get p () {
    return (
      this._p +
      sum(
        this.children.map(
          ({ proportion, progress }) => (proportion * progress.percentage) / 100
        )
      )
    )
  }

  get percentage () {
    return (this.p / this.total) * 100
  }

  update (n) {
    this._p = n
    this.onProgress()
    return this
  }

  increase (n = 1) {
    return this.update(this._p + n)
  }

  reset () {
    this.children = []
    return this.update(0)
  }

  async onProgress () {
    if (this.options.onProgress) {
      await this.options.onProgress(this)
    }
  }

  getMaxValue () {
    return this.total - sum(this.children.map(({ proportion }) => proportion))
  }

  async start (func) {
    this.reset()
    await func(this)
    this.update(this.getMaxValue())
  }

  sub (proportion = 1, opts) {
    const progress = new this.constructor({ ...this.options, ...opts })
    this.children.push({
      proportion,
      progress
    })
    return progress
  }

  async all (steps) {
    return await this.start(
      async progress =>
        await Promise.all(
          steps.map(({ proportion, func }) =>
            progress.sub(proportion).start(p => func(p))
          )
        )
    )
  }

  async steps (steps) {
    return await this.start(async progress => {
      for (const { proportion, func } of steps) {
        await progress.sub(proportion).start(p => func(p))
      }
    })
  }
}

export class ReactiveProgress extends Progress {
  sub (proportion = 1, opts) {
    return reactive(super.sub(proportion, opts))
  }
}
