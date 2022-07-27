import { BufferAttribute } from 'super-three'

export default {
  dependencies: [],
  schema: {},
  init () {},
  update () {
    const mesh = this.el.getObject3D('mesh')
    mesh.material.vertexColors = true

    const count = mesh.geometry.getAttribute('position').count
    const color = new BufferAttribute(new Float32Array(count * 3), 3, true)
    for (let i = 0; i < count; i++) {
      color.setXYZ(i, 1, 0, 0)
    }
    mesh.geometry.setAttribute('color', color)
    // color.needsUpdate = true
    // mesh.geometry.needsUpdate = true
    // mesh.needsUpdate = true
  }
}
