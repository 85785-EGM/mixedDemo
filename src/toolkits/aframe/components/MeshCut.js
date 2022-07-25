import {
  Plane,
  DoubleSide,
  PlaneBufferGeometry,
  MeshBasicMaterial,
  Vector2,
  Vector3,
  Line3,
  Ray,
  Box3,
  Box2,
  Matrix4,
  Triangle,
  BufferGeometry,
  BufferAttribute,
  Mesh,
  LineSegments,
  LineBasicMaterial,
  MeshLambertMaterial
} from 'three'
import { LineMaterial } from 'super-three/examples/jsm/lines/LineMaterial'
import { NOT_INTERSECTED, INTERSECTED, CONTAINED } from 'three-mesh-bvh'
import { buildMeshesKey, buildVectorKey } from './keys'
import { buildGeometryFromPositions } from './geometry'
import { triangulate } from '../../../utils/three/libtess'

const tempLine = new Line3()
const tempVector = new Vector3()
const XY = new Vector3(0, 0, 1).normalize()

function fixVector (v) {
  v.setX(Math.fround(v.x))
  v.setY(Math.fround(v.y))
  v.setZ(Math.fround(v.z))
  return v
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

function toKey (v = new Vector3()) {
  const array = []
  for (const x of v.toArray()) {
    array.push(Math.fround(x))
  }
  return array.join(',')
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

function buildPointsFromLines (lines = [new Line3()]) {
  const points = []
  for (const line of lines) {
    points.push(line.start)
    points.push(line.end)
  }
  return points
}

function sortPoints (points = [new Vector3()]) {
  const map = new Map()
  function setMap (key, value) {
    if (map.has(key)) map.get(key).push(value)
    else map.set(key, [value])
  }
  for (let i = 0, count = points.length; i < count; i++) {
    setMap(toKey(points[i]), Math.floor(i / 2))
  }
  const keys = points.map(v => toKey(v))
  const process = [...map.get(map.keys().next().value)]
  // sort line3, but point is ataxic
  for (let i = 0, count = map.size; i < count; i++) {
    const lastLineIndex = process[process.length - 1]
    const startKey = keys[lastLineIndex * 2]
    const endKey = keys[lastLineIndex * 2 + 1]
    for (const k of [...map.get(startKey), ...map.get(endKey)]) {
      if (!process.includes(k)) process.push(k)
    }
  }
  // sort point
  const lines = []
  for (let i = 0, count = process.length; i < count; i++) {
    const start = points[process[i] * 2]
    const end = points[process[i] * 2 + 1]
    if (toKey(lines[lines.length - 1]) === toKey(start)) {
      lines.push(start, end)
    } else {
      lines.push(end, start)
    }
    if (i === 1) {
      if (toKey(lines[1]) !== toKey(lines[2])) {
        lines[0] = lines[1]
        lines[1] = lines[2].clone()
      }
    }
  }
  return lines
}

function buildAttrFromLine (positionArray = []) {
  const count = positionArray.length
  const positions = new BufferAttribute(new Float32Array(count * 3), 3, false)
  for (let i = 0; i < count; i++) {
    positions.setXYZ(i, ...positionArray[i].toArray())
  }
  return positions
}

function buildTriangleFromPosition (attr = new BufferAttribute()) {
  const a = new Vector3()
  const b = new Vector3()
  const c = new Vector3()
  const count = attr.count
  const triangles = []
  for (let i = 0; i < count; i++) {
    a.fromBufferAttribute(attr, i + 0)
    b.fromBufferAttribute(attr, i + 1)
    c.fromBufferAttribute(attr, i + 2)
    triangles.push(new Triangle(a.clone(), b.clone(), c.clone()))
  }
  return triangles
}

function repairInsectsTriangles (map = new Map()) {
  const values = map.values()
  const positions = []
  const trianglePlane = new Plane()
  const ab = new Line3()
  const bc = new Line3()
  const ca = new Line3()
  for (let i = 0, count = map.size; i < count; i++) {
    const { lines, triangle } = values.next().value
    let array = [ab, bc, ca]
    ab.start.copy(triangle.a)
    ab.end.copy(triangle.b)
    bc.start.copy(triangle.b)
    bc.end.copy(triangle.c)
    ca.start.copy(triangle.c)
    ca.end.copy(triangle.a)
    triangle.getPlane(trianglePlane)
    const deleteArray = []

    // 遍历相交线，和每条线段对应的平面
    for (const { line, plane } of lines) {
      array.push(line)
      // 遍历三角形三条边
      for (const triangleLine of [ab, bc, ca]) {
        if (plane.intersectLine(triangleLine, tempVector)) {
          // 如果交点是线段的其中一个
          if (
            toKey(tempVector) === toKey(line.start) ||
            toKey(tempVector) === toKey(line.end)
          ) {
            deleteArray.push(triangleLine)
            // 剪短三角形的边
            if (Math.fround(plane.distanceToPoint(triangleLine.start)) > 0) {
              array.push(new Line3(triangleLine.end, tempVector.clone()))
            } else {
              array.push(new Line3(triangleLine.start, tempVector.clone()))
            }
          }
        }
      }
    }
    array = array.filter(l => !deleteArray.includes(l))
    // 将线条排序。这里可能会多出一根单独的线段
    let orderedPoints = sortPoints(buildPointsFromLines(array))
    // 检测是否多出一根，重新排序
    if (orderedPoints.length === 2) {
      orderedPoints = sortPoints(buildPointsFromLines(array.reverse()))
    }
    // 如果还是多出一根，说明三角形有问题
    if (orderedPoints.length === 2) {
      throw new Error('line not connected')
    }
    // 检测这个轮廓线和相交线之间有没有关系
    if (orderedPoints.length === 4) {
      continue
    }
    const { points, matrix } = coplanarPoints(orderedPoints, trianglePlane)
    const facets = buildPlaneFacetsWithTess(points)
    for (const f of facets) {
      const facetPlane = new Plane()
      f.a.applyMatrix4(matrix)
      f.b.applyMatrix4(matrix)
      f.c.applyMatrix4(matrix)
      facetPlane.setFromCoplanarPoints(f.a, f.b, f.c)
      if (
        Math.fround(facetPlane.normal.angleTo(trianglePlane.normal)) >
        Math.PI / 2
      ) {
        positions.push(...f.c.toArray())
        positions.push(...f.b.toArray())
        positions.push(...f.a.toArray())
      } else {
        positions.push(...f.a.toArray())
        positions.push(...f.b.toArray())
        positions.push(...f.c.toArray())
      }
    }
  }
  return positions
}

function geometryRemoveTriangle (
  attribute = new BufferAttribute(),
  indexes = []
) {
  for (const index of indexes) {
    attribute.setXYZ(index, 0, 0, 0)
  }
}

function mergePosition (attribute = new BufferAttribute(), positions = []) {
  const array = new Float32Array(attribute.count * 3 + positions.length)
  const positionArray = []
  for (const position of positions) {
    positionArray.push(position)
  }
  array.set(attribute.array)
  array.set(positionArray, attribute.count * 3)
  return new BufferAttribute(array, 3, false)
}

function getPositionIndex (index, geometry = new BufferGeometry()) {
  if (geometry.index) {
    return [
      geometry.index.getX(index * 3),
      geometry.index.getX(index * 3 + 1),
      geometry.index.getX(index * 3 + 2)
    ]
  } else {
    return [index * 3, index * 3 + 1, index * 3 + 2]
  }
}

function positionToVector3 (position = [0, 0, 0]) {
  const points = []
  for (let i = 0, count = position.length; i < count; i += 3) {
    points.push(new Vector3(...position.slice(i, i + 3)))
  }
  return points
}

function splitPosition (
  strickenAttr = new BufferAttribute(),
  triangle = [new Vector3()]
) {
  const point = new Map()
  // tool function
  const addEdge = (key, value, map = point) => {
    if (map.has(key)) map.get(key).push(value)
    else map.set(key, [value])
  }
  const getPointFromIndex = i => [
    strickenAttr.getX(i),
    strickenAttr.getY(i),
    strickenAttr.getZ(i)
  ]
  const getPointFromTriangle = i => [
    getPointFromIndex(i * 3),
    getPointFromIndex(i * 3 + 1),
    getPointFromIndex(i * 3 + 2)
  ]
  const addQueue = indexes => {
    if (!indexes?.length) return
    for (const t of indexes) {
      if (!queue.includes(t) && !processed.includes(t)) {
        queue.push(t)
      }
    }
  }

  let a = []
  let b = []
  let c = []
  let triangleIndex = 0

  // make point and triangle relation
  for (let i = 0, count = strickenAttr.count; i < count; i += 3) {
    a = getPointFromIndex(i).join(',')
    b = getPointFromIndex(i + 1).join(',')
    c = getPointFromIndex(i + 2).join(',')
    addEdge(a, i / 3)
    addEdge(b, i / 3)
    addEdge(c, i / 3)
  }

  const processed = []
  // get connected triangles
  const queue = []
  // init queue
  for (const t of triangle) {
    addQueue(point.get(toKey(t)))
  }
  while (queue?.length) {
    triangleIndex = queue.shift()
    for (const p of getPointFromTriangle(triangleIndex)) {
      addQueue(point.get(p.join(',')))
    }
    processed.push(triangleIndex)
  }

  // build attribute by connected triangles
  const array = new Float32Array(processed.length * 9)
  for (let i = 0, count = processed.length; i < count; i++) {
    array.set(getPointFromTriangle(processed[i]).flat(), i * 9)
  }

  return new BufferAttribute(array, 3, false)
}

function reversePosition (position = new BufferAttribute()) {
  let array = []
  for (let i = 0, count = position.count; i < count; i += 3) {
    array = [position.getX(i + 2), position.getY(i + 2), position.getZ(i + 2)]
    position.setXYZ(i + 2, position.getX(i), position.getY(i), position.getZ(i))
    position.setXYZ(i, ...array)
  }
  return position
}

function mergeGeometry ({
  colliderGeometry = new BufferGeometry(),
  strickenGeometry = new BufferGeometry(),
  colliderCutTriangle = [0],
  strickenCutTriangle = [0],
  colliderRepairMap = new Map(),
  strickenRepairMap = new Map()
}) {
  const { innerReverseMesh, outerReverseMesh } = this.data
  const geometry = new BufferGeometry()
  const colliderRawAttr = colliderGeometry.getAttribute('position')
  const strickenRawAttr = strickenGeometry.getAttribute('position')
  const colliderRepairTriangle = repairInsectsTriangles(colliderRepairMap)
  const strickenRepairTriangle = repairInsectsTriangles(strickenRepairMap)

  geometryRemoveTriangle(colliderRawAttr, colliderCutTriangle)
  geometryRemoveTriangle(strickenRawAttr, strickenCutTriangle)

  const colliderSplit = splitPosition(
    colliderRawAttr,
    positionToVector3(colliderRepairTriangle)
  )
  const strickenSplit = splitPosition(
    strickenRawAttr,
    positionToVector3(strickenRepairTriangle)
  )

  const colliderAttr = mergePosition(colliderSplit, colliderRepairTriangle)
  // strickenSplit
  const strickenAttr = mergePosition(strickenSplit, strickenRepairTriangle)

  if (outerReverseMesh) {
    reversePosition(colliderAttr)
  }
  if (innerReverseMesh) {
    reversePosition(strickenAttr)
  }

  geometry.setAttribute(
    'position',
    mergePosition(colliderAttr, strickenAttr.array)
  )
  geometry.computeVertexNormals()
  return geometry
}

export default {
  dependencies: ['material'],
  schema: {
    innerMesh: { type: 'string', default: 'mesh' },
    innerEl: { type: 'selector', default: 'mesh' },
    innerReverseDir: { type: 'boolean', default: false },
    innerReverseMesh: { type: 'boolean', default: false },

    outerMesh: { type: 'string', default: 'mesh' },
    outerEl: { type: 'selector', default: 'mesh' },
    outerReverseDir: { type: 'boolean', default: false },
    outerReverseMesh: { type: 'boolean', default: false },

    outputMesh: { type: 'string' },
    outputEl: { type: 'selector' },

    contour: { type: 'string', default: 'contour' },
    contourVisible: { type: 'boolean', default: false },

    enabled: { type: 'boolean', default: true }
  },
  multiple: true,
  init () {
    const { outputEl, outputMesh, contour } = this.data
    const lineGeometry = new BufferGeometry()
    lineGeometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(), 3, false)
    )
    const outline = new LineSegments(lineGeometry, new LineBasicMaterial())
    outline.material.color.set(0x00acc1).convertSRGBToLinear()
    outputEl.setObject3D(contour, outline)

    const outputGeometry = new BufferGeometry()
    outputGeometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(), 3, false)
    )
    const output = new Mesh(
      outputGeometry,
      this.el.components.material.material
    )
    outputEl.setObject3D(outputMesh, output)
  },
  update () {
    const { outputEl, contour, contourVisible } = this.data
    outputEl.getObject3D(contour).visible = contourVisible
  },
  shapecast () {
    function setMap (map, key, { triangle, ...arg }) {
      if (map.has(key)) {
        map.get(key).lines.push(arg)
      } else {
        map.set(key, { triangle, lines: [arg] })
      }
    }
    const {
      innerEl,
      innerMesh,
      innerReverseDir,
      outerEl,
      outerMesh,
      outerReverseDir,
      contour,
      outputEl,
      outputMesh
    } = this.data

    const stricken = innerEl.getObject3D(innerMesh)
    const collider = outerEl.getObject3D(outerMesh)
    const output = outputEl.getObject3D(outputMesh)
    const lineGeometry = outputEl.getObject3D(contour).geometry

    const colliderGeometry = collider.geometry.toNonIndexed()
    const strickenGeometry = stricken.geometry.toNonIndexed()

    colliderGeometry.computeBoundsTree()
    strickenGeometry.computeBoundsTree()

    collider.visible = false
    stricken.visible = false

    const edge = new Line3()
    const result = []
    const colliderCutTriangle = []
    const strickenCutTriangle = []
    const colliderRepairMap = new Map()
    const strickenRepairMap = new Map()
    const colliderBvh = colliderGeometry.boundsTree
    const strickenBvh = strickenGeometry.boundsTree
    const matrixToLocal = new Matrix4()
      .copy(stricken.matrixWorld)
      .invert()
      .multiply(collider.matrixWorld)
      .invert()

    colliderBvh.bvhcast(strickenBvh, matrixToLocal, {
      intersectsTriangles (triangle1, triangle2, index1, index2) {
        if (triangle1.intersectsTriangle(triangle2, edge)) {
          const cutEdge = edge.clone()
          const plane1 = new Plane()
          const plane2 = new Plane()

          if (innerReverseDir) {
            plane1.setFromCoplanarPoints(triangle1.c, triangle1.b, triangle1.a)
          } else {
            plane1.setFromCoplanarPoints(triangle1.a, triangle1.b, triangle1.c)
          }

          if (outerReverseDir) {
            plane2.setFromCoplanarPoints(triangle2.a, triangle2.b, triangle2.c)
          } else {
            plane2.setFromCoplanarPoints(triangle2.c, triangle2.b, triangle2.a)
          }
          // delete intersects triangle,here remember triangle vertex key
          colliderCutTriangle.push(
            ...getPositionIndex(index1, colliderGeometry)
          )
          strickenCutTriangle.push(
            ...getPositionIndex(index2, strickenGeometry)
          )
          setMap(colliderRepairMap, index1, {
            triangle: new Triangle(
              triangle1.a.clone(),
              triangle1.b.clone(),
              triangle1.c.clone()
            ),
            line: cutEdge.clone(),
            plane: plane2
          })

          setMap(strickenRepairMap, index2, {
            triangle: new Triangle(
              triangle2.a.clone(),
              triangle2.b.clone(),
              triangle2.c.clone()
            ),
            line: cutEdge.clone(),
            plane: plane1
          })
          // intersects line
          result.push(edge.start.clone(), edge.end.clone())
        }
      }
    })
    // delete triangle
    output.geometry.dispose()
    output.geometry = mergeGeometry.bind(this)({
      colliderGeometry: colliderBvh.geometry,
      strickenGeometry: strickenBvh.geometry.applyMatrix4(matrixToLocal),
      strickenCutTriangle,
      colliderCutTriangle,
      strickenRepairMap,
      colliderRepairMap
    })
    lineGeometry.setAttribute('position', buildAttrFromLine(result))
  },
  tick () {
    const { innerMesh, innerEl, outerMesh, outerEl, enabled } = this.data
    if (!enabled) return
    if (!outerEl) return
    if (!innerEl) return
    const outer = outerEl?.getObject3D(outerMesh)
    const inner = innerEl?.getObject3D(innerMesh)
    if (!outer?.geometry) return
    if (!inner?.geometry) return
    const key = buildMeshesKey(outer, inner)
    if (this.lastKey === key) return
    this.lastKey = key
    this.shapecast()
  },
  remove () {}
}
