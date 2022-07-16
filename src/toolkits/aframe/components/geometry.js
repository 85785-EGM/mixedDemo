import { BufferGeometry, BufferAttribute, Line3, Vector3 } from 'three'
export function buildGeometryFromPositions (positionArray = []) {
  const geometry = new BufferGeometry()
  const count = positionArray.length
  const positions = new BufferAttribute(new Float32Array(count * 3), 3, false)
  for (let i = 0; i < count; i++) {
    positions.setXYZ(i, ...positionArray[i].toArray())
  }
  geometry.setAttribute('position', positions)
  geometry.computeVertexNormals()
  return geometry
}
export function buildGeometryFromFacets (facets = []) {
  return buildGeometryFromPositions(facets.map(t => [t.a, t.b, t.c]).flat())
}
export function buildColorGeometryFromFacets (facets = []) {
  const geometry = new BufferGeometry()
  const positionArray = facets.map(t => [t.a, t.b, t.c]).flat()
  const colorsArray = facets.map(t => [t.color, t.color, t.color]).flat()
  const count = positionArray.length
  const positions = new BufferAttribute(new Float32Array(count * 3), 3, false)
  const colors = new BufferAttribute(new Float32Array(count * 3), 3, false)
  for (let i = 0; i < count; i++) {
    positions.setXYZ(i, ...positionArray[i].toArray())
    colors.setXYZ(i, ...colorsArray[i].toArray())
  }
  geometry.setAttribute('position', positions)
  geometry.setAttribute('color', colors)
  geometry.computeVertexNormals()
  return geometry
}
export function buildPosAttrFromLines (lines = []) {
  const positions = []
  for (const line of lines) {
    const { start, end } = line
    positions.push(start, end)
  }
  const attribute = new BufferAttribute(
    new Float32Array(positions.length * 3),
    3
  )
  for (let i = 0; i < positions.length; i++) {
    const { x, y, z } = positions[i]
    attribute.setXYZ(i, x, y, z)
  }
  return attribute
}
export function buildLinesFromPositions (positions = new BufferAttribute()) {
  const count = positions.count
  const lines = []
  for (let i = 0; i < count; i += 2) {
    const line = new Line3()
    line.start.fromBufferAttribute(positions, i)
    line.end.fromBufferAttribute(positions, i + 1)
    lines.push(line)
  }
  return lines
}

export function checkGeometry (geometry) {
  return (
    !!geometry &&
    geometry?.getAttribute('position') &&
    geometry.getAttribute('position').count > 3
  )
}

export function fixVector3 (
  vec3 = new Vector3(),
  digit = 4,
  target = new Vector3()
) {
  const zero = 0
  const zeroFixed = zero.toFixed(digit)
  const minusZeroFixed = '-' + zeroFixed
  target.set(
    ...[vec3.x, vec3.y, vec3.z]
      .map(n => n.toFixed(digit))
      .map(n => (n === minusZeroFixed ? zeroFixed : n))
      .map(n => Number(n))
  )
  return target
}
