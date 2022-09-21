<template>
  <div class="drop" @dragover.prevent @drop.prevent="drop" />
  <button @click="selectDirectory">select directory</button>
</template>

<script setup>
import { onMounted, nextTick } from 'vue'

const MAX = 1000

async function selectDirectory () {
  await nextTick()
  loadDirectory(await window.showDirectoryPicker())
}

async function drop (e) {
  const items = e.dataTransfer.items
  const fileList = []
  for (const item of items) {
    const handle = await item.getAsFileSystemHandle()
    fileList.push(...(await loadDirectory(handle)))
  }

  console.log(await fileList[0].getFile())
}

async function loadDirectory (systemHandle, depth = 0) {
  if (depth > 5) return []
  if (systemHandle.kind === 'file') return [systemHandle]
  const iterator = systemHandle.values()
  const fileList = []
  for (let i = 0; i < MAX; i++) {
    const result = await iterator.next()
    if (result.done) break
    if (result.value.kind === 'file') {
      fileList.push(result.value)
    }
    if (result.value.kind === 'directory') {
      fileList.push(...(await loadDirectory(result.value, depth + 1)))
    }
  }
  return fileList
}
</script>

<style scoped>
.drop {
  width: 100%;
  height: 400px;
  background-color: rgba(0, 0, 0, 0.2);
}
</style>
