import { createRouter, createWebHashHistory } from 'vue-router'
import test from './test'

export default createRouter({
  history: createWebHashHistory(),
  routes: [...test]
})
