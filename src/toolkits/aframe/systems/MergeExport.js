import { round } from '@/utils/common'
import { BufferGeometry, BufferGeometryUtils } from 'three'

function getGeometry (mesh) {
  if (!mesh) return
  const inputGeometry = mesh?.geometry
  if (!inputGeometry) return
  const geometry = new BufferGeometry()
  if (inputGeometry.getIndex()) {
    const positions = inputGeometry.toNonIndexed().getAttribute('position')
    geometry.setAttribute('position', positions.clone())
  } else {
    const positions = inputGeometry.getAttribute('position')
    geometry.setAttribute('position', positions.clone())
  }
  geometry.applyMatrix4(mesh.matrixWorld)
  return geometry
}
export default {
  schema: {
    select: { type: 'string', default: '[bracket-model]' },
    meshes: { type: 'array', default: ['mesh'] },
    name: { type: 'string', default: 'brackets.stl' },
    round: { type: 'boolean', default: false },
    digit: { type: 'int', default: 4 }
  },
  update () {},
  async save () {
    if (this.data.select === '') return
    const targetEls = [...this.el.querySelectorAll(this.data.select)]
    const meshes = targetEls
      .map(el => this.data.meshes.map(key => el.getObject3D(key)))
      .flat()
      .filter(
        mesh =>
          !!mesh && mesh.geometry && mesh.geometry.getAttribute('position')
      )
    const geometries = meshes
      .map(mesh => getGeometry(mesh))
      .filter(geometry => !!geometry)

    if (geometries.length === 0) return
    const outputGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries)
    for (const geometry of geometries) {
      geometry.dispose()
    }
    const positions = outputGeometry.getAttribute('position')
    const count = outputGeometry.count
    if (this.data.round) {
      const digit = this.data.digit
      for (let i = 0; i < count; i++) {
        const x = positions.getX(i)
        const y = positions.getY(i)
        const z = positions.getZ(i)
        positions.setXYZ(i, round(x, digit), round(y, digit), round(z, digit))
      }
    }
    await this.el.systems['stl-export'].export(outputGeometry, this.data.name)
    outputGeometry.dispose()
  }
}
