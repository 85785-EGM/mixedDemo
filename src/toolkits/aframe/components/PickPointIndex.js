import { Vector3 } from 'three'

const _v = new Vector3()

export default {
  // multiple: true,
  schema: { type: 'string', default: '' },
  events: {
    click: function (event) {
      const intersect = event.detail.intersection

      const position = intersect.object.geometry
        .toNonIndexed()
        .getAttribute('position')
      const min = { index: 0, point: new Vector3(), number: Number.MAX_VALUE }
      for (let i = 0, count = position.count; i < count; i++) {
        _v.fromBufferAttribute(position, i)
        if (_v.distanceTo(intersect.point) < min.number) {
          min.point = _v.clone()
          min.index = i
          min.number = _v.distanceTo(intersect.point)
        }
      }

      this.el.emit(this.data ? this.data : 'pick', min, false)
    }
  }
}
