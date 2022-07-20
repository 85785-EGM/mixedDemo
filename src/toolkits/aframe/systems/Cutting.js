import { PlaneHelper } from 'super-three'
import {
  BufferAttribute,
  BufferGeometry,
  Line3,
  Matrix4,
  Mesh,
  Plane,
  Raycaster,
  Triangle,
  Vector2,
  Vector3
} from 'three'
import { triangulate } from '../components/libtess'
import { INTERSECTED, NOT_INTERSECTED } from 'three-mesh-bvh'

const _r = new Raycaster()
const _v = new Vector3()
const tempLine = new Line3()
const tempVector = new Vector3()
const XY = new Vector3(0, 0, 1).normalize()

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
      tempVector.copy(map.get(toKey(lastPoint, pow))[1])
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

function toKey (v = new Vector3(), pow = 14) {
  const array = []
  const p = Math.pow(10, pow)
  for (const x of v.toArray()) {
    array.push(Math.fround(Math.round(Math.fround(x) * p) / p))
  }
  return array.join(',')
}

function buildPlaneFacetsWithTess (shapePoints = []) {
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

// 根据平面切割三角面片（实际）
function planeIntersectTriangle ({ a, b, c }, plane) {
  let count = 0
  const positions = []
  for (const point of [a, b, c]) {
    if (plane.distanceToPoint(point) >= 0) {
      point.isContained = true
      count++
    }
  }
  if (count === 0) return []
  if (count === 3) return [[a, b, c]]
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

function getIntersectLine ({ a, b, c }, plane) {
  const s = new Vector3()
  const e = new Vector3()
  let isSecond = false
  if (plane.intersectLine(tempLine.set(a, b), tempVector)) {
    s.copy(tempVector)
    isSecond = true
  }
  if (plane.intersectLine(tempLine.set(b, c), tempVector)) {
    if (isSecond) e.copy(tempVector)
    else s.copy(tempVector)
    isSecond = true
  }
  if (plane.intersectLine(tempLine.set(c, a), tempVector)) {
    e.copy(tempVector)
  }
  return new Line3(s, e)
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

// 根据平面切割三角面片（判断）
function filterTriangleWithPlanes (
  a = new Vector3(),
  b = new Vector3(),
  c = new Vector3(),
  planes = [new Plane()]
) {
  const isInclude = plane => {
    if (
      plane.distanceToPoint(a) >= 0 &&
      plane.distanceToPoint(b) >= 0 &&
      plane.distanceToPoint(c) >= 0
    )
      return 1
    if (
      plane.distanceToPoint(a) <= 0 &&
      plane.distanceToPoint(b) <= 0 &&
      plane.distanceToPoint(c) <= 0
    )
      return 0
    return 2
  }
  if (planes.some(plane => isInclude(plane) === 1)) {
    return [a, b, c]
  }
  if (planes.every(plane => isInclude(plane) === 0)) {
    return []
  }

  const intersectLines = planes
    .filter(p => isInclude(p) === 2)
    .map(p => ({
      line: getIntersectLine({ a, b, c }, p),
      plane: p
    }))

  // 裁剪相交线
  let sd
  let se
  let ap = []
  for (const { line, plane } of intersectLines) {
    ap = planes.filter(p => p !== plane)
    ap.forEach(p => {
      sd = p.distanceToPoint(line.start)
      se = p.distanceToPoint(line.end)
      if (sd <= 0 && se <= 0) return
      if (sd < 0 && se > 0) p.intersectLine(line, line.end)
      if (sd > 0 && se < 0) p.intersectLine(line, line.start)
      if (sd > 0 && se > 0) {
        line.end.set(0, 0, 0)
        line.start.set(0, 0, 0)
      }
    })
  }
  // 筛选出实际的相交线
  const rightLines = intersectLines.filter(({ line }) => {
    return line.distance() !== 0
  })
  // 如果只有一条相交线，可以制作简单处理
  if (rightLines.length === 0) return [a, b, c]
  if (rightLines.length === 1) {
    return planeIntersectTriangle({ a, b, c }, rightLines.shift().plane).flat()
  }
  let triangles = []
  let count = 0
  const intersectPlanes = intersectLines.map(({ plane }) => plane)
  if (rightLines.length >= 2) {
    for (const { line, plane } of intersectLines) {
      triangles = triangles.flatMap(([a, b, c]) => {
        return planeIntersectTriangle({ a, b, c }, plane.clone().negate())
      })
      triangles.push(...planeIntersectTriangle({ a, b, c }, plane))
    }
    return triangles.flat()
  }
  return []
}

export default {
  cutting ({ object3D, output, plane = new Plane(), lines = [] }) {
    const geometry = new BufferGeometry()
    output.setObject3D(
      'mesh',
      new Mesh(geometry, output.components.material.material)
    )

    // 将三维线段转化为二维
    const planeMatrix = new Matrix4().makeRotationAxis(
      new Vector3(0, 0, 1).cross(plane.normal).normalize(),
      -new Vector3(0, 0, 1).angleTo(plane.normal)
    )
    const lines2D = lines.map(l => {
      return new Line3(
        l.start.clone().applyMatrix4(planeMatrix),
        l.end.clone().applyMatrix4(planeMatrix)
      )
    })
    // 细分轮廓线
    const splitTriangle = buildPlaneFacetsWithTess(
      lines2D.flatMap(({ start, end }) => [start, end])
    )
    // 重新转为三位坐标
    planeMatrix.invert()
    splitTriangle.forEach(({ a, b, c }) => {
      a.applyMatrix4(planeMatrix)
      b.applyMatrix4(planeMatrix)
      c.applyMatrix4(planeMatrix)
    })

    // 将细分后的轮廓线转换为平面
    const splitTrianglePlanes = []
    for (const triangle of splitTriangle) {
      const planeT = triangle.getPlane(new Plane())
      // a,b
      splitTrianglePlanes.push([
        new Plane().setFromCoplanarPoints(
          triangle.a,
          triangle.b,
          triangle.a.clone().add(planeT.normal)
        ),
        // b,c
        new Plane().setFromCoplanarPoints(
          triangle.b,
          triangle.c,
          triangle.b.clone().add(planeT.normal)
        ),
        // c,a
        new Plane().setFromCoplanarPoints(
          triangle.c,
          triangle.a,
          triangle.c.clone().add(planeT.normal)
        )
      ])
    }

    // 切割三角面片
    const attr = object3D.geometry.toNonIndexed().getAttribute('position')
    attr.applyMatrix4(object3D.matrixWorld)
    let result = attr
    for (const st of splitTrianglePlanes) {
      result = this.minimumCutting(result, st)
    }
    result.applyMatrix4(object3D.matrixWorld.invert())

    // 修补三角面片
    if (!object3D.geometry.boundsTree) object3D.geometry.computeBoundsTree()
    const repairTriangles = []
    for (const st of splitTrianglePlanes) {
      repairTriangles.push(...this.fillShape(object3D.geometry.boundsTree, st))
    }

    geometry.setAttribute(
      'position',
      new BufferAttribute(
        new Float32Array([
          ...result.array,
          ...this.removeRepeat(repairTriangles)
        ]),
        3
      )
    )
    return result
  },

  minimumCutting (attr = new BufferAttribute(), [planeA, planeB, planeC]) {
    // 第一步是删除
    const position = []
    for (let i = 0, count = attr.count; i < count; i += 3) {
      position.push([
        new Vector3().fromBufferAttribute(attr, i),
        new Vector3().fromBufferAttribute(attr, i + 1),
        new Vector3().fromBufferAttribute(attr, i + 2)
      ])
    }

    const result = []

    for (const t of position) {
      result.push(...filterTriangleWithPlanes(...t, [planeA, planeB, planeC]))
    }

    return new BufferAttribute(
      new Float32Array(result.flatMap(v => v.toArray())),
      3
    )
  },

  fillShape (bvh, planes) {
    const triangles = planes
      .flatMap(plane => {
        const lines = this.doCast(bvh, plane)
        if (lines.length === 0) return undefined
        const { points, matrix } = coplanarPoints(
          connectLines(
            sortLines(lines, true).filter(a => a.length > 0)
          ).flatMap(({ start, end }) => [start, end]),
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
          const triPlane = triangles[0].getPlane(new Plane())
          if (triPlane.constant * plane.constant > 0) {
            triangles.forEach(({ a, b, c }) => {
              tempVector.copy(a)
              a.copy(c)
              c.copy(tempVector)
            })
          }
        }

        return {
          triangle: triangles.map(({ a, b, c }) => [a, b, c]),
          plane
        }
      })
      .filter(x => x)

    return triangles.map(({ triangle, plane }, i) => {
      const otherPlanes = planes
        .filter(p => p !== plane)
        .map(p => p.clone().negate())
      const ma = []
      const array = []
      for (const [a, b, c] of triangle) {
        ma.push(...planeIntersectTriangle({ a, b, c }, otherPlanes[0]))
      }
      for (const [a, b, c] of ma) {
        array.push(...planeIntersectTriangle({ a, b, c }, otherPlanes[1]))
      }
      return { plane, array: array.flat().flatMap(v => v.toArray()) }
    })
  },

  removeRepeat (triangles) {
    const pow = 6
    function round (x) {
      const p = Math.pow(10, pow)
      return Math.fround(Math.round(Math.fround(x) * p) / p)
    }
    function setMap (key, value) {
      if (map.has(key)) map.get(key).push(value)
      else map.set(key, [value])
    }

    const map = new Map()
    const list = []
    triangles.forEach(({ array, plane }) => {
      const np = plane.clone().negate()
      const key1 = `${toKey(plane.normal, pow)} (${round(plane.constant)})`
      const key2 = `${toKey(np.normal, pow)} (${round(np.constant)})`
      setMap(key1, array)
      setMap(key2, array)
    })

    map.forEach((v, k) => {
      if (v.length === 1) {
        list.push(...v[0])
      }
    })

    return list
  },

  getPlaneAndLinesFromEvent (points = []) {
    const cameraPlane = new Plane(this.el.camera.position.clone().normalize())
    const lines = []
    const linePoints = points.flatMap(p => {
      _r.setFromCamera(
        new Vector2(
          (p.x / window.innerWidth) * 2 - 1,
          -(p.y / window.innerHeight) * 2 + 1
        ),
        this.el.camera
      )
      _r.ray.intersectPlane(cameraPlane, _v)

      return [_v.clone(), _v.clone()]
    })
    linePoints.push(linePoints.shift())

    for (let i = 0; i < linePoints.length; i += 2) {
      lines.push(new Line3(linePoints[i], linePoints[i + 1]))
    }
    return {
      plane: cameraPlane,
      lines
    }
  },

  doCast (bvh, plane = new Plane(), matrix = new Matrix4()) {
    const lines = []
    const m = matrix.clone().invert()
    bvh.shapecast({
      intersectsBounds: box => {
        const intersected = plane.intersectsBox(box)
        return intersected ? INTERSECTED : NOT_INTERSECTED
      },

      intersectsTriangle: tri => {
        const cross = []
        const { a, b, c } = tri
        for (const [p0, p1] of [
          [a, b],
          [b, c],
          [c, a]
        ]) {
          tempLine.start.copy(p0)
          tempLine.end.copy(p1)
          if (plane.distanceToPoint(p0) === 0) {
            cross.push(new Vector3(p0.x, p0.y, p0.z).applyMatrix4(m))
          }
          if (plane.intersectsLine(tempLine)) {
            if (plane.intersectLine(tempLine, tempVector)) {
              cross.push(
                new Vector3(
                  tempVector.x,
                  tempVector.y,
                  tempVector.z
                ).applyMatrix4(m)
              )
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
}
