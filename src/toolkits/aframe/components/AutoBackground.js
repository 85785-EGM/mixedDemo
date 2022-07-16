// import { RGBELoader } from 'super-three/examples/jsm/loaders/RGBELoader.js'
// import {
//   PMREMGenerator,
//   UnsignedByteType,
//   EquirectangularReflectionMapping
// } from 'three'
const MODES = { DAY: 'day', NIGHT: 'night', AUTO: 'auto' }
export default {
  dependencies: [],
  schema: {
    night: { type: 'color', default: '#ffffff' },
    day: { type: 'color', default: '#ffffff' },
    mode: {
      type: 'string',
      default: MODES.AUTO,
      oneOf: [...Object.values(MODES)]
    },
    env: { type: 'boolean', default: false }
  },
  init () {
    const scene = this.el.object3D
    scene.environment = null
  },
  update () {
    // return
    const { mode } = this.data
    let state = mode
    if (mode === MODES.AUTO) {
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
      state = prefersDarkMode ? MODES.NIGHT : MODES.DAY
    }

    switch (state) {
      case MODES.DAY:
        this.el.sceneEl.setAttribute('background', {
          color: '#f6f6f6',
          generateEnvironment: false
        })
        break
      case MODES.NIGHT:
        this.el.sceneEl.setAttribute('background', {
          // color: '#181818',
          color: '#f6f6f6',
          generateEnvironment: false
        }) // same with the dark color in wechat
        break
    }
  },
  remove () {}
}
