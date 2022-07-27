import {
  BufferAttribute,
  BufferGeometry,
  Line,
  Line3,
  LineBasicMaterial,
  Matrix4,
  Mesh,
  Plane,
  PlaneHelper,
  Raycaster,
  Triangle,
  Vector2,
  Vector3
} from 'three'
import { INTERSECTED, NOT_INTERSECTED } from 'three-mesh-bvh'
import { triangulate } from './libtess'

const tempPlane = new Plane()
const tempLine = new Line3()
const XY = new Vector3(0, 0, 1).normalize()
const tempVector = new Vector3()

function toKey (v = new Vector3(), pow = 14) {
  const array = []
  const p = Math.pow(10, pow)
  for (const x of v.toArray()) {
    array.push(Math.fround(Math.round(Math.fround(x) * p) / p))
  }
  return array.join(',')
}

// 根据平面切割三角面片（实际）
function planeIntersectTriangle ({ a, b, c }, plane) {
  let count = 0
  const positions = []
  for (const point of [a, b, c]) {
    if (plane.distanceToPoint(point) > 0) {
      point.isContained = true
      count++
    }
  }
  if (count === 0 || count === 3) return { positions }
  let firstFoundIsAB = false

  const s = new Vector3() // line start
  const e = new Vector3() // line end

  // line AB
  tempLine.start.copy(a)
  tempLine.end.copy(b)
  if (plane.intersectLine(tempLine, tempVector)) {
    s.copy(tempVector)
    firstFoundIsAB = true
  }

  // line BC
  tempLine.start.copy(b)
  tempLine.end.copy(c)
  if (plane.intersectLine(tempLine, tempVector)) {
    if (firstFoundIsAB) {
      e.copy(tempVector)
      // intersect AB BC
      if (count === 1) {
        positions.push([s, b, e]) // s,b,e
      } else {
        positions.push([s, e, c]) // s,e,c
        positions.push([c, a, s]) // c,a,s
      }
    } else {
      s.copy(tempVector)
    }
  }
  // return true
  // line CA
  tempLine.start.copy(c)
  tempLine.end.copy(a)
  if (plane.intersectLine(tempLine, tempVector)) {
    e.copy(tempVector)
    if (firstFoundIsAB) {
      // intersect AB + CA
      if (count === 1) {
        positions.push([a, s, e]) // a,s,e
      } else {
        positions.push([s, b, e]) // s,b,e
        positions.push([b, c, e]) // b,c,e
      }
    } else {
      // intersect BC + CA
      if (count === 1) {
        positions.push([s, c, e]) // s,c,e
      } else {
        positions.push([a, b, e]) // a,b,e
        positions.push([b, s, e]) // b,s,e
      }
    }
  }
  return positions
}

// 根据平面切割三角面片（判断）
function filterTriangleWithPlane (
  a = new Vector3(),
  b = new Vector3(),
  c = new Vector3(),
  plane = new Plane()
) {
  tempPlane.setFromCoplanarPoints(a, b, c)
  // 删除共面的
  if (Math.abs(tempPlane.normal.dot(plane.normal)) > 1.0 - 1e-10) {
    if (
      Math.round(Math.fround(tempPlane.constant) * 10000) ===
      Math.round(Math.fround(plane.constant) * 10000)
    ) {
      return []
    }
  }
  // 完全在平面内的
  if (
    plane.distanceToPoint(a) >= 0 &&
    plane.distanceToPoint(b) >= 0 &&
    plane.distanceToPoint(c) >= 0
  ) {
    return [a, b, c]
  }
  // 完全不在平面内的
  if (
    plane.distanceToPoint(a) <= 0 &&
    plane.distanceToPoint(b) <= 0 &&
    plane.distanceToPoint(c) <= 0
  ) {
    return []
  }
  return planeIntersectTriangle({ a, b, c }, plane).flat()
}

// 找相交轮廓线
function doCast (bvh, plane = new Plane()) {
  const lines = []
  const cross = []
  bvh.shapecast({
    intersectsBounds: box => {
      const intersected = plane.intersectsBox(box)
      return intersected ? INTERSECTED : NOT_INTERSECTED
    },

    intersectsTriangle: tri => {
      const { a, b, c } = tri
      cross.length = 0
      for (const [p0, p1] of [
        [a, b],
        [b, c],
        [c, a]
      ]) {
        tempLine.start.copy(p0)
        tempLine.end.copy(p1)
        if (plane.distanceToPoint(p0) === 0) {
          cross.push(p0.clone())
        }
        if (plane.intersectsLine(tempLine)) {
          if (plane.intersectLine(tempLine, tempVector)) {
            cross.push(tempVector.clone())
          }
        }
      }
      if (cross.length === 2) {
        lines.push(new Line3(...cross))
      }
    }
  })
  return lines
}

