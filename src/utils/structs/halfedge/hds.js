import { getPointHash } from '../mesh'
import { RecursiveStack } from '../stack'
import { NoSuchEdgeError, NoSuchPointError } from './errors'

export class Point {
  constructor (index) {
    this.index = index // how to: object3D.geometry.getAttribute('position').getX(index)
  }

  hash (positions, shiftMultiplier) {
    if (!this._hash) {
      this._hash = getPointHash(positions, this.index, shiftMultiplier)
    }
    return this._hash
  }
}

export class Edge {
  constructor (source, target) {
    this.source = source
    this.target = target
    this.twin = null
    this.prev = null
    this.next = null
  }

  get index () {
    return this.source.index
  }

  get points () {
    return [this.source, this.target]
  }

  getPointsHash (position, shiftMultiplier, points) {
    return points.map(p => p.hash(position, shiftMultiplier)).join('~')
  }

  hash (positions, shiftMultiplier) {
    if (!this._hash) {
      this._hash = this.getPointsHash(positions, shiftMultiplier, [
        this.source,
        this.target
      ])
    }
    return this._hash
  }

  rhash (positions, shiftMultiplier) {
    if (!this._rhash) {
      this._rhash = this.getPointsHash(positions, shiftMultiplier, [
        this.target,
        this.source
      ])
    }
    return this._rhash
  }
}

export class Facet {
  constructor (index) {
    this.a = new Point(index)
    this.b = new Point(index + 1)
    this.c = new Point(index + 2)
    this.ab = new Edge(this.a, this.b)
    this.bc = new Edge(this.b, this.c)
    this.ca = new Edge(this.c, this.a)
    this.ab.prev = this.ca
    this.ab.next = this.bc
    this.bc.prev = this.ab
    this.bc.next = this.ca
    this.ca.prev = this.bc
    this.ca.next = this.ab
  }

  get index () {
    return this.a.index
  }

  get points () {
    return [this.a, this.b, this.c]
  }

  get edges () {
    return [this.ab, this.bc, this.ca]
  }
}

export class HalfEdge {
  constructor () {
    this.points = new Map()
    this.edges = new Map()
    this.facets = new Map()
  }

  _get (map, index) {
    return map.get(index.toString())
  }

  _set (map, obj) {
    map.set(obj.index.toString(), obj)
    return this
  }

  getPoint (index) {
    return this._get(this.points, index)
  }

  addPoint (point) {
    return this._set(this.points, point)
  }

  getEdge (index) {
    return this._get(this.edges, index)
  }

  addEdge (edge) {
    for (const point of edge.points) {
      this._set(this.points, point)
    }
    return this._set(this.edges, edge)
  }

  getFacet (index) {
    const rest = index % 3
    return this._get(this.facets, rest === 0 ? index : index - rest)
  }

  addFacet (facet) {
    for (const point of facet.points) {
      this._set(this.points, point)
    }
    for (const edge of facet.edges) {
      this._set(this.edges, edge)
    }
    return this._set(this.facets, facet)
  }

  getFacetIndexFromIndex (index) {
    return Math.floor(index / 3) * 3
  }

  getFacetFromEdge (edge) {
    return this.getFacet(this.getFacetIndexFromIndex(edge.index))
  }

  getTwinFacetsFromFacet (facet) {
    const twinFacets = []
    for (const edge of facet.edges) {
      if (!edge.twin) continue
      const twinFacet = this.getFacetFromEdge(edge.twin)
      if (!twinFacet) continue
      twinFacets.push(twinFacet)
    }
    return twinFacets
  }

  getEdgesFromPoint (point) {
    const walkedMap = new Map()
    for (
      let edge = this.getEdge(point.index);
      !walkedMap.has(edge.index);
      edge = edge.twin.next
    ) {
      walkedMap.set(edge.index, edge)
      if (!edge.twin) break
    }
    return [...walkedMap.values()]
  }

  getSamePointsFromPoint (point) {
    return this.getEdgesFromPoint(point).map(e => e.source)
  }

  getNeighborPointsFromPoint (point) {
    return this.getEdgesFromPoint(point).map(e => e.target)
  }

  getNoTwinEdges () {
    const edges = []
    for (const edge of this.edges.values()) {
      if (!edge.twin) {
        edges.push(edge)
      }
    }
    return edges
  }

  isWaterTight () {
    for (const edge of this.edges.values()) {
      if (!edge.twin) {
        return false
      }
    }
    return true
  }

  * walk (index, opts) {
    yield * this.walkFacets(index, opts)
  }

