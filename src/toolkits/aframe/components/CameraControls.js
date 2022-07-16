import { Quaternion, Vector2, Vector3, MathUtils } from 'three'
const SUPPORT_DEVICES = ['mouse', 'touch']
const BUTTON = {
  NONE: 0,
  ONLY_LEFT: 1,
  ONLY_RIGHT: 2,
  ONLY_MIDDLE: 4
}
const WITH_KEY = {
  metaKey: 1,
  shiftKey: 2,
  ctrlKey: 3
}
const STATE = {
  ROTATE: 1,
  ZOOM: 2,
  PAN: 4,
  NONE: 0
}
function isKeyPress (event, key) {
  if (key === WITH_KEY.metaKey) {
    return !!event.metaKey
  }
  if (key === WITH_KEY.ctrlKey) {
    return event.ctrlKey
  }
  if (key === WITH_KEY.shiftKey) {
    return event.shiftKey
  }

  return false
}
const isTouchPad = (function (event) {
  const userAgent = navigator.userAgent
  if (userAgent.includes('Mac')) {
    return function isTouchPad (event) {
      if (Number.isInteger(event.deltaY) && Number.isInteger(event.deltaX)) {
        return true
      }
      return false
    }
  }
  return function () {
    return false
  }
})()
// axis-aligned
function rotateOnWorldAxis (target, worldAxis, angle) {
  const localAxis = new Vector3()
  target.getWorldPosition(localAxis).add(worldAxis)
  target.worldToLocal(localAxis)
  target.rotateOnAxis(localAxis, angle)
}
// 支持控制模式 缩放 平移 旋转
// zoom 缩放 鼠标滚轮 或者双指捏合 缩放即 镜头以目标到镜头所在直线上移动
// pan 平移 鼠标中键拖动 或者双指移动 平移即镜头以目标到镜头所在直线， 作垂直平面，镜头在平面上该进行上移动
// rotate 旋转 鼠标右键拖动 或者单指移动 旋转即镜头以目标位为旋转中心，沿拖拽方向在半径为目标到相机距离的球上进行移动，镜头不应发生在半径方向上的旋转，镜头与目标的距离保持不变
function makeRotate (camera, target, addX, addY) {
  const add = new Vector3(-addX, addY, 0)
  camera.localToWorld(add)
  add.sub(target).normalize()
  const eye = new Vector3()
  eye.copy(camera.position).sub(target)
  const rotation = new Quaternion()
  rotation.setFromUnitVectors(eye.clone().normalize(), add)
  eye.applyQuaternion(rotation)
  camera.position.addVectors(eye, target)
}
function makeSelfRotate (camera, angle) {
  const zAxis = new Vector3()
  camera.getWorldDirection(zAxis)
  rotateOnWorldAxis(camera, zAxis, angle)
}
function makePan (
  camera,
  target,
  addX,
  addY,
  { speed = 0.05, alignedY = false }
) {
  const add = new Vector3(-addX, addY, 0)
  add.multiplyScalar(speed)
  camera.localToWorld(add)
  add.sub(camera.position)
  if (alignedY) {
    add.y = 0
  }
  camera.position.add(add)
  target.add(add)
}
function makeZoom (camera, target, factor) {
  const eye = new Vector3()
  eye.copy(camera.position).sub(target)
  if (factor > 0.0 && factor !== 1.0) {
    eye.multiplyScalar(factor)
  }
  const distance = eye.length()
  const { far, near } = camera
  if (distance > near && distance * 2 < far) {
    camera.position.addVectors(eye, target)
    camera.distance = distance
    if (camera.isOrthographicCamera) {
      camera.setDistance(distance)
    }
  }
}

function getDefaultOffset () {
  return {
    x: 0,
    y: 0,
    z: 200
  }
}

