export class HalfEdgeError extends Error {
  constructor (message) {
    super(`HalfEdgeError: ${message}`)
  }
}

export class NoSuchPointError extends HalfEdgeError {
  constructor (index) {
    super(`No such point: ${index}`)
  }
}

export class NoSuchEdgeError extends HalfEdgeError {
  constructor (index) {
    super(`No such edge: ${index}`)
  }
}

export class NoSuchFacetError extends HalfEdgeError {
  constructor (index) {
    super(`No such facet: ${index}`)
  }
}
