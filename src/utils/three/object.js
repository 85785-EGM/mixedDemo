import { Vector3 } from 'three'

export function setMatrix (object, matrix) {
  // const { position, quaternion, scale } = object
  // matrix.decompose(position, quaternion, scale)
  object.position.set(0, 0, 0)
  object.rotation.set(0, 0, 0)
  object.scale.set(1, 1, 1)
  object.applyMatrix4(matrix)
}

export function localToWorldPoint (object, point) {
  return object.localToWorld(point)
}

export function worldToLocalPoint (object, point) {
  return object.worldToLocal(point)
}

export function localToWorldDir (object, dir) {
  const target = dir
  const origin = new Vector3(0, 0, 0)
  object.localToWorld(origin)
  object.localToWorld(target)
  target.sub(origin)
  return target
}

export function worldToLocalDir (object, dir) {
  const target = dir
  const origin = new Vector3(0, 0, 0)
  object.worldToLocal(origin)
  object.worldToLocal(target)
  target.sub(origin)
  return target
}

export function setWorldPosition (target, position) {
  const p = new Vector3().copy(position)
  if (target.parent) {
    target.parent.worldToLocal(p)
  }
  target.position.copy(p)
  return p
}

export function copyWorldPosition (target, obj) {
  return setWorldPosition(target, obj.getWorldPosition(new Vector3()))
}

export function getWorldDirection (target, axis = 'x') {
  const dir = new Vector3(0, 0, 0)
  if (typeof axis === 'string') {
    const one = axis.includes('-') ? -1 : 1
    if (axis.includes('x') || axis.includes('X')) {
      dir.x = one
    }
    if (axis.includes('y') || axis.includes('Y')) {
      dir.y = one
    }
    if (axis.includes('z') || axis.includes('Z')) {
      dir.z = one
    }
  } else {
    if (axis?.isVector3) {
      dir.copy(axis)
    }
  }
  const origin = new Vector3()
  target.getWorldPosition(origin)
  target.localToWorld(dir)
  return dir.sub(origin).normalize()
}
