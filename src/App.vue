<script setup lang="ts">
import { watchEffect } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import { getLesson, getModule } from './data/curriculum'

const route = useRoute()

watchEffect(() => {
  if (typeof document === 'undefined') return
  const moduleId = typeof route.params.moduleId === 'string' ? route.params.moduleId : undefined
  const lessonId = typeof route.params.lessonId === 'string' ? route.params.lessonId : undefined
  const lesson = getLesson(moduleId, lessonId)
  const courseModule = getModule(moduleId)
  document.title = lesson
    ? `${lesson.lesson.title} · HowToYoga`
    : courseModule
      ? `${courseModule.title} · HowToYoga`
      : 'HowToYoga — Formación para enseñar con criterio'
})
</script>

<template>
  <RouterView />
</template>
