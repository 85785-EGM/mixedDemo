import {
  BufferAttribute,
  BufferGeometry,
  Line,
  Line3,
  LineBasicMaterial,
  Matrix4,
  Mesh,
  Plane,
  PlaneHelper,
  Raycaster,
  Triangle,
  Vector2,
  Vector3
} from 'three'
import { INTERSECTED, NOT_INTERSECTED } from 'three-mesh-bvh'
import { triangulate } from '../../../utils/three/libtess'
import { Cutting } from '../../../utils/three/Cutting'

const _v = new Vector3()
const _r = new Raycaster()

export default {
  cutting ({
    object3D,
    output,
    plane = new Plane(),
    lines = [],
    reverse = false
  }) {
    const geometry = new BufferGeometry()
    output.setObject3D(
      'mesh',
      new Mesh(geometry, output.components.material.material)
    )
    const attr = object3D.geometry.toNonIndexed().getAttribute('position')

    const cutting = new Cutting(attr)
    cutting.setShape(lines, plane)

    geometry.setAttribute(
      'position',
      new BufferAttribute(
        new Float32Array([...cutting.cutoff().repair, ...cutting.cutoff().cut]),
        3
      )
    )
  },

  getPlaneAndLinesFromEvent (points = []) {
    const cameraPlane = new Plane(this.el.camera.position.clone().normalize())
    const lines = []
    const linePoints = points.flatMap(p => {
      _r.setFromCamera(
        new Vector2(
          (p.x / window.innerWidth) * 2 - 1,
          -(p.y / window.innerHeight) * 2 + 1
        ),
        this.el.camera
      )
      _r.ray.intersectPlane(cameraPlane, _v)

      return [_v.clone(), _v.clone()]
    })
    linePoints.push(linePoints.shift())

    for (let i = 0; i < linePoints.length; i += 2) {
      lines.push(new Line3(linePoints[i], linePoints[i + 1]))
    }
    return {
      plane: cameraPlane,
      lines
    }
  }
}