  * walkPoints (index, opts) {
    opts = {
      condition: () => true,
      includeEdgeCondition: false,
      ...opts
    }
    const firstPoint = this.getPoint(index)
    if (!firstPoint) return
    const stack = new RecursiveStack()
    stack.push({
      key: firstPoint.index,
      point: firstPoint,
      level: 0
    })

    for (let i = 0; stack.length > 0; i++) {
      const { point, level } = stack.pop()
      const item = { point, index: i, level }
      if (opts.condition(item)) {
        yield item
      } else {
        if (opts.includeEdgeCondition) {
          yield item
        }
        continue
      }
      for (const edge of this.getEdgesFromPoint(point)) {
        const nextPoint = edge.target
        if (!stack.has(nextPoint.index)) {
          stack.push({
            key: nextPoint.index,
            point: nextPoint,
            level: level + 1
          })
        }
      }
    }
  }

  * walkEdges (index, opts) {
    opts = {
      condition: () => true,
      includeEdgeCondition: false,
      ...opts
    }
    const firstEdge = this.getEdge(index)
    if (!firstEdge) return
    const stack = new RecursiveStack()
    stack.push({
      key: firstEdge.index,
      edge: firstEdge,
      level: 0
    })

    for (let i = 0; stack.length > 0; i++) {
      const { edge, level } = stack.pop()
      const item = { edge, index: i, level }
      if (opts.condition(item)) {
        yield item
      } else {
        if (opts.includeEdgeCondition) {
          yield item
        }
        continue
      }
      for (const nextEdge of this.getEdgesFromPoint(edge.target)) {
        if (!stack.has(nextEdge.index)) {
          stack.push({
            key: nextEdge.index,
            edge: nextEdge,
            level: level + 1
          })
        }
      }
    }
  }

  * walkFacets (index, opts) {
    opts = {
      condition: () => true,
      includeEdgeCondition: false,
      ...opts
    }
    const firstFacet = this.getFacet(index)
    if (!firstFacet) return
    const stack = new RecursiveStack()
    stack.push({
      key: firstFacet.index,
      facet: firstFacet,
      level: 0
    })

    for (let i = 0; stack.length > 0; i++) {
      const { facet, level } = stack.pop()
      const item = { facet, index: i, level }
      if (opts.condition(item)) {
        yield item
      } else {
        if (opts.includeEdgeCondition) {
          yield item
        }
        continue
      }
      for (const twinFacet of this.getTwinFacetsFromFacet(facet)) {
        if (!stack.has(twinFacet.index)) {
          stack.push({
            key: twinFacet.index,
            facet: twinFacet,
            level: level + 1
          })
        }
      }
    }
  }

  fromPositions (positions, tolerance = 1e-4) {
    const decimalShift = Math.log10(1 / tolerance)
    const shiftMultiplier = Math.pow(10, decimalShift)
    const edgesMap = new Map()
    for (let index = 0; index < positions.count; index += 3) {
      const facet = new Facet(index)
      for (const edge of facet.edges) {
        const hash = edge.hash(positions, shiftMultiplier)
        const rhash = edge.rhash(positions, shiftMultiplier)
        edgesMap.set(hash, edge)
        const twinEdge = edgesMap.get(rhash)
        if (twinEdge) {
          edge.twin = twinEdge
          twinEdge.twin = edge
        }
      }
      this.addFacet(facet)
    }
    return this
  }

  toJSONPoint (point) {
    return {
      index: point.index
    }
  }

  toJSONEdge (edge) {
    return {
      index: edge.index,
      twin: edge.twin?.index ?? null
    }
  }

  toJSONFacet (facet) {
    return {
      index: facet.index
    }
  }

  toJSON () {
    return {
      points: [...this.points.values()].map(point => this.toJSONPoint(point)),
      edges: [...this.edges.values()].map(edge => this.toJSONEdge(edge)),
      facets: [...this.facets.values()].map(facet => this.toJSONFacet(facet))
    }
  }

  fromJSON ({ points = [], edges = [], facets = [] }) {
    for (const { index } of facets) {
      this.addFacet(new Facet(index))
    }
    for (const { index, twin } of edges) {
      const edge = this.getEdge(index)
      if (!edge) throw new NoSuchEdgeError(index)
      if (twin === null) continue
      const twinEdge = this.getEdge(twin)
      if (!twinEdge) throw new NoSuchEdgeError(twin)
      edge.twin = twinEdge
    }
    for (const { index } of points) {
      const point = this.getPoint(index)
      if (!point) throw new NoSuchPointError(index)
    }
    return this
  }
}

export function createHalfEdge (positions, tolerance = 1e-4) {
  return new HalfEdge().fromPositions(positions, tolerance)
}
