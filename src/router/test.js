import Router from '@/views/Router.vue'
import MeshCut from '@/views/test/MeshCut.vue'
import * as testHelper from './testHelper'

export default [
  {
    name: 'test',
    path: '/test',
    component: Router,
    children: [
      ...Object.entries(testHelper).map(([key, value]) => ({
        name: key
          .replace(/[A-Z]/g, '-$&')
          .replace(/^-/, '')
          .toLowerCase(),
        path: key.toLowerCase(),
        component: value
      }))
    ]
  }
]
