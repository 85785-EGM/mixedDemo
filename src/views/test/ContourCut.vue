<template>
  <a-scene
    stats
    auto-background
    vr-mode-ui="enabled: false"
    axes-helper="visible: true"
  >
    <a-plane
      id="origin"
      color="#CCC"
      segments-width="5"
      segments-height="5"
      clickable
      width="20"
      height="20"
      wireframe="true"
      :subdivision="{ inputEl: '#origin', outputEl: '#cut-el' }"
    />
    <a-entity id="cut-el" position="0 3 0" />
    <a-cam
      id="camera"
      camera="fov:20;near:1;far:5000"
      camera-controls
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

const state = reactive({})
</script>

<style scoped>
.draw-line {
  position: fixed;
  width: 100%;
  height: 100%;
  padding: 0px;
  margin: 0px;
  z-index: 1;
}
.draw-line-button {
  position: fixed;
  z-index: 2;
  left: 20px;
  bottom: 20px;
  padding: 30px 40px;
}
</style>
