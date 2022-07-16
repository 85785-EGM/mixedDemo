import { Vector3, Euler, Matrix4, Quaternion } from 'three'

const xyzModes = ['+x', '+y', '+z', '-x', '-y', '-z']
const posModes = ['front', 'back', 'left', 'right', 'bottom', 'top']

function buildOffset (mode, distance = 250) {
  const _mode = mode.toLowerCase()
  const offset = new Vector3(30, 30, 30)
  if (['+x', 'left'].includes(_mode)) {
    offset.set(+distance, 0, 0)
  } else if (['-x', 'right'].includes(_mode)) {
    offset.set(-distance, 0, 0)
  } else if (['+y', 'top'].includes(_mode)) {
    offset.set(0, +distance, 0)
  } else if (['-y', 'bottom'].includes(_mode)) {
    offset.set(0, -distance, 0)
  } else if (['+z', 'front'].includes(_mode)) {
    offset.set(0, 0, +distance)
  } else if (['-z', 'back'].includes(_mode)) {
    offset.set(0, 0, -distance)
  }
  return offset
}
function buildRotation (mode) {
  const _mode = mode.toLowerCase()
  const euler = new Euler()
  const pi = Math.PI
  const halfPi = pi * 0.5
  if (['+x', 'left'].includes(_mode)) {
    euler.set(0, halfPi, 0)
  } else if (['-x', 'right'].includes(_mode)) {
    euler.set(0, -halfPi, 0)
  } else if (['+y', 'top'].includes(_mode)) {
    euler.set(-halfPi, 0, 0)
  } else if (['-y', 'bottom'].includes(_mode)) {
    euler.set(halfPi, 0, 0)
  } else if (['+z', 'front'].includes(_mode)) {
    euler.set(0, 0, 0)
  } else if (['-z', 'back'].includes(_mode)) {
    euler.set(0, pi, 0)
  }
  return euler
}

function getTargetMatrix (mode, distance) {
  const position = buildOffset(mode, distance)
  const euler = buildRotation(mode)
  const quaternion = new Quaternion()
  quaternion.setFromEuler(euler)
  const scale = new Vector3(1, 1, 1)
  const matrix = new Matrix4()
  matrix.compose(position, quaternion, scale)
  return matrix
}
export default {
  schema: {
    rotation: { type: 'boolean', default: false },
    target: { type: 'selector', default: '' },
    duration: { type: 'int', default: 300 },
    mode: {
      type: 'string',
      oneOf: [...xyzModes, ...posModes]
    },
    distance: { type: 'number', default: 200 }
  },
  update () {
    const { mode, distance } = this.data
    const camera = this.el.camera
    if (!camera) return
    if (mode === '') return
    const matrix = getTargetMatrix(mode, distance)
    const { position, quaternion, scale } = camera
    matrix.decompose(position, quaternion, scale)
    camera.el.components['camera-look-at'].updateTarget(new Vector3())
  }
}
