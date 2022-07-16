import { getTeethAll } from '@/toolkits/aframe/components/ortho/helpers'
import { id } from '@/utils/aframe'
import { getSideTeethIDs, getRightTeethIDs } from '@/utils/ortho'
import {
  getElementID,
  getTeethIDs
} from '@/views/workspace/cases/steps/helpers'
import { Base } from '../components/ortho/core'
import aframe from 'aframe'

const groups = [
  [7, 6],
  [6, 5],
  [3, 2, 4],
  [1, 2, 3, 4, 5, 6, 7]
]

function buildSideOption (number = [], area = '1') {
  const ids = number.map(num => parseInt(`${area}${num}`, 10))
  const ranges = [ids[0], ids[0]]
  return {
    ranges,
    group: [ids]
  }
}

function getObjectId (toothId) {
  return id(getElementID('tooth', toothId, 'object'))
}

export default {
  dependencies: [],
  schema: {},
  init () {
    this.follow = aframe.utils.throttle(this.throttledFollow, 330, this)
    this.base = new Base({
      sceneEl: this.el,
      teeth: getTeethAll()
    })
  },
  toggleSplineObject (splineObjectEnabled) {
    const teeth = this.base.getReadyTeeth(getTeethIDs().all)
    const objectEls = teeth.map(({ id }) =>
      this.el.querySelector(getObjectId(id))
    )
    objectEls.forEach(el =>
      el.setAttribute('spline-object', { enabled: splineObjectEnabled })
    )
    teeth.forEach(({ el }) =>
      el.setAttribute('follow', { enabled: splineObjectEnabled })
    )
  },
  throttledFollow () {
    this.el.systems['spline-object-manage'].toggleSplineObject(false)
    const allGroup = []
    const allRanges = []
    groups.forEach(g => {
      ;[1, 2, 3, 4].forEach(area => {
        const { ranges, group } = buildSideOption(g, area)
        allGroup.push(group)
        allRanges.push(ranges)
      })
    })
    this.el.sceneEl.components.ortho.ortho.getFormater('neighborTeeth').format({
      ranges: allRanges,
      group: allGroup
    })
    this.el.systems['spline-object-manage'].toggleSplineObject(true)
  }
}
