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
      position="0 0 0"
      height="40"
      width="40"
      material="color: #8cdcfe;flatShading:true;opacity:0.2;wireframe:true"
      visible="true"
    />
    <a-entity
      id="qwer"
      material="color: #12852c;flatShading:true;opacity:0.8;wireframe:false"
    />
    <a-cam
      id="camera"
      camera="fov:20;near:1;far:5000"
      camera-controls
      clicker
    />
    <a-entity auto-light="intensity: 1;" />
  </a-scene>
  <h2 style="position:fixed;right:0px" v-if="state.drawing">
    正在绘制线条
  </h2>
  <button class="draw-line-button" @click="drawLine">绘制线条 开始/结束</button>
  <canvas id="line" v-if="state.drawing" class="draw-line" @click="addPoint" />
</template>

<script setup>
import { reactive } from 'vue'

const funcs = []

const state = reactive({
  drawing: false,
  drawPoints: [],
  lineOffset: 0
})

function drawLine () {
  state.drawing = !state.drawing
  if (state.drawing === false) {
    if (state.drawPoints.length < 3) {
      window.alert('最少要有两条线')
    } else {
      const option = document
        .querySelector('a-scene')
        .systems.cutting.getPlaneAndLinesFromEvent(state.drawPoints)

      const attr = document.querySelector('a-scene').systems.cutting.cutting({
        object3D: document.querySelector('#asdf').getObject3D('mesh'),
        output: document.querySelector('#qwer'),
        ...option
      })
    }
    state.drawPoints.length = 0
  }
}

function addPoint (e) {
  const pointer = {}
  pointer.x = e.clientX
  pointer.y = e.clientY
  state.drawPoints.push(pointer)

  const canvas = document.querySelector('#line')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

function draw () {
  const canvas = document.querySelector('#line')
  const ctx = canvas?.getContext('2d')
  if (!ctx) return
  if (!state.drawPoints.length) return
  // const ctx = new CanvasRenderingContext2D()
  state.lineOffset++
  ctx.strokeStyle = '#192a2d'
  ctx.lineWidth = 1

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.beginPath()
  ctx.setLineDash([])
  ctx.moveTo(state.drawPoints[0].x, state.drawPoints[0].y)
  state.drawPoints.slice(1).forEach(({ x, y }) => {
    ctx.lineTo(x, y)
  })
  ctx.moveTo(state.drawPoints.at(-1).x, state.drawPoints.at(-1).y)
  ctx.closePath()
  ctx.stroke()

  ctx.beginPath()
  ctx.lineDashOffset = -state.lineOffset % 22
  ctx.setLineDash([8, 14])
  ctx.moveTo(state.drawPoints.at(-1).x, state.drawPoints.at(-1).y)
  ctx.lineTo(state.drawPoints[0].x, state.drawPoints[0].y)
  ctx.moveTo(state.drawPoints[0].x, state.drawPoints[0].y)
  ctx.closePath()
  ctx.stroke()
}

setInterval(() => {
  draw()
}, 1000 / 60)
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
