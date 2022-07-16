export default {
  schema: {
    enabled: { type: 'boolean', default: true }
  },
  init () {
    this.timers = {}
    this.initTime = Date.now()
  },
  reset (timeID) {
    const timeIDs = []
    if (typeof timeID === 'string') {
      timeIDs.push(timeID)
    } else if (Array.isArray(timeID)) {
      timeIDs.push(...timeID)
    }
    for (const timeID of timeIDs) {
      const timer = this.timers[timeID]
      if (timer) {
        this.timers[timeID] = 0
      }
    }
  },
  resetAll () {
    this.timers = {}
  },
  update () {},
  addTime (timeID = 'default', milliseconds = 0) {
    if (!this.data.enabled) return
    const timeIDs = []
    if (typeof timeID === 'string') {
      timeIDs.push(timeID)
    } else if (Array.isArray(timeID)) {
      timeIDs.push(...timeID)
    }
    for (const timeID of timeIDs) {
      const timer = this.timers[timeID]
      if (timer) {
        this.timers[timeID] += milliseconds
      } else {
        this.timers[timeID] = milliseconds
      }
    }
  },
  print () {
    const tables = {}
    const timers = this.dumpData()
    for (const [k, v] of Object.entries(timers)) {
      tables[k] = parseInt(v / 1000) + 's'
    }
    console.table(tables)
    return tables
  },
  dumpData () {
    this.timers.sinceInit = Date.now() - this.initTime
    return this.timers
  }
}
