<template>
  <a-scene
    stats
    auto-background
    vr-mode-ui="enabled: false"
    axes-helper="visible: true"
  >
    <a-entity
      id="origin"
      :stl-model="
        parse({
          src: '/maxillary (2).stl',
          visible: state.show
        })
      "
      :dijkstra="{
        inputEl: '#origin',
        start: state.start,
        end: state.end
      }"
      pick-point-index="pick"
      @pick="selectIndex"
    />
    <a-sphere></a-sphere>
    <a-entity id="cut-el" position="0 0 2" />
    <a-cam
      id="camera"
      camera="fov:20;near:1;far:5000"
      camera-controls
      clicker="targets:[pick-point-index]"
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
  start: null,
  end: null,
  show: true
})

function selectIndex ({ detail: { index } }) {
  if (state.start === null) state.start = index
  else if (state.end === null) state.end = index
  else {
    state.start = state.end
    state.end = index
  }
}
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
