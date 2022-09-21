<template>
  <a-scene stats auto-background vr-mode-ui="enabled: false" axes-helper>
    <a-entity gltf-model="src: public/fat-robot.glb" scale="80 80 80" />
    <a-cam
      id="camera"
      camera="fov:20;near:1;far:5000"
      camera-controls="offset: 40 400 40"
      clicker
    />
    <a-entity auto-light="intensity: 1;" />
  </a-scene>
</template>

<script setup>
import { reactive } from 'vue'
import * as aframe from 'aframe'

const parse = aframe.utils.styleParser.stringify
const utils = aframe.utils

const state = reactive({
  drawing: false,
  drawPoints: [],
  lineOffset: 0
})
</script>

<style scoped></style>
