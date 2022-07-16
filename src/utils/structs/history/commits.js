import { setMatrix } from '@/utils/three'
import { CommitNotImplementedError } from './errors'
import { setAttributeValues } from '@/utils/algo/diffPatch'

export class Commit {
  constructor ({ undo, redo }) {
    if (!undo) {
      throw new CommitNotImplementedError('undo')
    }
    if (!redo) {
      throw new CommitNotImplementedError('redo')
    }
    this.undo = undo
    this.redo = redo
  }
}

export class GroupCommit extends Commit {
  constructor (...commits) {
    super({
      undo: () => {
        for (const commit of commits) {
          commit.undo()
        }
      },
      redo: () => {
        for (const commit of commits) {
          commit.redo()
        }
      }
    })
  }
}

export class JsonCommit extends Commit {
  constructor (object, prevValue, value) {
    super({
      undo: () => {
        for (const key in prevValue) {
          object[key] = prevValue[key]
        }
        for (const key in object) {
          if (!Object.prototype.hasOwnProperty.call(prevValue, key)) {
            delete object[key]
          }
        }
      },
      redo: () => {
        for (const key in value) {
          object[key] = value[key]
        }
        for (const key in object) {
          if (!Object.prototype.hasOwnProperty.call(value, key)) {
            delete object[key]
          }
        }
      }
    })
  }
}

export class BufferAttributeCommit extends Commit {
  constructor (attribute, patch) {
    super({
      undo: () => {
        for (const p of patch) {
          setAttributeValues(attribute, p[0], p[1])
        }
        attribute.needsUpdate = true
      },
      redo: () => {
        for (const p of patch) {
          setAttributeValues(attribute, p[0], p[2])
        }
        attribute.needsUpdate = true
      }
    })
  }
}

export class TeethAttributeCommit extends Commit {
  constructor (teethAttribute, patch) {
    super({
      undo: () => {
        for (const p of patch) {
          teethAttribute.setX(p[0], p[1])
        }
        teethAttribute.needsUpdate = true
      },
      redo: () => {
        for (const p of patch) {
          teethAttribute.setX(p[0], p[2])
        }
        teethAttribute.needsUpdate = true
      }
    })
  }
}

export class VolumeDataCommit extends Commit {
  constructor (texture, patch) {
    super({
      undo: () => {
        for (const p of patch) {
          texture.image.data[p[0]] = p[1]
        }
        texture.needsUpdate = true
      },
      redo: () => {
        for (const p of patch) {
          texture.image.data[p[0]] = p[2]
        }
        texture.needsUpdate = true
      }
    })
  }
}

export class MatrixCommit extends Commit {
  constructor (object, prevValue, value) {
    super({
      undo: () => {
        setMatrix(object, prevValue)
      },
      redo: () => {
        setMatrix(object, value)
      }
    })
  }
}