// 线条排序，maximum控制线条最大数量，needAll控制是否获取多条线
function sortLines (lines = [new Line3()], needAll = false, maximum = 20) {
  if (lines.length === 0) return []
  const map = new Map()
  // 精度，精度过高或过低，都会影响效果
  const pow = 6

  function setMap (key, value) {
    if (map.has(key)) map.get(key).push(value)
    else map.set(key, [value])
  }
  // 提取相连的线，每次只提取一根连续的线条
  function extractConjointLines (map) {
    const firstPoint = map
      .values()
      .next()
      .value[0].clone()
    const lastPoint = map
      .values()
      .next()
      .value[0].clone()
    const has = []
    const array = []

    for (let i = 0, count = lines.length; i < count; i++) {
      has.push(toKey(lastPoint, pow))
      if (map.get(toKey(lastPoint, pow))?.length === undefined) break
      // 判断非闭合形状
      if (map.get(toKey(lastPoint, pow)).length === 1) {
        tempVector.copy(map.get(toKey(lastPoint, pow))[0])
      }
      // 获取未连接的下一个点
      tempVector.copy(map.get(toKey(lastPoint, pow)).at(-1))
      if (has.includes(toKey(tempVector, pow))) {
        tempVector.copy(map.get(toKey(lastPoint, pow))[0])
      }
      // 排序
      array.push(new Line3(lastPoint.clone(), tempVector.clone()))
      lastPoint.copy(tempVector)
      // 优化
      if (toKey(firstPoint, pow) === toKey(lastPoint, pow)) {
        break
      }
    }
    return array
  }

  // lines -> map
  lines.forEach(({ start, end }) => {
    setMap(toKey(start, pow), end.clone())
    setMap(toKey(end, pow), start.clone())
  })

  if (needAll) {
    const lineArray = [extractConjointLines(map)]
    // 这一步为了将各个不相连的线分开
    for (let i = 0; i < maximum; i++) {
      lineArray.flat().forEach(({ start, end }) => {
        map.delete(toKey(start, pow))
        map.delete(toKey(end, pow))
      })
      if (map.size === 0) break
      lineArray.push(extractConjointLines(map))
    }
    // 这一步是连接不相连的线
    return lineArray
  }
  return extractConjointLines(map)
}

function coplanarPoints (points = [new Vector3()], plane = new Plane()) {
  const axis = plane
    .clone()
    .normal.cross(XY)
    .normalize()
  const angle = plane.normal.angleTo(XY)
  const rotation = new Matrix4()
  const array = []
  const translation = new Matrix4()

  rotation.makeRotationAxis(axis, angle)
  for (const p of points) {
    const v = p.clone().applyMatrix4(rotation)
    translation.makeTranslation(0, 0, -v.z)
    array.push(v.setZ(0))
  }
  return {
    points: array,
    matrix: translation
      .clone()
      .multiply(rotation)
      .invert()
  }
}

// 连接所有的小线条
function connectLines (array = []) {
  if (array.length === 0) return []
  const s = new Vector3()
  const e = new Vector3()
  const pow = 6
  // 补全线条
  for (const lines of array) {
    s.copy(lines.at(0).start)
    e.copy(lines.at(-1).end)
    if (toKey(s, pow) !== toKey(e, pow)) {
      lines.push(new Line3(e.clone(), s.clone()))
    }
  }

  // 连接线条
  const origin = array[0][0].start.clone()
  for (const lines of array.slice(1)) {
    tempVector.copy(lines.at(0).start)
    lines.push(new Line3(tempVector.clone(), origin.clone()))
    lines.splice(0, 0, new Line3(origin.clone(), tempVector.clone()))
    origin.copy(lines.at(0).start)
  }
  return array.flat()
}

function buildPlaneFacetsWithTess (
  shapePoints = [new Vector3(), new Vector3()]
) {
  const data = shapePoints.map(p => [p.x, p.y]).flat()
  const xy = triangulate([data])
  const facets = []
  const vec3 = []
  for (let i = 0; i < xy.length; i += 2) {
    vec3.push(new Vector3(xy[i], xy[i + 1], 0)) // fill z = 0
  }
  for (let i = 0; i < vec3.length; i += 3) {
    const facet = new Triangle(vec3[i], vec3[i + 1], vec3[i + 2])
    facets.push(facet)
  }
  return facets
}

export class Clipping {
  constructor (attribute = new BufferAttribute(), autoComputed = true) {
    this.bvh = {}
    this.autoComputed = autoComputed
    this.attribute = attribute
  }

  trim (plane = new Plane()) {
    return [...this.filter(plane), ...this.repair(plane)]
  }

  filter (plane = new Plane()) {
    const triangle = []
    const originT = []
    const attr = this.attribute
    for (let i = 0, count = attr.count; i < count; i += 3) {
      originT.push([
        tempVector.fromBufferAttribute(attr, i).clone(),
        tempVector.fromBufferAttribute(attr, i + 1).clone(),
        tempVector.fromBufferAttribute(attr, i + 2).clone()
      ])
    }
    // 切割
    for (const t of originT) {
      triangle.push(...filterTriangleWithPlane(...t, plane))
    }
    return triangle
  }

  repair (plane = new Plane()) {
    const lines = doCast(this.bvh, plane.clone())
    if (lines === 0) return []

    const { points, matrix } = coplanarPoints(
      connectLines(sortLines(lines, true).filter(a => a.length > 0)).flatMap(
        ({ start, end }) => [start, end]
      ),
      plane
    )
    const triangles = buildPlaneFacetsWithTess(points)
    triangles.forEach(({ a, b, c }) => {
      a.applyMatrix4(matrix)
      b.applyMatrix4(matrix)
      c.applyMatrix4(matrix)
    })
    // 判断是否反向
    if (triangles.length > 3) {
      triangles[0].getPlane(tempPlane)
      if (tempPlane.normal.dot(plane.normal) > 0) {
        triangles.forEach(({ a, b, c }) => {
          tempVector.copy(a)
          a.copy(c)
          c.copy(tempVector)
        })
      }
    }
    return triangles.flatMap(({ a, b, c }) => [a, b, c])
  }

  set attribute (value) {
    this._attribute = value
    if (!this.autoComputed) return
    const g = new BufferGeometry().setAttribute('position', value)
    g.computeBoundsTree()
    this.bvh = g.boundsTree
  }

  get attribute () {
    return this._attribute
  }
}
