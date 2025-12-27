import { createRouter, createWebHistory } from 'vue-router'
import BaoGia from '../views/baogia.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/bao-gia',
    },
    {
      path: '/bao-gia',
      name: 'bao-gia',
      component: BaoGia,
    },
  ],
})

export default router
