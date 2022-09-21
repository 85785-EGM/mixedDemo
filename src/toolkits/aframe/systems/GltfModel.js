import { BufferGeometry, Vector3, STLLoader } from 'three'
import { GLTFLoader } from 'super-three/examples/jsm/loaders/GLTFLoader.js'

export default {
  init () {
    this.loader = new GLTFLoader().setPath('')
  },
  async load (address, onProgress = () => {}) {
    return new Promise((resolve, reject) => {
      const url = address
      this.loader.load(url, function (scene) {
        resolve(scene)
      })
    })
  }
}
