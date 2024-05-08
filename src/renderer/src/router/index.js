import { createWebHistory, createWebHashHistory, createRouter } from 'vue-router'

import Login from '../views/Login.vue'
import Index from '../views/Index.vue'
import BNEdit from '../views/BNEdit.vue'
import SQLEdit from '../views/SQLEdit.vue'
import PageNotFound from '../views/PageNotFound.vue'

const routes = [
    {
        /* Dashboard */ path: '/',
        name: 'Index',
        component: Index
    },
    {
        /* Login */ path: '/login',
        name: 'Login',
        component: Login
    },
    {
        /* Meter Monitor */
        path: '/black_node_edit/:id',
        name: 'BNEdit',
        component: BNEdit
    },
    {
        /* SQL Edit */
        path: '/sql_edit',
        name: 'SQLEdit',
        component: SQLEdit
    },
    {
        path: '/:catchAll(.*)*',
        name: 'PageNotFound',
        component: PageNotFound
    }
]

const router = createRouter({
    // history: process.env.IS_ELECTRON ? createWebHashHistory() : createWebHistory(),
    history: createWebHashHistory(),
    routes
})

router.beforeEach(async (to, from) => {
    await new Promise((resolve) => setTimeout(resolve, 150))

    let auth = await window.mainprocess.isAuthenticated()

    if (!auth && to.name !== 'Login') {
        return { name: 'Login' }
    }
})

export default router
