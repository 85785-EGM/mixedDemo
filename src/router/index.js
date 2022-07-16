import { createRouter, createWebHashHistory } from 'vue-router'
import Router from '@/views/Router.vue'
import MeshCut from '@/views/test/MeshCut.vue'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      name: 'test',
      path: '/test',
      component: Router,
      children: [
        {
          name: 'mesh-cut',
          path: 'meshcut',
          component: MeshCut
        }
      ]
    }
  ]
})
