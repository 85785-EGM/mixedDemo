import { AxesHelper } from 'three'
export default {
  dependencies: [],
  schema: {
    visible: { type: 'boolean', default: true },
    size: { type: 'number', default: 20 }
  },
  update () {
    const axes = new AxesHelper(this.data.size)
    this.el.sceneEl.setObject3D('axes-helper', axes)
  }
}
