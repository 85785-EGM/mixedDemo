import {
  BufferAttribute,
  BufferGeometry,
  LineSegments,
  Line3,
  LineBasicMaterial,
  Matrix4,
  Mesh,
  Plane,
  PlaneHelper,
  Raycaster,
  Triangle,
  Vector2,
  Vector3,
  MeshLambertMaterial
} from 'three'
import { INTERSECTED, NOT_INTERSECTED } from 'three-mesh-bvh'
import { triangulate } from '../../../utils/three/libtess'
import { Clipping } from '../../../utils/three/Clipping'

const tempPlane = new Plane()
const tempLine = new Line3()
const XY = new Vector3(0, 0, 1).normalize()
const tempVector = new Vector3()

// 从实体中获取平面
function getPlaneFromElement (el, plane = new Plane()) {
  const matrix = el.object3D.matrixWorld.clone()
  const e = matrix.elements
  const startPoint = new Vector3().setFromMatrixPosition(matrix)
  const startNormal = new Vector3(e[8], e[9], e[10]).normalize() // get z dir
  plane.setFromNormalAndCoplanarPoint(startNormal, startPoint)

  return plane
}

function toKey (v = new Vector3(), pow = 14) {
  const array = []
  const p = Math.pow(10, pow)
  for (const x of v.toArray()) {
    array.push(Math.fround(Math.round(Math.fround(x) * p) / p))
  }
  return array.join(',')
}

export default {
  schema: {
    planeEl: { type: 'selector' }
  },
  tick () {
    if (!this.data?.planeEl) return
    getPlaneFromElement(this.data.planeEl, tempPlane)
    const key = `${toKey(tempPlane.normal)}-${tempPlane.constant}`
    if (this.lastKey === key) return
    this.lastKey = key
    const clipping = new Clipping(
      this.el
        .getObject3D('mesh')
        .geometry.toNonIndexed()
        .getAttribute('position')
    )

    const result = clipping.trim(tempPlane)
    const g = new BufferGeometry()
    g.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(result.flatMap(v => v.toArray())), 3)
    )
    this.el.setObject3D(
      'result',
      new Mesh(g, new MeshLambertMaterial({ color: 0xf08080 }))
    )
  }
}
