export class Node {
  constructor (obj, dimension, parent) {
    this.obj = obj
    this.left = null
    this.right = null
    this.parent = parent
    this.dimension = dimension
  }
}

export class KDTree {
  constructor (points, metric, dimensions) {
    this.metric = metric
    this.dimensions = dimensions
    if (!Array.isArray(points)) {
      this.loadTree(points, metric, dimensions)
    } else {
      this.root = this.buildTree(points, 0, null)
    }
  }

  buildTree (points, depth, parent) {
    const dim = depth % this.dimensions.length

    if (points.length === 0) {
      return null
    }
    if (points.length === 1) {
      return new Node(points[0], dim, parent)
    }

    points.sort((a, b) => a[this.dimensions[dim]] - b[this.dimensions[dim]])

    const median = Math.floor(points.length / 2)
    const node = new Node(points[median], dim, parent)
    node.left = this.buildTree(points.slice(0, median), depth + 1, node)
    node.right = this.buildTree(points.slice(median + 1), depth + 1, node)

    return node
  }

  loadTree (data) {
    this.root = data

    function restoreParent (root) {
      if (root.left) {
        root.left.parent = root
        restoreParent(root.left)
      }

      if (root.right) {
        root.right.parent = root
        restoreParent(root.right)
      }
    }

    restoreParent(this.root)
  }

  toJSON (src) {
    if (!src) src = this.root
    const dest = new Node(src.obj, src.dimension, null)
    if (src.left) {
      dest.left = this.toJSON(src.left)
    }
    if (src.right) {
      dest.right = this.toJSON(src.right)
    }
    return dest
  }

  insert (point) {
    const insertPosition = this.innerSearch(this.root, null)

    if (insertPosition === null) {
      this.root = new Node(point, 0, null)
      return
    }

    const newNode = new Node(
      point,
      (insertPosition.dimension + 1) % this.dimensions.length,
      insertPosition
    )
    const dimension = this.dimensions[insertPosition.dimension]

    if (point[dimension] < insertPosition.obj[dimension]) {
      insertPosition.left = newNode
    } else {
      insertPosition.right = newNode
    }
  }

  innerSearch (node, parent, point) {
    if (node === null) {
      return parent
    }

    const dimension = this.dimensions[node.dimension]
    if (point[dimension] < node.obj[dimension]) {
      return this.innerSearch(node.left, node, point)
    } else {
      return this.innerSearch(node.right, node, point)
    }
  }

  remove (point) {
    const node = this.nodeSearch(this.root, point)

    if (node === null) {
      return
    }

    this.removeNode(node)
  }

  nearest (point, maxNodes, maxDistance) {
    const bestNodes = new BinaryHeap(e => -e[1])

    if (maxDistance) {
      for (let i = 0; i < maxNodes; i++) {
        bestNodes.push([null, maxDistance])
      }
    }

    if (this.root) {
      this.nearestSearch(this.root, point, bestNodes, maxNodes)
    }

    const result = []

    for (let i = 0; i < Math.min(maxNodes, bestNodes.content.length); i++) {
      if (bestNodes.content[i][0]) {
        result.push([bestNodes.content[i][0].obj, bestNodes.content[i][1]])
      }
    }
    return result
  }

  nearestSearch (node, point, bestNodes, maxNodes) {
    let bestChild
    const dimension = this.dimensions[node.dimension]
    const ownDistance = this.metric(point, node.obj)
    const linearPoint = {}
    let otherChild

    function saveNode (node, distance) {
      bestNodes.push([node, distance])
      if (bestNodes.size() > maxNodes) {
        bestNodes.pop()
      }
    }

    for (let i = 0; i < this.dimensions.length; i++) {
      if (i === node.dimension) {
        linearPoint[this.dimensions[i]] = point[this.dimensions[i]]
      } else {
        linearPoint[this.dimensions[i]] = node.obj[this.dimensions[i]]
      }
    }

    const linearDistance = this.metric(linearPoint, node.obj)

    if (node.right === null && node.left === null) {
      if (bestNodes.size() < maxNodes || ownDistance < bestNodes.peek()[1]) {
        saveNode(node, ownDistance)
      }
      return
    }

    if (node.right === null) {
      bestChild = node.left
    } else if (node.left === null) {
      bestChild = node.right
    } else {
      if (point[dimension] < node.obj[dimension]) {
        bestChild = node.left
      } else {
        bestChild = node.right
      }
    }

    this.nearestSearch(bestChild, point, bestNodes, maxNodes)

    if (bestNodes.size() < maxNodes || ownDistance < bestNodes.peek()[1]) {
      saveNode(node, ownDistance)
    }

    if (
      bestNodes.size() < maxNodes ||
      Math.abs(linearDistance) < bestNodes.peek()[1]
    ) {
      if (bestChild === node.left) {
        otherChild = node.right
      } else {
        otherChild = node.left
      }
      if (otherChild !== null) {
        this.nearestSearch(otherChild, point, bestNodes, maxNodes)
      }
    }
  }

