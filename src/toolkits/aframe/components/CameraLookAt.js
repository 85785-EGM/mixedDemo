import { Quaternion, Vector3, MathUtils } from 'three'
const _target = new Vector3()
const _position = new Vector3()
const _direction = new Vector3()
const _lastDirection = new Vector3()
const _quaternion = new Quaternion()
const MIN_ANGLE = MathUtils.DEG2RAD * 0.1
function lookAt (x, y, z) {
  // a drop-replace for camera.lookAt
  if (x.isVector3) {
    _target.copy(x)
  } else {
    _target.set(x, y, z)
  }
  this.updateWorldMatrix(true, false)
  _position.setFromMatrixPosition(this.matrixWorld)
  _direction
    .copy(_target)
    .sub(_position)
    .normalize()
  this.getWorldDirection(_lastDirection)
  if (_lastDirection.angleTo(_direction) > MIN_ANGLE) {
    _quaternion.setFromUnitVectors(_lastDirection, _direction)
    this.quaternion.premultiply(_quaternion)
  }
}

export default {
  dependencies: ['camera', 'camera-orthographic'],
  schema: {},
  init () {
    for (const key of ['camera', 'camera-ortho']) {
      const camera = this.el.getObject3D(key)
      camera.lookAt = lookAt.bind(camera)
    }
    this.target = new Vector3()
  },
  updateTarget (x, y, z) {
    if (x.isVector3) {
      this.target.copy(x)
    } else {
      this.target.set(x, y, z)
    }
    for (const key of ['camera', 'camera-ortho']) {
      const camera = this.el.getObject3D(key)
      camera.lookAt(this.target)
    }
  }
}
