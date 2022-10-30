import { Vector3 } from 'three'

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
  constructor (start = new Point(), end = new Point()) {
    this.start = start
    this.end = end
  }
}

class Tree {
  constructor () {
    this._points = new Map()
  }

  createTriangle (a = new Vector3(), b = new Vector3(), c = new Vector3()) {
    this.createEdge(a, b)
    this.createEdge(b, c)
    this.createEdge(c, a)
  }

  createEdge (start = new Vector3(), end = new Vector3()) {
    const _start = this.getPoint(start)
    const _end = this.getPoint(end)

    const edge = new Edge(_start, _end)

    _start.setEdge(edge)
    _end.setEdge(edge)
  }

  getPoint (p = Vector3()) {
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

export default {
  dependencies: [],
  schema: {
    inputEl: { type: 'selector' },
    outputEl: { type: 'selector' }
  },
  getPosition () {
    const mesh = this.data.inputEl.getObject3D('mesh')
    if (mesh.geometry.index)
      return mesh.geometry.toNonIndexed().getAttribute('position')
    else return mesh.geometry.getAttribute('position')
  },
  update () {
    const position = this.getPosition()
    this.tree = new Tree()
    const a = new Vector3()
    const b = new Vector3()
    const c = new Vector3()

    for (let i = 0, count = position.count; i < count; i += 3) {
      a.fromBufferAttribute(position, i)
      b.fromBufferAttribute(position, i + 1)
      c.fromBufferAttribute(position, i + 2)

      this.tree.createTriangle(a, b, c)
    }

    const points = this.tree.points
    const cutMaps = new Map()
    const cutLine = []
    //
    for (let i = 0, count = points.length; i < count; i++) {
      const centerP = points[i]
      const adjacency = centerP.adjacency
      for (let j = 0, jc = adjacency.length; j < jc; j++) {
        if (adjacency[j].used) continue
        for (let k = 0, kc = adjacency.length; k < kc; k++) {
          if (adjacency[k].used) continue
          if (j === k) continue
          if (adjacency[j].isConnect(adjacency[k])) continue
          if (cutMaps.has(`${toKey(adjacency[j].p)}+${toKey(adjacency[k].p)}`))
            continue
          cutLine.push([centerP, adjacency[j], adjacency[k]])
          cutMaps.set(`${toKey(adjacency[j].p)}+${toKey(adjacency[k].p)}`)
          cutMaps.set(`${toKey(adjacency[k].p)}+${toKey(adjacency[j].p)}`)
        }
      }
      centerP.used = true
    }
  }
}
