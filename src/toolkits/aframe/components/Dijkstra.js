import {
  BufferAttribute,
  Mesh,
  Line3,
  Plane,
  Vector3,
  MeshBasicMaterial,
  BufferGeometry,
  Points,
  PointsMaterial
} from 'three'
import Dijkstra from '@/utils/three/Dijkstra'

const _v = new Vector3()

export default {
  dependencies: [],
  schema: {
    inputEl: { type: 'selector' },
    start: { type: 'number' },
    end: { type: 'number' }
  },
  getPosition () {
    const mesh = this.data.inputEl.getObject3D('mesh')
    if (mesh.geometry.index) {
      return mesh.geometry.toNonIndexed().getAttribute('position')
    } else return mesh.geometry.getAttribute('position')
  },
  init () {},
  update () {
    if (!(this.data.start > 0 && this.data.end > 0)) return
    const position = this.getPosition()
    if (!this.dijkstra) this.dijkstra = new Dijkstra(position)

    const result = this.dijkstra.do(this.data.start, this.data.end)

    this.showPoint('green', _v.fromBufferAttribute(position, this.data.start))
    this.showPoint('red', _v.fromBufferAttribute(position, this.data.end))
    this.showPoint('blue', ...result)
    _v.set(0, 0, 0)
    result.forEach(p => _v.add(p))
    _v.divideScalar(result.length)
    this.showPoint('black', _v)
  },

  showPoint (color = 'red', ...vectors) {
    const geometry = new BufferGeometry()
    const position = new BufferAttribute(
      new Float32Array(vectors.map(v => v.toArray()).flat()),
      3
    )
    geometry.setAttribute('position', position)

    this.el.object3D.add(
      new Points(geometry, new PointsMaterial({ color, size: 0.8 }))
    )
  }
}