export default {
  dependencies: ['camera', 'camera-look-at'],
  schema: {
    enabled: { type: 'boolean', default: true },
    offset: {
      type: 'vec3',
      default: getDefaultOffset()
    },
    panSpeed: { type: 'number', default: 0.05 },
    timers: { type: 'array', default: ['camera'] }
  },
  // state: STATE.NONE,
  // last: new Vector2(),
  // target: new Vector3(),
  init () {
    this.state = STATE.NONE
    this.last = new Vector2()
    const sceneEl = this.el.sceneEl
    this.target = this.el.components['camera-look-at'].target
    const camera = sceneEl.camera
    camera.position.copy(this.data.offset)
    makeZoom(camera, this.target, 1)
    this.onMouseWheel = this.onMouseWheel.bind(this)
    sceneEl.canvas.addEventListener('wheel', this.onMouseWheel)
    sceneEl.systems.screen.bind(this)
  },
  update () {
    const { enabled } = this.data
    if (enabled) {
      this.el.sceneEl.systems.screen.register(this)
      const camera = this.el.sceneEl.camera
      camera.lookAt(this.target)
    } else {
      this.el.sceneEl.systems.screen.unregister(this)
    }
  },
  tick (t) {
    // if (!this.data.enabled) return
    // const camera = this.el.sceneEl.camera
    // camera.lookAt(this.target)
  },
  remove () {
    this.el.sceneEl.systems.screen.unregister(this)
    this.el.sceneEl.canvas.removeEventListener('wheel', this.onMouseWheel)
  },
  pointers: new Set(),
  onPointerDown: {
    check (event) {
      if (!SUPPORT_DEVICES.includes(event.pointerType)) return
      if (event.pointerType === 'mouse') {
        if (event.buttons === BUTTON.ONLY_MIDDLE) {
          this.last.set(event.x, event.y)
          this.state = STATE.PAN
        } else if (event.buttons === BUTTON.ONLY_RIGHT) {
          this.last.set(event.x, event.y)
          this.state = STATE.ROTATE
        } else {
          this.state = STATE.NONE
        }
        if (this.state !== STATE.NONE) {
          this.dragStart = Date.now()
        }
      } else if (event.pointerType === 'touch') {
        this.pointers.add(event.pointerId)
        if (this.pointers.size === 1) {
          this.last.set(event.x, event.y)
          this.state = STATE.ROTATE
        } else {
          this.state = STATE.NONE
        }
      }

      return false
    }
  },
  onPointerMove: {
    check (event) {
      if (!SUPPORT_DEVICES.includes(event.pointerType)) return
      if (this.state === STATE.NONE) return
      const dir = new Vector2()
      dir.set(event.x, event.y).sub(this.last)
      this.last.set(event.x, event.y)
      const camera = this.el.sceneEl.camera
      if (!camera) return
      if (this.state === STATE.ROTATE) {
        makeRotate(camera, this.target, parseInt(dir.x), parseInt(dir.y))
      }
      if (this.state === STATE.PAN) {
        makePan(camera, this.target, dir.x, dir.y, {
          speed: this.data.panSpeed,
          alignedY: isKeyPress(event, WITH_KEY.ctrlKey)
        })
      }
      camera.lookAt(this.target)
      return false
    }
  },
  onPointerUp: {
    check (event) {
      if (!SUPPORT_DEVICES.includes(event.pointerType)) return
      this.pointers.delete(event.pointerId)
      if (event.pointerType === 'mouse' && this.state !== STATE.NONE) {
        const dragTime = Date.now() - this.dragStart
        this.el.sceneEl.systems.timer.addTime(this.data.timers, dragTime)
      }
      this.state = STATE.NONE
    }
  },
  onPointerCancel: {
    check (event) {
      if (!SUPPORT_DEVICES.includes(event.pointerType)) return
      this.pointers.delete(event.pointerId)
      this.state = STATE.NONE
    }
  },
  onMouseWheel (event) {
    event.preventDefault()
    const camera = this.el.sceneEl.camera
    if (isTouchPad(event)) {
      if (isKeyPress(event, WITH_KEY.metaKey)) {
        makePan(camera, this.target, -event.deltaX, -event.deltaY, {
          speed: this.data.panSpeed,
          alignedY: isKeyPress(event, WITH_KEY.ctrlKey)
        })
      } else if (isKeyPress(event, WITH_KEY.shiftKey)) {
        makeZoom(
          camera,
          this.target,
          1 - (event.deltaY + event.deltaX) * 0.0025
        )
      } else {
        makeRotate(camera, this.target, -event.deltaX, -event.deltaY)
      }
    } else {
      let zoom = 0
      switch (event.deltaMode) {
        case 2:
          // Zoom in pages
          zoom += event.deltaY * 0.025
          break
        case 1:
          // Zoom in lines
          zoom += event.deltaY * 0.01
          break
        default:
          // undefined, 0, assume pixels
          zoom += event.deltaY * 0.00025
          break
      }
      if (isKeyPress(event, WITH_KEY.ctrlKey)) {
        zoom *= 20
      }
      makeZoom(camera, this.target, 1 + zoom)
    }
    camera.lookAt(this.target)
  },
  lastGesture: {},
  onGestureStart: {
    check (event) {
      this.lastGesture.scale = 1
      this.lastGesture.rotation = 0
      this.lastGesture.clientX = event.clientX
      this.lastGesture.clientY = event.clientY
    }
  },
  onGestureChange: {
    check (event) {
      const factor = this.lastGesture.scale / event.scale
      const rotate = this.lastGesture.rotation - event.rotation
      const deltaX = this.lastGesture.clientX - event.clientX
      const deltaY = this.lastGesture.clientY - event.clientY
      this.lastGesture.scale = event.scale
      this.lastGesture.rotation = event.rotation
      this.lastGesture.clientX = event.clientX
      this.lastGesture.clientY = event.clientY
      const camera = this.el.sceneEl.camera
      if (!camera) {
        console.error('camera not exist')
        return
      }
      makePan(camera, this.target, -deltaX * 0.5, -deltaY * 0.5, {
        speed: this.data.panSpeed,
        alignedY: WITH_KEY.ctrlKey
      })
      makeZoom(camera, this.target, factor)
      makeSelfRotate(camera, rotate * MathUtils.DEG2RAD)
      camera.lookAt(this.target)
    }
  },
  onGestureEnd: {
    check (event) {}
  }
}
