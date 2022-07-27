<template>
  <a-scene
    stats
    auto-background
    vr-mode-ui="enabled: false"
    axes-helper="visible: true"
  >
    <a-sphere
      id="asdf"
      radius="10"
      height="30"
      width="30"
      material="color: #8cdcfe;opacity:0.1;wireframe:true"
      visible="true"
      :clipping="
        parse({
          planeEl: '#qwer'
        })
      "
    />
    <a-plane
      id="qwer"
      width="40"
      height="40"
      material="color: #12852c;opacity:0.3"
    />
    <a-cam
      id="camera"
      camera="fov:20;near:1;far:5000"
      camera-controls
      clicker
      :transform-controls="parse(translateControl)"
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
const translateControl = reactive({
  mode: 'translate',
  attach: '#qwer',
  enabled: true,
  visible: true
})
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
