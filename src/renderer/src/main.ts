import { createApp } from 'vue'
import Home from './Home.vue'
import router from './router'
import "./assets/js/bootstrap.js"

createApp(Home).use(router).mount('#app')
