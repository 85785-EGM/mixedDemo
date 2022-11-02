import { BufferAttribute, Vector3 } from 'three'

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
    this.key = toKey(p)
    this._adjacency = new Map()

    this.needUpdate = false
  }

  setAdjacency (point = new Point()) {
    if (point === this) return
    this._adjacency.set(toKey(point.p), point)
    this.needUpdate = true
  }

  hasBrother (key) {
    return this._adjacency.has(key)
  }

  get adjacency () {
    if (!this.needUpdate) return this.lastArray
    const array = []
    const iterator = this._adjacency.values()
    for (let i = 0, count = this._adjacency.size; i < count; i++) {
      array.push(iterator.next().value)
    }
    this.lastArray = array
    this.needUpdate = false
    return array
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
    this.createEdge(a, b)
    this.createEdge(b, c)
    this.createEdge(c, a)
  }

  createEdge (start = new Vector3(), end = new Vector3()) {
    const _start = this.getPoint(start)
    const _end = this.getPoint(end)

    _start.setAdjacency(_end)
    _end.setAdjacency(_start)
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

export default class Dijkstra {
  constructor (position = new BufferAttribute()) {
    this.init(position)
  }

  init (position = new BufferAttribute()) {
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
  }

  do (startIndex, endIndex) {
    const start = _v.clone().fromBufferAttribute(this.position, startIndex)
    const end = _v.clone().fromBufferAttribute(this.position, endIndex)
    this.max = start.distanceTo(end) * 2
    this.maxCount = 1000 * 1000 * 10

    this.result = { depth: [], w: Number.MAX_VALUE }
    this.resultArray = []
    this.count = 0

    // 按离终点最短距离排序
    this.tree.points.forEach(p => {
      p.adjacency.sort((a, b) => a.p.distanceTo(end) - b.p.distanceTo(end))
    })

    console.time('calc')
    try {
      this.ca(this.tree.getPoint(start), this.tree.getPoint(end))
    } catch (e) {}
    console.timeEnd('calc')
    console.log(this.result, this.count)
    // this.result.depth.pop()

    const rp = this.resultArray
      .sort((a, b) => a.w - b.w)
      .filter(r => r.w === this.result.w)
      .flatMap(({ depth }) => {
        depth.pop()
        return depth
      })
      .map(({ p }) => p)

    return rp // this.result.depth.flatMap(({ p }) => p)
  }

  /**
   * 深度优先遍历
   */
  ca (start, end, w = 0, depth = [], parent) {
    if (w > this.max) return
    if (w > this.result.w) return
    if (start === end) {
      this.resultArray.push({ depth, w })
      this.result = { depth, w }
      return
    }
    if (this.count++ > this.maxCount) throw new Error('too long')
    for (let i = 0, count = start.adjacency.length; i < count; i++) {
      if (start.adjacency[i] === parent) continue
      if (start.p.distanceTo(end.p) <= start.adjacency[i].p.distanceTo(end.p)) {
        continue
      }
      if (parent?.hasBrother(start.adjacency[i].key)) continue

      this.ca(
        start.adjacency[i],
        end,
        w + start.adjacency[i].p.distanceTo(start.p),
        [...depth, start.adjacency[i]],
        start
      )
    }
  }
}
