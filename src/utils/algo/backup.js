import * as three from 'three'

function getXYZArrayFromBufferAttribute (bufferAttribute) {
  const { count } = bufferAttribute
  const x = []
  const y = []
  const z = []
  for (let i = 0; i < count; i++) {
    x.push(bufferAttribute.getX(i))
    y.push(bufferAttribute.getY(i))
    z.push(bufferAttribute.getZ(i))
  }
  return { xArray: x, yArray: y, zArray: z }
}

function pointsInBall (
  pointArray,
  ball = { center: { x: 0, y: 0, z: 0 }, distance: 2 },
  config = {}
) {
  const count = pointArray.count
  const { center, distance } = ball
  const pointLocal = new three.Vector3(center.x, center.y, center.z)
  const p = new three.Vector3()
  const distance2Threshold = distance ** 2
  const filterIndices = []
  for (let i = 0; i < count; i++) {
    p.fromBufferAttribute(pointArray, i)
    const distance2 = p.distanceToSquared(pointLocal)
    if (distance2 < distance2Threshold) {
      filterIndices.push(i)
    }
  }
  return { indices: filterIndices }
}

function normalAngleInRange (
  normalArray,
  normal = { x: 0, y: 0, z: 0 },
  config = { indices: [], angleDeg: 10 }
) {
  const p = new three.Vector3()
  const count = normalArray.count
  const angleRadian = (config.angleDeg || 10) * three.MathUtils.DEG2RAD
  const filterIndices = []
  const indices = config.indices || [...Array(count)].map((v, i) => i)
  for (const i of indices) {
    p.fromBufferAttribute(normalArray, i)
    if (p.angleTo(normal) < angleRadian) {
      filterIndices.push(i)
    }
  }
  return { indices: filterIndices }
}

function makeLevel (
  pointArray,
  originFace,
  config = { indices: [], maxLevel: 5 }
) {
  const minDistance = 0.0001
  const _v3 = new three.Vector3()
  const _maxLevel = config.maxLevel || 5
  function vec3 (index) {
    return _v3.fromBufferAttribute(pointArray, index)
  }
  function sameVec3 (p0, p1) {
    if (p0.manhattanDistanceTo(p1) < minDistance) {
      return true
    }
    return false
  }
  const { a, b, c } = originFace
  const levels = []
  const pointPool = new Set(config.indices.filter(i => i % 3 === 0))
  levels.push([a, b, c])
  pointPool.delete(a)
  pointPool.delete(b)
  pointPool.delete(c)
  function buildNextLevel () {
    const currentLevel = []
    const checkPoints = levels[levels.length - 1].map(i => vec3(i).clone())
    function sameVec3InFacet (p) {
      for (const point of checkPoints) {
        if (sameVec3(p, point)) {
          return true
        }
      }
      return false
    }
    for (const i of pointPool.values()) {
      if (pointPool.has(i) === false) {
        continue
      }
      const findSame =
        sameVec3InFacet(vec3(i)) ||
        sameVec3InFacet(vec3(i + 1)) ||
        sameVec3InFacet(vec3(i + 2))
      if (findSame) {
        pointPool.delete(i)
        pointPool.delete(i + 1)
        pointPool.delete(i + 2)
        currentLevel.push(i, i + 1, i + 2)
      }
    }
    return currentLevel
  }
  for (let level = 0; level < _maxLevel; level++) {
    const nextLevel = buildNextLevel()
    if (nextLevel.length > 0) {
      levels.push(nextLevel)
    }
  }
  // levels.forEach((l, i) => { console.debug('level', i, l) })
  return { levels }
}

function toFace (indices) {
  const faceIndices = []
  for (const i of indices) {
    faceIndices.push(Math.round(i / 3))
  }
  const faceIndicesMerge = [...new Set(faceIndices)]
  const output = []
  for (const i of faceIndicesMerge) {
    const i3 = i * 3
    output.push(i3, i3 + 1, i3 + 2)
  }
  return output
}

export const filter = { pointsInBall, normalAngleInRange }

export const filler = { toFace }

export const levels = { makeLevel }
