import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Object3D,
  OrthographicCamera,
  Vector2,
  Vector3
} from 'three'

function copyCamera (from, to) {
  const { position, quaternion, scale } = to
  const { distance, far, near } = from
  to.far = far
  to.near = near
  from.matrix.decompose(position, quaternion, scale)
  if (to.isOrthographicCamera) {
    to.setDistance(distance)
  }
}
class Grid extends LineSegments {
  constructor (
    size = 10,
    divisions = 10,
    color1 = 0xff0000,
    color2 = 0x880000,
    color3 = 0xdddddd
  ) {
    color1 = new Color(color1)
    color2 = new Color(color2)
    color3 = new Color(color3)
    const center = divisions / 2
    const step = size / divisions
    const halfSize = size / 2
    const vertices = []
    const colors = []
    const getColor = (i, center) => {
      if (i === center) return color1
      if ((i - center) % 10 === 0) return color2
      return color3
    }
    for (let i = 0, j = 0, k = -halfSize; i <= divisions; i++, k += step) {
      vertices.push(-halfSize, 0, k, halfSize, 0, k)
      vertices.push(k, 0, -halfSize, k, 0, halfSize)
      const color = getColor(i, center)
      color.toArray(colors, j)
      j += 3
      color.toArray(colors, j)
      j += 3
      color.toArray(colors, j)
      j += 3
      color.toArray(colors, j)
      j += 3
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    const material = new LineBasicMaterial({
      vertexColors: true,
      toneMapped: false,
      transparent: true,
      opacity: 0.3
    })
    super(geometry, material)
    this.type = 'Grid'
  }
}
export default {
  dependencies: ['camera'],
  schema: {
    enabled: { type: 'boolean', default: false },
    grid: { type: 'boolean', default: false }
  },
  init () {
    this.last = new Vector2()
    this.target = new Vector3()
    this.grid = new Grid(1000, 1000)
    const p = new Object3D()
    p.add(this.grid)
    const orthoCamera = new OrthographicCamera(-1, 1, 1, -1)
    orthoCamera.add(p)
    p.add(this.grid)
    p.position.set(0, 0, -1)
    this.grid.rotateX(Math.PI / 2)
    orthoCamera.setDistance = distance => {
      const originCamera = orthoCamera.el.getObject3D('camera')
      const { fov, aspect } = originCamera
      const width = distance * Math.tan(MathUtils.DEG2RAD * fov * 0.5)
      const height = width / aspect
      orthoCamera.left = -width
      orthoCamera.right = width
      orthoCamera.top = height
      orthoCamera.bottom = -height
      orthoCamera.updateProjectionMatrix()
    }
    this.camera = orthoCamera
    this.el.setObject3D('camera-ortho', orthoCamera)
  },
  update () {
    const { enabled, grid } = this.data
    const sceneEl = this.el.sceneEl
    const originCamera = this.el.getObject3D('camera')
    if (enabled && sceneEl.camera === originCamera) {
      copyCamera(originCamera, this.camera)
      sceneEl.camera = this.camera
    } else if (!enabled && sceneEl.camera === this.camera) {
      copyCamera(this.camera, originCamera)
      sceneEl.camera = originCamera
    }
    this.grid.visible = grid && enabled
  },
  remove () {
    const originCamera = this.el.getObject3D('camera')
    const sceneEl = this.el.sceneEl
    if (sceneEl.camera === this.camera) {
      if (originCamera) {
        sceneEl.camera = originCamera
      }
    }
  }
}
