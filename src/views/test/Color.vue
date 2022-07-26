<template>
  <a-scene
    auto-background
    vr-mode-ui="enabled: false"
    axes-helper="visible: true"
  >
    <a-box
      id="asdf"
      radius="10"
      position="0 0 0"
      height="20"
      width="20"
      depth="20"
      material="color: #8cdcfe;flatShading:true;opacity:1;wireframe:false"
      visible="true"
      draw-color
    />
    <a-cam
      id="camera"
      camera="fov:20;near:1;far:5000"
      camera-controls
      clicker
    />
    <a-entity auto-light="intensity: 1;" />
  </a-scene>
</template>

<script setup></script>

<style scoped></style>
