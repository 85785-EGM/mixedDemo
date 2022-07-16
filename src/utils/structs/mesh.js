export function getPoint (positions, index) {
  return {
    index,
    x: positions.getX(index),
    y: positions.getY(index),
    z: positions.getZ(index)
  }
}

export function getFacet (positions, index) {
  return {
    index,
    points: getFacetPoints(positions, index)
  }
}

export function getFacetPoints (positions, index) {
  return [index, index + 1, index + 2].map(i => getPoint(positions, i))
}

export function getFacetIndexFromPoint (point) {
  return point.index - (point.index % 3)
}

export function getFacetFromPoint (positions, point) {
  return getFacet(positions, getFacetIndexFromPoint(point))
}

export function getPointHash (positions, index, shiftMultiplier) {
  return [positions.getX(index), positions.getY(index), positions.getZ(index)]
    .map(i => ~~(i * shiftMultiplier))
    .join(',')
}

export function getPointHashMap (positions, shiftMultiplier) {
  const hashmap = new Map()
  for (let i = 0; i < positions.count; i++) {
    const hash = getPointHash(positions, i, shiftMultiplier)
    if (!hashmap.has(hash)) {
      hashmap.set(hash, [])
    }
    hashmap.get(hash).push(i)
  }
  return hashmap
}
