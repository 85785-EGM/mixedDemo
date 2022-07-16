import { DirectionalLight } from 'three'
export default {
  dependencies: [],
  schema: {
    color: { type: 'color', default: '#000' },
    intensity: { type: 'number', default: 1 }
  },
  init () {
    this.light = new DirectionalLight()
    this.rendererSystem = this.el.sceneEl.systems.renderer
    this.el.sceneEl.systems.light.registerLight(this.el)
    this.el.setObject3D('light', this.light)
  },
  update () {
    const { color, intensity } = this.data
    console.log(color)
    const light = this.light
    light.intensity = intensity
    light.color.set(color)
    this.rendererSystem.applyColorCorrection(light.color)
  },
  tick () {
    const camera = this.el.sceneEl.camera
    // this.light.position
    camera.getWorldPosition(this.light.position)
  },
  remove () {
    this.el.removeObject3D('light')
  }
}
