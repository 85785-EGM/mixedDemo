import App from '@/App.vue'
import router from '@/router'
import toolkits from '@/toolkits'
import { createApp } from 'vue'

createApp(App)
  .use(router)
  .use(toolkits)
  .mount('#app')