  balanceFactor () {
    function height (node) {
      if (node === null) {
        return 0
      }
      return Math.max(height(node.left), height(node.right)) + 1
    }

    function count (node) {
      if (node === null) {
        return 0
      }
      return count(node.left) + count(node.right) + 1
    }

    return height(this.root) / (Math.log(count(this.root)) / Math.log(2))
  }

  nodeSearch (node, point) {
    if (node === null) {
      return null
    }

    if (node.obj === point) {
      return node
    }

    const dimension = this.dimensions[node.dimension]

    if (point[dimension] < node.obj[dimension]) {
      return this.nodeSearch(node.left, node)
    } else {
      return this.nodeSearch(node.right, node)
    }
  }

  removeNode (node) {
    let nextNode, nextObj, pDimension

    if (node.left === null && node.right === null) {
      if (node.parent === null) {
        this.root = null
        return
      }

      pDimension = this.dimensions[node.parent.dimension]

      if (node.obj[pDimension] < node.parent.obj[pDimension]) {
        node.parent.left = null
      } else {
        node.parent.right = null
      }
      return
    }

    // If the right subtree is not empty, swap with the minimum element on the
    // node's dimension. If it is empty, we swap the left and right subtrees and
    // do the same.
    if (node.right !== null) {
      nextNode = this.findMin(node.right, node.dimension)
      nextObj = nextNode.obj
      this.removeNode(nextNode)
      node.obj = nextObj
    } else {
      nextNode = this.findMin(node.left, node.dimension)
      nextObj = nextNode.obj
      this.removeNode(nextNode)
      node.right = node.left
      node.left = null
      node.obj = nextObj
    }
  }

  findMin (node, dim) {
    if (node === null) {
      return null
    }

    const dimension = this.dimensions[dim]

    if (node.dimension === dim) {
      if (node.left !== null) {
        return this.findMin(node.left, dim)
      }
      return node
    }

    const own = node.obj[dimension]
    const left = this.findMin(node.left, dim)
    const right = this.findMin(node.right, dim)
    let min = node

    if (left !== null && left.obj[dimension] < own) {
      min = left
    }
    if (right !== null && right.obj[dimension] < min.obj[dimension]) {
      min = right
    }
    return min
  }
}

export class BinaryHeap {
  constructor (scoreFunction) {
    this.content = []
    this.scoreFunction = scoreFunction
  }

  push (element) {
    // Add the new element to the end of the array.
    this.content.push(element)
    // Allow it to bubble up.
    this.bubbleUp(this.content.length - 1)
  }

  pop () {
    // Store the first element so we can return it later.
    const result = this.content[0]
    // Get the element at the end of the array.
    const end = this.content.pop()
    // If there are any elements left, put the end element at the
    // start, and let it sink down.
    if (this.content.length > 0) {
      this.content[0] = end
      this.sinkDown(0)
    }
    return result
  }

  peek () {
    return this.content[0]
  }

  remove (node) {
    const len = this.content.length
    // To remove a value, we must search through the array to find
    // it.
    for (let i = 0; i < len; i++) {
      if (this.content[i] === node) {
        // When it is found, the process seen in 'pop' is repeated
        // to fill up the hole.
        const end = this.content.pop()
        if (i !== len - 1) {
          this.content[i] = end
          if (this.scoreFunction(end) < this.scoreFunction(node)) {
            this.bubbleUp(i)
          } else this.sinkDown(i)
        }
        return
      }
    }
    throw new Error('Node not found.')
  }

  size () {
    return this.content.length
  }

  bubbleUp (n) {
    // Fetch the element that has to be moved.
    const element = this.content[n]
    // When at 0, an element can not go up any further.
    while (n > 0) {
      // Compute the parent element's index, and fetch it.
      const parentN = Math.floor((n + 1) / 2) - 1
      const parent = this.content[parentN]
      // Swap the elements if the parent is greater.
      if (this.scoreFunction(element) < this.scoreFunction(parent)) {
        this.content[parentN] = element
        this.content[n] = parent
        // Update 'n' to continue at the new position.
        n = parentN
      } else {
        // Found a parent that is less, no need to move it further.
        break
      }
    }
  }

  sinkDown (n) {
    // Look up the target element and its score.
    const length = this.content.length
    const element = this.content[n]
    const elemScore = this.scoreFunction(element)

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Compute the indices of the child elements.
      const child2N = (n + 1) * 2
      const child1N = child2N - 1
      // This is used to store the new position of the element,
      // if any.
      let swap = null
      let child1Score
      // If the first child exists (is inside the array)...
      if (child1N < length) {
        // Look it up and compute its score.
        const child1 = this.content[child1N]
        child1Score = this.scoreFunction(child1)
        // If the score is less than our element's, we need to swap.
        if (child1Score < elemScore) {
          swap = child1N
        }
      }
      // Do the same checks for the other child.
      if (child2N < length) {
        const child2 = this.content[child2N]
        const child2Score = this.scoreFunction(child2)
        if (child2Score < (swap == null ? elemScore : child1Score)) {
          swap = child2N
        }
      }

      // If the element needs to be moved, swap it, and continue.
      if (swap != null) {
        this.content[n] = this.content[swap]
        this.content[swap] = element
        n = swap
      } else {
        // Otherwise, we are done.
        break
      }
    }
  }
}
