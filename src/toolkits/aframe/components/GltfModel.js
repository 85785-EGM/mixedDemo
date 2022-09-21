import { AxesHelper } from 'three'
export default {
  dependencies: [],
  schema: {
    src: { type: 'model' }
  },
  async update () {
    const scene = await this.system.load(this.data.src)
    for (const s of scene.scenes) {
      this.el.setObject3D('gltf-scene', s)
      console.log(s)
    }
  }
}
