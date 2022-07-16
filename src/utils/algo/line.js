import { Vector2, Vector3, Box2 } from 'three'

function filterFacet (values, value = 1) {
  const indices = []
  for (let i = 0; i < values.count; i++) {
    if (values.getX(i) === value) {
      indices.push(i)
    }
  }
  return indices
}
function buildPositions2d (positions, indices) {
  const positions2D = []
  for (const i of indices) {
    positions2D.push(new Vector2(positions.getX(i), positions.getZ(i)))
  }
  return positions2D
}
function buildBox2FromPositions (positions2D, config = {}) {
  const box = new Box2()
  box.setFromPoints(positions2D)
  return box
}
function getMin (positions, indices) {
  let min = positions.getY(indices[0])
  for (const i of indices) {
    const current = positions.getY(i)
    min = min < current ? min : current
  }
  return min
}

function filterPositionWithBox2AndHeight (positions, box2, height) {
  const count = positions.count
  const p0 = new Vector3()
  const p1 = new Vector3()
  const p2 = new Vector3()
  const v2 = new Vector2()
  const indices = []
  for (let i = 0; i < count; i += 3) {
    p0.fromBufferAttribute(positions, i)
    p1.fromBufferAttribute(positions, i + 1)
    p2.fromBufferAttribute(positions, i + 2)
    if (p0.y < height || p0.y < height || p0.y < height) continue // drop the point under height
    if (box2.containsPoint(v2.set(p0.x, p0.z)) === false) continue
    if (box2.containsPoint(v2.set(p1.x, p1.z)) === false) continue
    if (box2.containsPoint(v2.set(p2.x, p2.z)) === false) continue
    indices.push(i, i + 1, i + 2)
  }
  return indices
}
function buildContour (positions2D = []) {
  //   return positions2D.map(a => a)
  return positions2D.filter((v, i) => i % 3 === 0)
  // const count = positions2D.length
  // const contour = []
  // for (let i = 0; i < count; i += 3) {
  //   contour.push(
  //     new Vector2(
  //       positions2D[i].x + positions2D[i + 1].x + positions2D[i + 2].x,
  //       positions2D[i].y + positions2D[i + 1].y + positions2D[i + 2].y
  //     )
  //   )
  // }
  // return contour.map(v2 => v2.divideScalar(3))
}
// function drawContour (draw, positions2D) {
//   draw(positions2D)
// }
export {
  filterFacet,
  buildPositions2d,
  buildContour,
  buildBox2FromPositions,
  filterPositionWithBox2AndHeight,
  getMin
}
