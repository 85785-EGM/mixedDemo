export class Graph {
  constructor (data) {
    this.fromJSON(data)
  }

  toJSON () {
    return {
      nodes: Object.fromEntries(this.nodes),
      edges: Object.fromEntries(
        [...this.edges.entries()].map(([key, m]) => [key, [...m]])
      )
    }
  }

  fromJSON (data) {
    data = {
      nodes: {},
      edges: {},
      ...data
    }
    this.nodes = new Map(Object.entries(data.nodes))
    this.edges = new Map(
      Object.entries(data.edges).map(([key, m]) => [key, new Set(m)])
    )
    return this
  }

  hasNode (key) {
    return this.nodes.has(key)
  }

  getNode (key) {
    if (!this.hasNode(key)) {
      throw new GraphNoSuchNodeError(key)
    }
    return this.nodes.get(key)
  }

  addNode (key, value) {
    this.nodes.set(key, value)
    return this
  }

  removeNode (key) {
    if (!this.hasNode(key)) {
      throw new GraphNoSuchNodeError(key)
    }
    this.nodes.delete(key)
    return this
  }

  hasEdge (key1, key2) {
    if (!this.hasNode(key1) || !this.hasNode(key2)) {
      return false
    }
    return !!this.edges.get(key1)?.has(key2)
  }

  getEdges (key) {
    if (!this.edges.has(key)) {
      this.edges.set(key, new Set())
    }
    return this.edges.get(key)
  }

  _addEdge (key1, key2) {
    if (!this.edges.has(key1)) {
      this.edges.set(key1, new Set())
    }
    this.edges.get(key1).add(key2)
    return this
  }

  addEdge (key1, key2) {
    return this._addEdge(key1, key2)._addEdge(key2, key1)
  }

  _removeEdge (key1, key2) {
    const m = this.edges.get(key1)
    if (!m || !m.has(key2)) {
      throw new GraphNoSuchEdgeError(key1, key2)
    }
    m.delete(key2)
    return this
  }

  removeEdge (key1, key2) {
    if (!this.hasNode(key1)) {
      throw new GraphNoSuchNodeError(key1)
    }
    if (!this.hasNode(key2)) {
      throw new GraphNoSuchNodeError(key2)
    }
    return this._removeEdge(key1, key2)._removeEdge(key2, key1)
  }

  getNearestNodes (key) {
    return [...this.getEdges(key).keys()].map(k => this.getNode(k))
  }

  * walk (key, opts) {
    opts = {
      condition: () => true,
      includeEdgeCondition: false,
      ...opts
    }
    const walkedMap = new Map()
    const nextMap = new Map()
    const nextKeys = [key]
    nextMap.set(key)

    for (let i = 0; true; i++) {
      const currentKey = nextKeys.shift()
      if (!currentKey && nextKeys.length === 0) break
      walkedMap.set(currentKey)
      const node = this.getNode(currentKey)
      if (opts.condition(node)) {
        yield [node, i]
      } else {
        if (opts.includeEdgeCondition) {
          yield [node, i]
        }
        continue
      }
      for (const nextKey of this.getEdges(currentKey).keys()) {
        if (!walkedMap.has(nextKey) && !nextMap.has(nextKey)) {
          nextKeys.push(nextKey)
          nextMap.set(nextKey)
        }
      }
    }
  }
}

export class GraphNoSuchNodeError extends Error {
  constructor (key) {
    super(`No such node: ${key}`)
  }
}

export class GraphNoSuchEdgeError extends Error {
  constructor (key1, key2) {
    super(`No such edge: ${key1} - ${key2}`)
  }
}
