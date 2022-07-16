export default {
  dependencies: [],
  schema: {
    enabled: { default: true, type: 'boolean' },
    eventName: { default: 'shoot', type: 'string' },
    extraData: { default: [], type: 'array' },
    elDataName: { default: '', type: 'string' },
    emitEl: { type: 'selector' },
    ctrlEventName: { default: 'shoot-ctrl', type: 'string' },
    debug: { default: false, type: 'boolean' }
  },
  init () {
    this.clickCount = 0
  },
  update () {
    if (this.data.debug) console.debug('update', this.el.id, this.data)
  },
  events: {
    click: function (event) {
      if (!this.data.enabled) return
      if (event.target !== this.el) return
      if (this.data.debug) console.debug('emit', this, this.el)
      const { eventName, ctrlEventName } = this.data
      const emitEventName =
        event.detail.ctrlKey || event.detail.metaKey ? ctrlEventName : eventName
      const emitEl = this.data.emitEl ?? this.el
      const { elDataName } = this.data
      const elData = {}
      if ((elDataName ?? '').trim().length > 0) {
        const elDataLoad = this.el[elDataName]
        if (typeof elDataLoad === 'object') {
          Object.assign(elData, elDataLoad)
        }
      }
      emitEl.emit(
        emitEventName,
        {
          intersection: event.detail.intersection,
          count: this.clickCount,
          extraData: this.data.extraData,
          elData: elData
        },
        false
      )
    }
  },
  remove: function () {}
}
