import { Vector2 } from 'three'
import aframe from 'aframe'
const { bind } = aframe.utils
const IGNORED_POINTER_TYPES = ['touch']
const MAX_OFFSET = 0.008
const _vec2 = new Vector2()
function checkVisible (object3D) {
  let visible = object3D.visible
  object3D.traverseAncestors(
    ancestor => (visible = ancestor.visible && visible)
  )
  return visible
}
const BUTTONS = ['button', 'ctrlKey', 'shiftKey', 'metaKey']
export default {
  schema: {
    enabled: { default: true },
    button: { default: 1, type: 'int' },
    castInvisible: { default: false },
    castBackground: { default: true, type: 'boolean' },
    targets: { default: '[clickable]', type: 'string' },
    target: { default: '', type: 'selector' }
  },
  intersectedEventDetail: {},
  objects: [],
  dirty: true,
  pointerPos: new Vector2(),
  init () {
    this.isPointerDown = false
    const sceneEl = this.el.sceneEl
    this.setDirty = bind(this.setDirty, this)
    sceneEl.addEventListener('object3dset', this.setDirty)
    sceneEl.addEventListener('object3dremove', this.setDirty)
    this.intersectedEventDetail.cursorEl = this.el
    sceneEl.systems.screen.bind(this)
    this.updateObjects = aframe.utils.throttle(this.updateObjects, 300, this)
  },
  update () {
    this.setDirty()
    if (this.data.enabled) {
      this.el.sceneEl.systems.screen.register(this)
    } else {
      this.el.sceneEl.systems.screen.unregister(this)
    }
  },
  remove () {
    this.el.sceneEl.removeEventListener('object3dset', this.setDirty)
    this.el.sceneEl.removeEventListener('object3dremove', this.setDirty)
    this.el.sceneEl.systems.screen.unregister(this)
  },
  updateObjects () {
    if (!this.dirty) return
    const els = this.data.target
      ? [this.data.target]
      : this.el.sceneEl.querySelectorAll(this.data.targets)
    let key
    let i
    const objects = this.objects
    // Push meshes and other attachments onto list of objects to intersect.
    objects.length = 0
    for (i = 0; i < els.length; i++) {
      if (els[i].isEntity && els[i].object3D) {
        for (key in els[i].object3DMap) {
          if (key === 'mesh') {
            objects.push(els[i].getObject3D(key))
          }
        }
      }
    }
    this.dirty = false
  },

  setDirty () {
    this.dirty = true
    setTimeout(() => {
      this.updateObjects()
    }, 100)
  },

  onPointerDown: {
    check (event) {
      if (IGNORED_POINTER_TYPES.includes(event.pointerType)) return
      if (event.buttons !== this.data.button) return
      const x = (event.clientX / window.innerWidth) * 2 - 1
      const y = -(event.clientY / window.innerHeight) * 2 + 1
      this.pointerPos.set(x, y)
      this.isPointerDown = true
      this.needEmit = false
      this.castBackground = false
      return true
    },
    doRaycast (raycaster) {
      const rawIntersections = []
      // console.time('clicker')
      for (const object of this.objects) {
        try {
          raycaster.intersectObject(object, false, rawIntersections)
        } catch (error) {
          console.error(error)
        }
      }
      // console.timeEnd('clicker')
      // find nearest visible intersections object that have a reference to an entity.
      const intersections = rawIntersections.filter(intersection => {
        if (!intersection.object.el) return false
        if (!this.data.castInvisible) {
          if (checkVisible(intersection.object) === false) {
            return false
          }
        }
        return true
      })
      if (this.data.castBackground) {
        if (intersections.length === 0) {
          this.intersection = null
          return Infinity
        }
      }
      intersections.sort((a, b) => a.distance - b.distance)
      this.intersection = intersections[0]
      return intersections[0]?.distance
    },
    nearestTrigger () {
      const intersection = this.intersection
      if (intersection?.object) {
        this.needEmit = true
        this.intersectedEventDetail.el = intersection.object.el
        this.intersectedEventDetail.intersection = intersection
        return
      }
      if (this.data.castBackground) {
        this.clickBackground = true
        this.needEmit = true
        this.intersectedEventDetail.el = null
        this.intersectedEventDetail.intersection = null
      }
    }
  },
  onPointerUp: {
    check (event) {
      if (IGNORED_POINTER_TYPES.includes(event.pointerType)) return
      if (!this.isPointerDown) return
      if (this.needEmit) {
        const x = (event.clientX / window.innerWidth) * 2 - 1
        const y = -(event.clientY / window.innerHeight) * 2 + 1
        _vec2.set(x, y)
        const offset = this.pointerPos.manhattanDistanceTo(_vec2)
        if (offset < MAX_OFFSET) {
          // means pointer is move
          for (const name of BUTTONS) {
            this.intersectedEventDetail[name] = event[name]
          }
          if (this.intersection) {
            this.el.emit('click', this.intersectedEventDetail, false)
            this.intersectedEventDetail.el.emit(
              'click',
              this.intersectedEventDetail,
              false
            )
          } else if (this.clickBackground) {
            this.el.emit('click-background', this.intersectedEventDetail, false)
          }
        }
      }
      this.isPointerDown = false
      this.needEmit = false
      delete this.intersection
    }
  }
}
