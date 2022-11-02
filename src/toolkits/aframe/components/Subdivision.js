import {
  BufferAttribute,
  Mesh,
  Line3,
  Plane,
  Vector3,
  MeshBasicMaterial,
  BufferGeometry
} from 'three'

function toKey (v = new Vector3()) {
  const array = []
  for (const x of v.toArray()) {
    array.push(Math.fround(x))
  }
  return array.join(',')
}

class Point {
  constructor (p = new Vector3()) {
    this.p = p.clone()
    this.edges = []
    this._adjacency = new Map()
  }

  setEdge (edge = new Edge()) {
    this.edges.push(edge)
    this.setAdjacency(edge.start)
    this.setAdjacency(edge.end)
  }

  setAdjacency (point = new Point()) {
    if (point === this) return
    this._adjacency.set(toKey(point.p), point)
  }

  get adjacency () {
    const array = []
    const iterator = this._adjacency.values()
    for (let i = 0, count = this._adjacency.size; i < count; i++) {
      array.push(iterator.next().value)
    }
    return array
  }

  isConnect (point = new Point()) {
    return this._adjacency.has(toKey(point.p))
  }
}

class Edge {
  constructor (index, start = new Point(), end = new Point()) {
    this.start = start
    this.end = end

    this.index = index
  }

  getTriangleIndex () {
    return this.index - (this.index % 3)
  }
}

class Tree {
  constructor () {
    this._points = new Map()
  }

  createTriangle (
    index,
    a = new Vector3(),
    b = new Vector3(),
    c = new Vector3()
  ) {
    this.createEdge(index, a, b)
    this.createEdge(index + 1, b, c)
    this.createEdge(index + 2, c, a)
  }

  createEdge (index, start = new Vector3(), end = new Vector3()) {
    const _start = this.getPoint(start)
    const _end = this.getPoint(end)

    const edge = new Edge(index, _start, _end)

    _start.setEdge(edge)
    _end.setEdge(edge)
  }

  getPoint (p = new Vector3()) {
    const key = toKey(p)

    if (!this._points.get(key)) this._points.set(key, new Point(p))

    return this._points.get(key)
  }

  get points () {
    const array = []
    const iterator = this._points.values()
    for (let i = 0, count = this._points.size; i < count; i++) {
      array.push(iterator.next().value)
    }
    return array
  }
}

const _v = new Vector3()
const _p = new Plane()
const _a = new Vector3()
const _b = new Vector3()
const _c = new Vector3()
const _l = new Line3()

