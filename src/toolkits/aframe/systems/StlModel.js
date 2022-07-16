import { BufferGeometry, Vector3, STLLoader } from 'three'
export default {
  init () {
    this.loader = new STLLoader()
  },
  async load (address, onProgress = () => {}, config = { mirror: false }) {
    return new Promise((resolve, reject) => {
      const url = address
      this.loader.load(
        url,
        (geometry = new BufferGeometry()) => {
          const { mirror, center } = config ?? {}
          if (mirror) {
            const strMirror = mirror.toUpperCase()
            const positions = geometry.getAttribute('position')
            const normals = geometry.getAttribute('normal')
            const count = positions.count
            const a = new Vector3()
            const b = new Vector3()
            let reverseCount = 0
            for (const axis of ['X', 'Y', 'Z']) {
              if (strMirror.includes(axis)) {
                const getter = 'get' + axis
                const setter = 'set' + axis
                for (let i = 0; i < count; i++) {
                  positions[setter](i, -positions[getter](i))
                  normals[setter](i, -normals[getter](i))
                }
                reverseCount++
              }
            }
            if (reverseCount % 2 === 1) {
              // never reverse triangle order when twice(nor zero) reverse
              for (let i = 0; i < count; i += 3) {
                a.fromBufferAttribute(positions, i)
                b.fromBufferAttribute(positions, i + 1)
                positions.setXYZ(i + 0, ...b.toArray())
                positions.setXYZ(i + 1, ...a.toArray())
              }
            }
          }

          if (center) {
            geometry.computeBoundingSphere()
            const { center } = geometry.boundingSphere
            geometry.translate(-center.x, -center.y, -center.z)
            geometry.computeBoundingSphere()
          }
          resolve(geometry)
        },
        onProgress,
        reject
      )
    })
  }
}
