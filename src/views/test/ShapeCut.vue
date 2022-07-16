<template>
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
      material="flatShading:true;side:double;"
    />
    <a-cam
      id="camera"
      camera="fov:20;near:1;far:300"
      camera-controls="offset:100 100 100;"
      clicker="targets:[clickable]"
    />
    <a-entity auto-light="intensity: 1;" /> </a-scene
></template>

<script setup></script>

<style scoped></style>
