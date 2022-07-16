import * as THREE from 'three'
import { computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh'
import { convertRaycastIntersect } from 'three-mesh-bvh/src/utils/GeometryRayIntersectUtilities'
const tmpInverseMatrix = new THREE.Matrix4()
const origMeshRaycastFunc = THREE.Mesh.prototype.raycast
const ray = new THREE.Ray()
function acceleratedRaycast (raycaster, intersects) {
  if (!this.geometry.boundsTree) {
    this.geometry.computeBoundsTree()
  }
  if (this.geometry.boundsTree) {
    if (raycaster.castSide === 'undefined') {
      if (this.material === undefined) return
    }
    const castSide = raycaster.castSide ?? this.material

    tmpInverseMatrix.copy(this.matrixWorld).invert()
    ray.copy(raycaster.ray).applyMatrix4(tmpInverseMatrix)

    const bvh = this.geometry.boundsTree
    if (raycaster.firstHitOnly === true) {
      const hit = convertRaycastIntersect(
        bvh.raycastFirst(ray, castSide),
        this,
        raycaster
      )
      if (hit) {
        intersects.push(hit)
      }
    } else {
      const hits = bvh.raycast(ray, castSide)
      for (let i = 0, l = hits.length; i < l; i++) {
        const hit = convertRaycastIntersect(hits[i], this, raycaster)
        if (hit) {
          intersects.push(hit)
        }
      }
    }
  } else {
    origMeshRaycastFunc.call(this, raycaster, intersects)
  }
}
export default {
  schema: {
    enabled: { type: 'boolean', default: true }
  },
  init () {
    if (!this.data.enabled) return
    THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree
    THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree
    THREE.Mesh.prototype.raycast = acceleratedRaycast
  }
}
