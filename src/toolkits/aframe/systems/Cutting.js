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

const _r = new Raycaster()
const _v = new Vector3()
const tempLine = new Line3()
const tempVector = new Vector3()

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
  if (
    plane.distanceToPoint(a) >= 0 &&
    plane.distanceToPoint(b) >= 0 &&
    plane.distanceToPoint(c) >= 0
  ) {
    return [a, b, c]
  }
  if (
    plane.distanceToPoint(a) <= 0 &&
    plane.distanceToPoint(b) <= 0 &&
    plane.distanceToPoint(c) <= 0
  ) {
    return []
  }
  return planeIntersectTriangle({ a, b, c }, plane).flat()
}

export default {
  cutting ({ object3D, output, plane = new Plane(), lines = [] }) {
    const geometry = new BufferGeometry()
    output.setObject3D(
      'mesh',
      new Mesh(geometry, output.components.material.material)
    )

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

    const splitTriangle = buildPlaneFacetsWithTess(
      lines2D.flatMap(({ start, end }) => [start, end])
    )

    planeMatrix.invert()

    splitTriangle.forEach(({ a, b, c }) => {
      a.applyMatrix4(planeMatrix)
      b.applyMatrix4(planeMatrix)
      c.applyMatrix4(planeMatrix)
    })

    const attr = object3D.geometry.toNonIndexed().getAttribute('position')
    attr.applyMatrix4(object3D.matrixWorld)
    const result = this.minimumCutting(attr, splitTriangle[0])
    result.applyMatrix4(object3D.matrixWorld.invert())
    geometry.setAttribute('position', result)
    return result
  },

  minimumCutting (attr = new BufferAttribute(), triangle = new Triangle()) {
    // 第一步是删除
    const position = []
    const planeA = new Plane()
    const planeB = new Plane()
    const planeC = new Plane()
    const planeT = triangle.getPlane(new Plane())
    // a,b
    planeA.setFromCoplanarPoints(
      triangle.a,
      triangle.b,
      triangle.a.clone().add(planeT.normal)
    )
    // b,c
    planeB.setFromCoplanarPoints(
      triangle.b,
      triangle.c,
      triangle.b.clone().add(planeT.normal)
    )
    // c,a
    planeC.setFromCoplanarPoints(
      triangle.c,
      triangle.a,
      triangle.c.clone().add(planeT.normal)
    )

    for (let i = 0, count = attr.count; i < count; i += 3) {
      position.push([
        new Vector3().fromBufferAttribute(attr, i),
        new Vector3().fromBufferAttribute(attr, i + 1),
        new Vector3().fromBufferAttribute(attr, i + 2)
      ])
    }

    const result = []

    for (const t of position) {
      result.push(...filterTriangleWithPlane(...t, planeA))
      result.push(...filterTriangleWithPlane(...t, planeB))
      result.push(...filterTriangleWithPlane(...t, planeC))
    }

    return new BufferAttribute(
      new Float32Array(result.flatMap(v => v.toArray())),
      3
    )
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
  }
}
