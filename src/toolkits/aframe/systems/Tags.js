import { Vector3 } from 'three'

function generateTag (tagID) {
  return {
    id: tagID,
    start: new Vector3(),
    end: new Vector3(),
    position: new Vector3(),
    direction: new Vector3(),
    text: '',
    visible: true,
    needsUpdate: false,
    buttons: [],
    mode: 'lookAtCam'
  }
}
function updateTag (tagsMap, elTags, tagID, params = {}) {
  if (!tagID) throw new Error('tagID', tagID)
  if (!tagsMap.get(tagID)) {
    const tag = generateTag(tagID)
    if (!getElTag(elTags, tagID)) {
      const tagTextEl = document.createElement('a-entity')
      tagTextEl.setAttribute('tag-id', tag.id)
      elTags.append(tagTextEl)
    }
    tagsMap.set(tagID, tag)
  }
  if (tagsMap.get(tagID)) {
    const tag = tagsMap.get(tagID)
    const { start, end, position, direction, color = 'gray' } = params
    if (start) {
      tag.start.copy(start)
    }
    if (end) {
      tag.end.copy(end)
    }
    if (direction) {
      tag.direction.copy(direction)
    }
    tag.mode = params.mode ?? tag.mode
    tag.text = params.text ?? tag.text
    tag.visible = params.visible ?? tag.visible
    tag.needsUpdate = true
    if (position) {
      tag.position.copy(position)
    } else {
      tag.position.addVectors(tag.start, tag.end).multiplyScalar(0.5)
    }
    tag.color = color
  }
}
function getElTag (elTags, tagID) {
  return elTags.querySelector(`[tag-id=${tagID}]`)
}
export default {
  schema: {
    enabled: { type: 'boolean', default: true },
    visible: { type: 'boolean', default: true }
  },
  init () {
    this.tagsMap = new Map()
    const elTags = document.createElement('a-entity')
    elTags.setAttribute('alias', 'injected-tags')
    this.el.append(elTags)
    this.elTags = elTags
  },
  update () {
    this.elTags.object3D.visible = this.data.visible
  },
  // alias
  setTag (tagID, params = {}) {
    updateTag(this.tagsMap, this.elTags, tagID, params)
  },
  getTagEl (tagID) {
    return getElTag(this.elTags, tagID)
  },
  getTag (tagID) {
    return this.tagsMap.get(tagID)
  },
  getAllTags () {
    return [...this.tagsMap.values()]
  },
  deleteTag (tagID) {
    const tagEl = this.getTagEl(tagID)
    tagEl?.remove()
    this.elTags.removeAttribute(`fat-line__${tagID}`)
    this.tagsMap.delete(tagID)
  },
  deleteAllTags () {
    const tagIDs = this.getAllTags().map(tag => tag.id)
    for (const tagID of tagIDs) {
      this.deleteTag(tagID)
    }
  },
  tick () {
    if (!this.data.enabled) return
    for (const tag of this.getAllTags()) {
      const tagTextEl = this.elTags.querySelector(`[tag-id=${tag.id}]`)
      if (tag.needsUpdate) {
        const { start, end, visible, text, position, color } = tag
        this.elTags.setAttribute(`fat-line__${tag.id}`, {
          start: start.clone(),
          end: end.clone(),
          color,
          visible: visible
        })
        tagTextEl.object3D.position.copy(position)
        tagTextEl?.setAttribute('text', {
          width: 30,
          color,
          value: text,
          align: 'center',
          anchor: 'center',
          baseline: 'center',
          side: 'double'
        })
        if (tag.mode === 'manualDirection') {
          const targetPosition = new Vector3().addVectors(
            tag.direction,
            position
          )
          tagTextEl.object3D.lookAt(targetPosition)
        }
        tag.needsUpdate = false
      }
      if (tag.mode === 'lookAtCam') {
        this.el.camera.updateMatrixWorld(true)
        const matrix = this.el.camera.matrixWorld
        tagTextEl.object3D.quaternion.setFromRotationMatrix(matrix)
      }
    }
  }
}
