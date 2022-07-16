import * as aframe from 'aframe'

export class Toolkit {
  constructor ({
    components = {},
    geometries = {},
    primitives = {},
    shaders = {},
    systems = {}
  }) {
    this.components = components
    this.geometries = geometries
    this.primitives = primitives
    this.shaders = shaders
    this.systems = systems
  }

  parse (key) {
    return key
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-+/g, '')
  }

  install (app) {
    Object.entries(this.components).forEach(([key, component]) => {
      // for (const [k, v] of Object.entries(component)) {
      //   if (typeof v?.clone === 'function') {
      //     console.error(key, 'k', k)
      //   }
      // }
      aframe.registerComponent(this.parse(key), component)
      console.debug('Aframe component registered:', this.parse(key))
    })
    Object.entries(this.geometries).forEach(([key, geometry]) => {
      aframe.registerGeometry(this.parse(key), geometry)
      console.debug('Aframe geometry registered:', this.parse(key))
    })
    Object.entries(this.primitives).forEach(([key, primitive]) => {
      aframe.registerPrimitive(this.parse(key), primitive)
      console.debug('Aframe primitive registered:', this.parse(key))
    })
    Object.entries(this.shaders).forEach(([key, shader]) => {
      aframe.registerShader(this.parse(key), shader)
      console.debug('Aframe shader registered:', this.parse(key))
    })
    Object.entries(this.systems).forEach(([key, system]) => {
      aframe.registerSystem(this.parse(key), system)
      console.debug('Aframe system registered:', this.parse(key))
    })
  }
}
