import { createRouter, createWebHashHistory } from 'vue-router'
import Cutting from '@/views/test/Cutting.vue'
import test from './test'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    ...test,
    {
      name: 'home',
      path: '/',
      component: Cutting
    }
  ]
})
