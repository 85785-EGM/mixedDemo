import { Vector3, Vector2, Raycaster } from 'three'

const screen = new Vector2()
function calcMouse (screen, clientX, clientY) {
  screen.set(
    (clientX / window.innerWidth) * 2 - 1, // x
    -(clientY / window.innerHeight) * 2 + 1 // y
  )
}
// function checkBrowser () {
//   logger(navigator.userAgent)
// }
// function logger (...args) {
//   const el = document.querySelector('#logger')
//   if (el) {
//     el.innerText = [
//       new Date().getSeconds() + '.' + new Date().getMilliseconds(),
//       ...args
//     ].join(',')
//   }
// }
const _pointers = []
const _pointerPositions = {}
const cache = {
  distance: 0,
  factor: 1
}
const fakePreventDefault = () => {}
function buildGestureEvent (step) {
  const p0 = _pointerPositions[_pointers[0].pointerId]
  const p1 = _pointerPositions[_pointers[1].pointerId]
  const position = new Vector2().addVectors(p0, p1).multiplyScalar(0.5)
  let factor = 1
  const distance = p0.distanceTo(p1)
  if (step === 'start') {
    factor = 1
    cache.distance = distance
  }
  if (['change', 'end'].includes(step)) {
    factor = distance / cache.distance
  }
  return {
    type: `gesture${step}`,
    clientX: position.x,
    clientY: position.y,
    scale: factor,
    rotation: 0,
    preventDefault: fakePreventDefault
  }
}
function addPointer (event) {
  if (_pointers.length <= 2) _pointers.push(event)
}

function removePointer (event) {
  delete _pointerPositions[event.pointerId]

  for (let i = 0; i < _pointers.length; i++) {
    if (_pointers[i].pointerId === event.pointerId) {
      _pointers.splice(i, 1)
      return
    }
  }
}

function trackPointer (event) {
  let position = _pointerPositions[event.pointerId]

  if (position === undefined) {
    position = new Vector2()
    _pointerPositions[event.pointerId] = position
  }

  position.set(event.clientX, event.clientY)
}

//  return vec2s array without first point, unit is pixel
function makeStraightStroke (
  lastVec2 = new Vector2(),
  nowVec2 = new Vector2(),
  division = 3
) {
  if (lastVec2.manhattanDistanceTo(nowVec2) < 3) return [nowVec2.clone()]
  const curvePoints = []
  const part = 1 / division
  for (let i = 1; i < division; i++) {
    // i start from 1, because we never need last point
    curvePoints.push(lastVec2.clone().lerp(nowVec2, i * part))
  }
  curvePoints.push(nowVec2.clone())
  return curvePoints
}

