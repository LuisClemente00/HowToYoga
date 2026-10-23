import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import CourseView from '../views/CourseView.vue'
import NotFoundView from '../views/NotFoundView.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: (to, _from, savedPosition) => savedPosition ?? (to.hash ? { el: to.hash, behavior: 'smooth' } : { top: 0 }),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/learn/:moduleId/:lessonId?', name: 'learn', component: CourseView },
    { path: '/game/:moduleId', redirect: (to) => `/learn/${String(to.params.moduleId)}` },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
})
