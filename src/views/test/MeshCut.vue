<template>
  <div>
    <a-scene
      stats
      auto-background="mode:day"
      renderer="sortObjects:false"
      device-orientation-permission-ui="enabled: false"
      vr-mode-ui="enabled: false"
    >
      <a-sphere
        id="ball0"
        clickable
        position="10 0 0"
        radius="10"
        material="flatShading:true;vertexColors:none;side:double;transparent:true;opacity:1"
        :mesh-cut="
          parse({
            innerMesh: 'mesh',
            innerEl: '#ball0',

            outerMesh: 'mesh',
            outerEl: '#test',

            outputMesh: 'output',
            outputEl: '#test',

            contour: 'contour',
            contourVisible: true,

            enabled: true
          })
        "
        depth="4"
        height="10"
        width="10"
        @click="onClick"
      />
      <a-sphere
        id="test"
        radius="20"
        color="cyan"
        position="-5 0 0"
        depth="20"
        height="20"
        width="20"
      />
      <a-cam
        id="camera"
        camera="fov:20;near:1;far:300"
        camera-controls="offset:100 100 100;"
        clicker="targets:[clickable]"
        :transform-controls="parse(translateControl)"
      />
      <a-entity auto-light="intensity: 1;" />
    </a-scene>
  </div>
</template>

<script setup>
import * as aframe from 'aframe'
import { reactive, ref, toRef } from 'vue'

const parse = aframe.utils.styleParser.stringify
const utils = aframe.utils

const translateControl = reactive({
  mode: 'translate',
  attach: '#ball0',
  enabled: true,
  visible: true
})
</script>

<style scoped></style>