function updateRaycaster (raycaster, camera, x, y) {
  calcMouse(screen, x, y)
  camera.parent.updateMatrixWorld()
  camera.updateMatrixWorld()
  raycaster.setFromCamera(screen, camera)
}
function processComponents (
  controllers,
  event,
  raycaster,
  camera,
  smoothPoints = []
) {
  const enabledControllers = []
  for (const controller of controllers) {
    const check = controller?.check
    if (!check) continue
    if (check(event)) {
      enabledControllers.push(controller)
    }
  }
  if (enabledControllers.length === 0) return
  const raycastControllers = enabledControllers.filter(
    o => typeof o?.doRaycast === 'function'
  )
  if (raycastControllers.length === 0) return
  const skipSmooth = !raycastControllers.some(o => o?.enableSmooth)
  const count = smoothPoints.length
  const final = count - 1
  for (let i = 0; i < count; i++) {
    const point = smoothPoints[i]
    if (skipSmooth && i !== final) continue
    updateRaycaster(raycaster, camera, point.x, point.y)
    for (const handle of raycastControllers) {
      if (i !== final && raycaster.smooth) continue
      const doRaycast = handle.doRaycast
      const intersected = doRaycast(raycaster)
      handle.distance = intersected
    }
  }
  const triggerControllers = raycastControllers.filter(
    o => typeof o?.distance === 'number'
  )
  if (triggerControllers.length === 0) return
  triggerControllers.sort((a, b) => a.distance - b.distance)
  const nearestTrigger = triggerControllers[0]?.nearestTrigger
  if (nearestTrigger) nearestTrigger()
}
export default {
  schema: {
    polyfill: {
      type: 'boolean',
      default: navigator.userAgent.includes('Android')
    }
  },
  raycaster: new Raycaster(),
  screen: new Vector2(),
  controllers: new Set(),
  init () {
    const canvas = this.el.canvas
    this.canvas = canvas
    this.onPointerDown = this.onPointerDown.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerUp = this.onPointerUp.bind(this)
    this.onPointerCancel = this.onPointerCancel.bind(this)
    this.onGestureStart = this.onGestureStart.bind(this)
    this.onGestureChange = this.onGestureChange.bind(this)
    this.onGestureEnd = this.onGestureEnd.bind(this)
    this.el.addEventListener('cameraready', () => {
      const camera = this.el.camera
      this.raycaster.camera = camera
    })
    canvas.oncontextmenu = function () {
      return false
    }
    canvas.addEventListener('pointerdown', this.onPointerDown, false)
    canvas.addEventListener('pointerup', this.onPointerUp, false)
    canvas.addEventListener('pointermove', this.onPointerMove, false)
    canvas.addEventListener('pointercancel', this.onPointerCancel, false)
    canvas.addEventListener('gesturestart', this.onGestureStart, false)
    canvas.addEventListener('gesturechange', this.onGestureChange, false)
    canvas.addEventListener('gestureend', this.onGestureEnd, false)
    // checkBrowser()
  },
  update () {
    if (this.data.polyfill) {
      this.canvas.removeEventListener('gesturestart', this.onGestureStart)
      this.canvas.removeEventListener('gesturechange', this.onGestureChange)
      this.canvas.removeEventListener('gestureend', this.onGestureEnd)
    }
  },
  remove () {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointerup', this.onPointerUp)
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointercancel', this.onPointerCancel)
    this.canvas.removeEventListener('gesturestart', this.onGestureStart)
    this.canvas.removeEventListener('gesturechange', this.onGestureChange)
    this.canvas.removeEventListener('gestureend', this.onGestureEnd)
  },
  getXY (worldPosition, target) {
    const camera = this.el.camera
    const pos = new Vector3()
    pos.copy(worldPosition)
    pos.project(camera)
    // const canvas = this.el.sceneEl.canvas
    const canvasWidth = window.innerWidth
    const canvasHeight = window.innerHeight
    const widthHalf = canvasWidth / 2
    const heightHalf = canvasHeight / 2

    pos.x = pos.x * widthHalf + widthHalf
    pos.y = -(pos.y * heightHalf) + heightHalf
    pos.z = 0

    if (target) {
      target.x = pos.x
      target.y = pos.y
      return target
    }
    return new Vector2(pos.x, pos.y)
  },
  bind (component) {
    for (const handle of [
      'onPointerDown',
      'onPointerMove',
      'onPointerUp',
      'onPointerCancel',
      'onGestureStart',
      'onGestureChange',
      'onGestureEnd'
    ]) {
      if (!component[handle]) continue
      component['_' + handle] = {}
      for (const func of ['check', 'doRaycast', 'nearestTrigger']) {
        if (!component[handle][func]) continue
        component['_' + handle][func] = component[handle][func].bind(component)
      }
    }
  },
  register (component) {
    this.controllers.add(component)
  },
  unregister (component) {
    this.controllers.delete(component)
  },
  lastPoint: new Vector2(),
  nowPoint: new Vector2(),
  onPointerDown (event) {
    if (event.pointerType === 'touch' && this.data.polyfill) {
      addPointer(event)
      trackPointer(event)
      if (_pointers.length > 1) {
        const event = buildGestureEvent('start')
        this.onGestureStart(event)
        return
      }
    }
    if (this.controllers.size === 0) return
    const controllers = [...this.controllers.values()]
      .filter(c => c._onPointerDown)
      .map(c => c._onPointerDown)
    this.lastPoint.set(event.clientX, event.clientY)
    processComponents(
      controllers,
      event,
      this.raycaster,
      this.el.sceneEl.camera,
      [this.lastPoint.clone()]
    )
  },
  onPointerMove (event) {
    if (event.pointerType === 'touch' && this.data.polyfill) {
      trackPointer(event)
      if (_pointers.length > 1) {
        const event = buildGestureEvent('change')
        this.onGestureChange(event)
        return
      }
    }
    if (this.controllers.size === 0) return
    const controllers = [...this.controllers.values()]
      .filter(c => c._onPointerMove)
      .map(c => c._onPointerMove)
    const events = []
    if (typeof event.getCoalescedEvents === 'function') {
      events.push(...event.getCoalescedEvents())
    } else {
      events.push(event)
    }
    for (const e of events) {
      this.nowPoint.set(e.clientX, e.clientY)
      const smoothPoints = makeStraightStroke(this.lastPoint, this.nowPoint)
      this.lastPoint.copy(this.nowPoint)
      processComponents(
        controllers,
        e,
        this.raycaster,
        this.el.sceneEl.camera,
        smoothPoints
      )
    }
  },
  onPointerUp (event) {
    if (event.pointerType === 'touch' && this.data.polyfill) {
      removePointer(event)
      if (_pointers.length > 1) {
        const event = buildGestureEvent('end')
        this.onGestureEnd(event)
        return
      }
    }
    if (this.controllers.size === 0) return
    const controllers = [...this.controllers.values()]
      .filter(c => c._onPointerUp)
      .map(c => c._onPointerUp)
    this.nowPoint.set(event.clientX, event.clientY)
    const smoothPoints = makeStraightStroke(this.lastPoint, this.nowPoint)
    this.lastPoint.copy(this.nowPoint)
    processComponents(
      controllers,
      event,
      this.raycaster,
      this.el.sceneEl.camera,
      smoothPoints
    )
  },
  onPointerCancel (event) {
    if (event.pointerType === 'touch' && this.data.polyfill) {
      removePointer(event)
    }
    if (this.controllers.size === 0) return
    const controllers = [...this.controllers.values()]
      .filter(c => c._onPointerCancel)
      .map(c => c._onPointerCancel)
    this.nowPoint.set(event.clientX, event.clientY)
    const smoothPoints = makeStraightStroke(this.lastPoint, this.nowPoint)
    this.lastPoint.copy(this.nowPoint)
    processComponents(
      controllers,
      event,
      this.raycaster,
      this.el.sceneEl.camera,
      smoothPoints
    )
  },
  // gesture only exists in safari
  onGestureStart (event) {
    event?.preventDefault()
    if (this.controllers.size === 0) return
    const controllers = [...this.controllers.values()]
      .filter(c => c._onGestureStart)
      .map(c => c._onGestureStart)
    processComponents(
      controllers,
      event,
      this.raycaster,
      this.el.sceneEl.camera,
      [new Vector2(event.clientX, event.clientY)]
    )
  },
  onGestureChange (event) {
    event?.preventDefault()
    if (this.controllers.size === 0) return
    const controllers = [...this.controllers.values()]
      .filter(c => c._onGestureChange)
      .map(c => c._onGestureChange)
    processComponents(
      controllers,
      event,
      this.el.sceneEl.camera,
      this.raycaster[new Vector2(event.clientX, event.clientY)]
    )
  },
  onGestureEnd (event) {
    event?.preventDefault()
    if (this.controllers.size === 0) return
    const controllers = [...this.controllers.values()]
      .filter(c => c._onGestureEnd)
      .map(c => c._onGestureEnd)
    processComponents(
      controllers,
      event,
      this.el.sceneEl.camera,
      this.raycaster[new Vector2(event.clientX, event.clientY)]
    )
  }
}
