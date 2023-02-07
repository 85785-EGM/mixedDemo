<template>
  <a-scene
    auto-background
    vr-mode-ui="enabled: false"
    axes-helper="visible: true"
  >
    <a-box
      id="box-map"
      width="20"
      height="20"
      depth="20"
      color="#e3e3e3"
      visible="false"
    ></a-box>

    <a-sphere id="sphere-map" radius="12"></a-sphere>

    <a-cam id="camera" camera="fov:45;near:1;far:500" camera-controls clicker />
    <a-entity auto-light="intensity: 1;" />
  </a-scene>
</template>

<script setup>
import { onMounted } from 'vue'
import { delay } from '@/utils/common'
import { TextureLoader, MeshStandardMaterial, BufferGeometry } from 'three'

onMounted(async () => {
  await delay(500)
  const $ = (...args) => document.querySelector(...args)
  const boxObject = $('#box-map').getObject3D('mesh')
  const sphereObject = $('#sphere-map').getObject3D('mesh')

  setMaps(sphereObject)
})

function setMaps ({
  geometry = new BufferGeometry(),
  material = new MeshStandardMaterial()
}) {
  const loader = new TextureLoader()
  const texture = loader.load('/public/map.jpg')
  console.log(material)
  material.map = texture
  material.needsUpdate = true
}
</script>

<style scoped></style>