export default {
  dependencies: [],
  schema: {
    inputEl: { type: 'selector' },
    outputEl: { type: 'selector' }
  },
  getPosition () {
    const mesh = this.data.inputEl.getObject3D('mesh')
    if (mesh.geometry.index) {
      return mesh.geometry.toNonIndexed().getAttribute('position')
    } else return mesh.geometry.getAttribute('position')
  },
  update () {
    const position = this.getPosition()
    this.position = position
    this.tree = new Tree()
    const a = new Vector3()
    const b = new Vector3()
    const c = new Vector3()

    for (let i = 0, count = position.count; i < count; i += 3) {
      a.fromBufferAttribute(position, i)
      b.fromBufferAttribute(position, i + 1)
      c.fromBufferAttribute(position, i + 2)

      this.tree.createTriangle(i, a, b, c)
    }

    const points = this.tree.points
    const cutMaps = new Map()
    const cutLine = []
    //
    for (let i = 0, count = points.length; i < count; i++) {
      const centerP = points[i]
      const adjacency = centerP.adjacency
      for (let j = 0, jc = adjacency.length; j < jc; j++) {
        for (let k = 0, kc = adjacency.length; k < kc; k++) {
          if (j === k) continue
          if (adjacency[j].isConnect(adjacency[k])) continue
          if (
            cutMaps.has(`${toKey(adjacency[j].p)}+${toKey(adjacency[k].p)}`)
          ) {
            continue
          }

          cutLine.push(this.getCutObject(centerP, adjacency[j], adjacency[k]))

          cutMaps.set(`${toKey(adjacency[j].p)}+${toKey(adjacency[k].p)}`)
          cutMaps.set(`${toKey(adjacency[k].p)}+${toKey(adjacency[j].p)}`)
        }
      }
    }

    const delta = []
    for (let i = 0, count = cutLine.length; i < count; i++) {
      delta.push(...this.doCut(cutLine[i]))
    }
    delta.sort((a, b) => a[0] - b[0])
    this.out(delta)
  },

  out (delta) {
    const mesh = new Mesh(
      new BufferGeometry(),
      new MeshBasicMaterial({
        wireframe: true,
        color: 'red'
      })
    )
    this.data.outputEl.setObject3D('mesh', mesh)
    const triangles = []
    const array = []
    for (let i = 0, count = delta.length; i < count; i++) {
      triangles.push(...delta[i][1])
    }
    for (let i = 0, count = triangles.length; i < count; i++) {
      array.push(...triangles[i][0].toArray())
      array.push(...triangles[i][1].toArray())
      array.push(...triangles[i][2].toArray())
    }
    mesh.geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(array), 3)
    )
  },

  doCut ({ planeC = new Plane(), edges = [new Edge()], points }) {
    const delta = []
    let index, lineIndex
    for (let i = 0, count = edges.length; i < count; i++) {
      index = edges[i].getTriangleIndex()
      lineIndex = edges[i].index
      _a.fromBufferAttribute(this.position, index)
      _b.fromBufferAttribute(this.position, index + 1)
      _c.fromBufferAttribute(this.position, index + 2)
      if (lineIndex % 3 === 0) {
        if (planeC.intersectLine(_l.set(_a, _b), _v)) {
          delta.push([
            index,
            [
              [_a.clone(), _v.clone(), _c.clone()],
              [_v.clone(), _b.clone(), _c.clone()]
            ]
          ])
        }
      } else if (lineIndex % 3 === 1) {
        if (planeC.intersectLine(_l.set(_b, _c), _v)) {
          delta.push([
            index,
            [
              [_a.clone(), _b.clone(), _v.clone()],
              [_v.clone(), _c.clone(), _a.clone()]
            ]
          ])
        }
      } else if (lineIndex % 3 === 2) {
        if (planeC.intersectLine(_l.set(_c, _a), _v)) {
          delta.push([
            index,
            [
              [_a.clone(), _b.clone(), _v.clone()],
              [_b.clone(), _c.clone(), _v.clone()]
            ]
          ])
        }
      }
    }
    return delta
  },

  getCutObject (centerP, adjacencyJ, adjacencyK) {
    const a = centerP.p
    const b = adjacencyJ.p
    const c = adjacencyK.p
    const normal = _p.setFromCoplanarPoints(a, b, c).normal.clone()
    const ta = a.clone().add(normal)
    const tb = b.clone().add(normal)
    const planeJ = _p.setFromCoplanarPoints(ta, a, b).clone()
    const planeK = _p.setFromCoplanarPoints(ta, a, c).clone()
    const planeC = _p.setFromCoplanarPoints(tb, b, c).clone()

    if (planeJ.distanceToPoint(c) < 0) planeJ.negate()
    if (planeK.distanceToPoint(b) < 0) planeK.negate()
    if (planeC.distanceToPoint(a) < 0) planeC.negate()

    const edges = centerP.edges.filter(({ start, end }) => {
      if (start === centerP) _v.copy(end.p)
      else _v.copy(start.p)

      return (
        planeC.distanceToPoint(_v) < 0 &&
        planeJ.distanceToPoint(_v) > 0 &&
        planeK.distanceToPoint(_v) > 0
      )
    })

    return {
      planeJ,
      planeK,
      planeC,
      edges,
      points: [centerP, adjacencyJ, adjacencyK]
    }
  }
}
