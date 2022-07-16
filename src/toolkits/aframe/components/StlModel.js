import { Mesh } from 'three'

export default {
  dependencies: ['material'],
  schema: {
    visible: { type: 'boolean', default: true },
    center: { type: 'boolean', default: false },
    src: { type: 'model' }
  },
  update () {
    this.load()
    const mesh = this.el.getObject3D('mesh')
    if (mesh) {
      mesh.visible = this.data.visible
    }
  },
  remove () {
    const mesh = this.el.getObject3D('mesh')
    if (mesh) {
      mesh.geometry.dispose()
      mesh.material.dispose()
      this.el.removeObject3D('mesh')
    }
  },
  async load () {
    if (!this.data.src) return
    this.el.getObject3D('mesh')?.geometry?.dispose()
    const system = this.el.sceneEl.systems['stl-model']
    const geometry = await system.load(
      this.data.src,
      data => {
        this.el.emit('model-loading', data, false)
      },
      { center: this.data.center }
    )
    const material = this.el.components.material.material
    this.el.setAttribute('material', { vertexColors: 'none' })
    const mesh = new Mesh(geometry, material)
    this.el.setObject3D('mesh', mesh)
    this.el.emit('model-loaded', { format: 'stl' }, false)
    mesh.visible = this.data.visible
  }
}
