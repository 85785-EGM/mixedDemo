import { Vector3 } from 'three'
import { KDTree } from './kdtree'

class Distances {
  constructor () {
    this._m = new Vector3()
    this._n = new Vector3()
  }

  points (m, n) {
    this._m
      .setX(m.x)
      .setY(m.y)
      .setZ(m.z)
    this._n
      .setX(n.x)
      .setY(n.y)
      .setZ(n.z)
    const distance = this._m.manhattanDistanceTo(this._n)
    return distance
  }

  faces (m, n) {
    const mpoints = [
      { x: m.ax, y: m.ay, z: m.az },
      { x: m.bx, y: m.by, z: m.bz },
      { x: m.ax, y: m.ay, z: m.az }
    ]
    const npoints = [
      { x: n.ax, y: n.ay, z: n.az },
      { x: n.bx, y: n.by, z: n.bz },
      { x: n.ax, y: n.ay, z: n.az }
    ]
    let min1, min2
    for (const mp of mpoints) {
      for (const np of npoints) {
        const distance = this.points(mp, np)
        if (!min1) {
          min1 = distance
          continue
        }
        if (!min2) {
          min2 = distance
          continue
        }
        if (min1 > distance) {
          min2 = min1
          min1 = distance
          continue
        }
        if (min2 > distance) {
          min2 = distance
          continue
        }
      }
    }
    return min1 + min2
  }
}

const distances = new Distances()

const POINT_DIMENSIONS = ['x', 'y', 'z']
const TRIANGLE_DIMENSIONS = [
  'ax',
  'ay',
  'az',
  'bx',
  'by',
  'bz',
  'cx',
  'cy',
  'cz'
]

export class PointsKDTree extends KDTree {
  constructor (points) {
    super(points, (a, b) => distances.points(a, b), POINT_DIMENSIONS)
  }
}

export class FacetsKDTree extends KDTree {
  constructor (faces) {
    super(faces, (a, b) => distances.faces(a, b), TRIANGLE_DIMENSIONS)
  }
}
