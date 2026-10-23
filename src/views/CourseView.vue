<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import { curriculum, getLesson, getModule, type CourseModule, type Lesson } from '../data/curriculum'
import { useUserStore } from '../stores/useUserStore'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const moduleId = computed(() => typeof route.params.moduleId === 'string' ? route.params.moduleId : '')
const lessonId = computed(() => typeof route.params.lessonId === 'string' ? route.params.lessonId : '')
const courseModule = computed(() => getModule(moduleId.value))
const current = computed(() => getLesson(moduleId.value, lessonId.value))
const lessonKey = computed(() => current.value ? `${current.value.module.id}/${current.value.lesson.id}` : '')
const selectedOption = ref<number | null>(null)
const isAnswered = ref(false)
const quizXpEarned = ref(false)
const lessonNote = ref('')
const justCompleted = ref(false)

watch(lessonKey, (key) => {
  selectedOption.value = null
  isAnswered.value = false
  quizXpEarned.value = false
  justCompleted.value = false
  lessonNote.value = key ? userStore.getNote(key) : ''
}, { immediate: true })

function completedInModule(module: CourseModule) {
  return module.lessons.filter((item) => userStore.hasCompleted(`${module.id}/${item.id}`)).length
}

const modulePercent = computed(() => {
  if (!courseModule.value) return 0
  return Math.round(completedInModule(courseModule.value) / courseModule.value.lessons.length * 100)
})
const moduleContinueTarget = computed(() => {
  const module = courseModule.value
  if (!module) return ''
  const pending = module.lessons.find((item) => !userStore.hasCompleted(`${module.id}/${item.id}`))
  return pending?.id ?? module.lessons[0]?.id ?? ''
})
const isActivityChecked = computed(() => lessonKey.value ? userStore.hasCheckedActivity(lessonKey.value) : false)
const isLessonComplete = computed(() => lessonKey.value ? userStore.hasCompleted(lessonKey.value) : false)
const hasQuizAttempt = computed(() => lessonKey.value ? userStore.hasAttemptedQuiz(lessonKey.value) : false)
const hasPassedQuiz = computed(() => lessonKey.value ? userStore.progress.quizResults[lessonKey.value] === 100 : false)
const canComplete = computed(() => hasPassedQuiz.value && isActivityChecked.value)

const prevLesson = computed(() => {
  if (!current.value) return null
  if (current.value.index > 0) {
    const lesson = current.value.module.lessons[current.value.index - 1]
    return { moduleId: current.value.module.id, lesson, label: lesson.title }
  }
  const moduleIndex = curriculum.findIndex((item) => item.id === current.value?.module.id)
  if (moduleIndex <= 0) return null
  const module = curriculum[moduleIndex - 1]
  const lesson = module.lessons[module.lessons.length - 1]
  return { moduleId: module.id, lesson, label: `${module.shortTitle}: ${lesson.title}` }
})
const nextLesson = computed(() => {
  if (!current.value) return null
  if (current.value.index < current.value.module.lessons.length - 1) {
    const lesson = current.value.module.lessons[current.value.index + 1]
    return { moduleId: current.value.module.id, lesson, label: lesson.title }
  }
  const moduleIndex = curriculum.findIndex((item) => item.id === current.value?.module.id)
  if (moduleIndex < 0 || moduleIndex >= curriculum.length - 1) return null
  const module = curriculum[moduleIndex + 1]
  const lesson = module.lessons[0]
  return { moduleId: module.id, lesson, label: `${module.shortTitle}: ${lesson.title}` }
})

function answerQuestion() {
  if (!current.value || selectedOption.value === null || isAnswered.value) return
  isAnswered.value = true
  quizXpEarned.value = userStore.recordQuizAttempt(lessonKey.value, selectedOption.value === current.value.lesson.quiz.answer)
}

function retryQuestion() {
  selectedOption.value = null
  isAnswered.value = false
}

function markActivity() {
  if (!lessonKey.value) return
  userStore.markActivityDone(lessonKey.value)
}

function persistNote() {
  if (lessonKey.value) userStore.saveNote(lessonKey.value, lessonNote.value)
}

function completeCurrentLesson() {
  if (!canComplete.value || !lessonKey.value) return
  userStore.completeLesson(lessonKey.value)
  justCompleted.value = true
}

function openLesson(module: CourseModule, lesson: Lesson) {
  router.push(`/learn/${module.id}/${lesson.id}`)
}

function openNextLesson() {
  if (nextLesson.value) router.push(`/learn/${nextLesson.value.moduleId}/${nextLesson.value.lesson.id}`)
  else router.push('/')
}
</script>

<template>
  <div class="site-shell course-shell">
    <AppHeader />
    <main class="course-main">
      <div class="course-topline">
        <RouterLink to="/" class="back-link"><span aria-hidden="true">←</span> Mi recorrido</RouterLink>
        <span class="course-topline-label">HOWTOYOGA <span>·</span> CUADERNO DE FORMACIÓN</span>
      </div>

      <template v-if="courseModule && !lessonId">
        <section class="module-intro-panel">
          <div class="module-intro-copy">
            <p class="eyebrow"><span class="eyebrow-line"></span> MÓDULO {{ courseModule.number }} · {{ courseModule.category.toUpperCase() }}</p>
            <h1>{{ courseModule.title }}<span>.</span></h1>
            <p>{{ courseModule.summary }}</p>
            <div class="module-tags"><span>{{ courseModule.lessons.length }} lecciones</span><span>{{ courseModule.hours }} h orientativas</span><span>{{ courseModule.level }}</span></div>
          </div>
          <div class="module-intro-art" :class="`module-${courseModule.id}`" aria-hidden="true">
            <span class="intro-art-orbit"></span><span class="intro-art-icon">{{ courseModule.icon }}</span><span class="intro-art-number">{{ courseModule.number }}</span>
          </div>
        </section>

        <section class="module-outcomes-panel">
          <div><p class="eyebrow">AL TERMINAR ESTE MÓDULO</p><h2>Lo que vas a aprender</h2></div>
          <ul><li v-for="outcome in courseModule.outcomes" :key="outcome"><span>✓</span>{{ outcome }}</li></ul>
        </section>

        <section class="lesson-list-section">
          <div class="section-heading compact-heading"><div><p class="eyebrow">TU ITINERARIO</p><h2>Lecciones del módulo</h2></div><div class="module-list-progress"><strong>{{ completedInModule(courseModule) }}</strong> / {{ courseModule.lessons.length }} completadas</div></div>
          <div class="lesson-list">
            <button v-for="(item, index) in courseModule.lessons" :key="item.id" type="button" :class="['lesson-list-item', { 'lesson-is-complete': userStore.hasCompleted(`${courseModule.id}/${item.id}`) }]" @click="openLesson(courseModule, item)">
              <span class="lesson-list-number">{{ userStore.hasCompleted(`${courseModule.id}/${item.id}`) ? '✓' : String(index + 1).padStart(2, '0') }}</span>
              <span class="lesson-list-content"><span class="lesson-list-kicker">LECCIÓN {{ String(index + 1).padStart(2, '0') }} <span>·</span> {{ item.duration }} MIN</span><strong>{{ item.title }}</strong><small>{{ item.intro }}</small></span>
              <span class="lesson-list-arrow" aria-hidden="true">↗</span>
            </button>
          </div>
        </section>
        <div class="module-navigation"><RouterLink to="/" class="button button-secondary">← Volver al recorrido</RouterLink><RouterLink v-if="moduleContinueTarget" :to="`/learn/${courseModule.id}/${moduleContinueTarget}`" class="button button-primary">{{ modulePercent === 100 ? 'Repasar el módulo' : 'Comenzar / continuar' }} ↗</RouterLink></div>
      </template>

      <template v-else-if="current">
        <div class="lesson-layout">
          <aside class="lesson-sidebar">
            <div class="sidebar-module-label"><span class="sidebar-icon" :class="`module-${current.module.id}`">{{ current.module.icon }}</span><div><small>MÓDULO {{ current.module.number }}</small><strong>{{ current.module.shortTitle }}</strong></div></div>
            <div class="sidebar-progress-copy"><span>Progreso del módulo</span><strong>{{ modulePercent }}%</strong></div>
            <div class="module-track sidebar-track" role="progressbar" :aria-valuenow="modulePercent" aria-valuemin="0" aria-valuemax="100" :aria-label="`Progreso de ${current.module.title}`"><span :style="{ width: `${modulePercent}%` }"></span></div>
            <nav class="sidebar-lessons" :aria-label="`Lecciones de ${current.module.title}`">
              <RouterLink v-for="(item, index) in current.module.lessons" :key="item.id" :to="`/learn/${current.module.id}/${item.id}`" :class="['sidebar-lesson-link', { active: item.id === current.lesson.id, complete: userStore.hasCompleted(`${current.module.id}/${item.id}`) }]">
                <span>{{ userStore.hasCompleted(`${current.module.id}/${item.id}`) ? '✓' : String(index + 1).padStart(2, '0') }}</span><span>{{ item.title }}</span>
              </RouterLink>
            </nav>
            <RouterLink to="/" class="sidebar-return">← Volver al temario completo</RouterLink>
          </aside>

          <article class="lesson-article">
            <div class="lesson-breadcrumb"><RouterLink to="/">Formación</RouterLink><span>/</span><RouterLink :to="`/learn/${current.module.id}`">{{ current.module.shortTitle }}</RouterLink><span>/</span><span>Lección {{ String(current.index + 1).padStart(2, '0') }}</span></div>
            <header class="lesson-header">
              <div class="lesson-meta"><span class="lesson-number-chip">{{ current.module.number }}.{{ String(current.index + 1).padStart(2, '0') }}</span><span>{{ current.lesson.duration }} MIN DE LECTURA Y PRÁCTICA</span><span v-if="isLessonComplete" class="complete-inline">✓ COMPLETADA</span></div>
              <h1>{{ current.lesson.title }}<span>.</span></h1>
              <p class="lesson-lead">{{ current.lesson.intro }}</p>
              <div class="lesson-header-line"><span></span><small>IDEAS PARA COMPRENDER Y LLEVAR A LA ESTERILLA</small></div>
            </header>

            <section class="lesson-reading" aria-label="Contenido de la lección">
              <section v-for="(section, index) in current.lesson.sections" :key="section.heading" class="reading-section">
                <div class="reading-section-number">{{ String(index + 1).padStart(2, '0') }}</div>
                <div class="reading-section-body"><h2>{{ section.heading }}</h2><p>{{ section.body }}</p><ul class="concept-list"><li v-for="point in section.points" :key="point">{{ point }}</li></ul></div>
              </section>
            </section>

            <aside class="key-takeaways"><div class="takeaway-symbol" aria-hidden="true">✧</div><div><p class="eyebrow">QUÉ CONVIENE RECORDAR</p><h2>Ideas clave</h2><ul><li v-for="point in current.lesson.keyPoints" :key="point">{{ point }}</li></ul></div></aside>

            <section class="activity-panel" aria-labelledby="activity-title">
              <div class="activity-head"><span class="activity-icon" aria-hidden="true">✳</span><div><p class="eyebrow">APRENDER HACIENDO</p><h2 id="activity-title">{{ current.lesson.activity.title }}</h2><p>{{ current.lesson.activity.purpose }}</p></div></div>
              <ol class="activity-steps"><li v-for="step in current.lesson.activity.steps" :key="step">{{ step }}</li></ol>
              <div class="activity-deliverable"><span>EL RESULTADO</span><p>{{ current.lesson.activity.deliverable }}</p></div>
              <button type="button" :class="['activity-done-button', { checked: isActivityChecked }]" @click="markActivity"><span aria-hidden="true">{{ isActivityChecked ? '✓' : '○' }}</span>{{ isActivityChecked ? 'Actividad marcada como practicada' : 'He realizado la actividad' }}</button>
            </section>

            <section class="reflection-panel" aria-labelledby="reflection-title">
              <div class="reflection-heading"><span aria-hidden="true">✎</span><div><p class="eyebrow">TU CUADERNO PERSONAL</p><h2 id="reflection-title">Un momento para reflexionar</h2></div></div>
              <p>{{ current.lesson.reflection }}</p>
              <label class="sr-only" :for="`note-${current.lesson.id}`">Tus notas personales de esta lección</label>
              <textarea :id="`note-${current.lesson.id}`" v-model="lessonNote" class="reflection-textarea" rows="4" placeholder="Escribe tus ideas, dudas o cómo llevarías este aprendizaje a una clase real…" @input="persistNote"></textarea>
              <span class="autosave-hint"><span aria-hidden="true">✓</span> Tus notas se guardan automáticamente en este dispositivo.</span>
            </section>

            <section class="quiz-panel" aria-labelledby="quiz-title">
              <div class="quiz-heading"><span class="quiz-mark" aria-hidden="true">?</span><div><p class="eyebrow">COMPRUEBA LO APRENDIDO</p><h2 id="quiz-title">Una pregunta para integrar</h2><p>Responde, revisa la explicación y vuelve a intentarlo cuando lo necesites.</p></div></div>
              <p class="quiz-question">{{ current.lesson.quiz.question }}</p>
              <div class="quiz-options" role="group" aria-label="Opciones de respuesta">
                <button v-for="(option, index) in current.lesson.quiz.options" :key="option" type="button" :disabled="isAnswered" :class="['quiz-option', { selected: selectedOption === index && !isAnswered, correct: isAnswered && index === current.lesson.quiz.answer, incorrect: isAnswered && selectedOption === index && index !== current.lesson.quiz.answer }]" @click="selectedOption = index"><span class="option-letter">{{ String.fromCharCode(65 + index) }}</span><span>{{ option }}</span><span v-if="isAnswered && index === current.lesson.quiz.answer" class="option-check">✓</span></button>
              </div>
              <div v-if="isAnswered" :class="['quiz-feedback', { success: selectedOption === current.lesson.quiz.answer }]" role="status" aria-live="polite"><strong>{{ selectedOption === current.lesson.quiz.answer ? (quizXpEarned ? '¡Exacto! +5 XP' : '¡Correcto!') : 'Vamos a afinar esta idea.' }}</strong><p>{{ current.lesson.quiz.explanation }}</p></div>
              <button v-if="!isAnswered" type="button" class="button button-primary quiz-submit" :disabled="selectedOption === null" @click="answerQuestion">Comprobar respuesta <span aria-hidden="true">↗</span></button>
              <button v-else-if="selectedOption !== current.lesson.quiz.answer" type="button" class="button button-secondary quiz-submit" @click="retryQuestion">Volver a intentarlo ↻</button>
              <div v-else class="quiz-earned"><span>✓</span> Comprensión comprobada. Ya puedes seguir con la actividad y completar la lección.</div>
            </section>

            <section class="lesson-finish-panel" aria-label="Completar lección">
              <div><p class="eyebrow">CIERRA EL CICLO DE APRENDIZAJE</p><h2>{{ isLessonComplete ? 'Esta lección forma parte de tu recorrido.' : '¿Listo para dar este paso por integrado?' }}</h2><p>{{ isLessonComplete ? 'Puedes volver a tus notas, repetir el cuestionario o continuar con la siguiente lección.' : 'Marca la actividad como practicada y responde al cuestionario. No se trata de hacerlo perfecto, sino de participar de forma consciente.' }}</p></div>
              <div class="finish-actions">
                <button v-if="!isLessonComplete" type="button" class="button button-primary" :disabled="!canComplete" @click="completeCurrentLesson">Marcar lección completada <span aria-hidden="true">✓</span></button>
                <span v-else class="lesson-done-chip">✓ Lección completada · +20 XP</span>
                <p v-if="!canComplete && !isLessonComplete" class="finish-hint">{{ !hasQuizAttempt ? 'Responde a la pregunta para habilitar el cierre.' : !hasPassedQuiz ? 'Revisa la explicación y vuelve a intentarlo hasta acertar.' : 'Marca la actividad como practicada para cerrar la lección.' }}</p>
                <p v-if="justCompleted" class="finish-success" role="status">¡Buen trabajo! Has sumado 20 XP y tu progreso se ha guardado.</p>
                <button v-if="isLessonComplete || justCompleted" type="button" class="text-link next-action" @click="openNextLesson">{{ nextLesson ? `Siguiente: ${nextLesson.label}` : 'Volver a mi recorrido' }} <span aria-hidden="true">→</span></button>
              </div>
            </section>

            <nav class="lesson-pager" aria-label="Navegar entre lecciones">
              <RouterLink v-if="prevLesson" :to="`/learn/${prevLesson.moduleId}/${prevLesson.lesson.id}`" class="pager-link"><span>← ANTERIOR</span><strong>{{ prevLesson.label }}</strong></RouterLink>
              <span v-else></span>
              <RouterLink v-if="nextLesson" :to="`/learn/${nextLesson.moduleId}/${nextLesson.lesson.id}`" class="pager-link next"><span>SIGUIENTE →</span><strong>{{ nextLesson.label }}</strong></RouterLink>
              <RouterLink v-else to="/" class="pager-link next"><span>RECORRIDO COMPLETADO</span><strong>Volver al panel ↗</strong></RouterLink>
            </nav>
          </article>
        </div>
      </template>

      <section v-else class="not-found-panel">
        <span>↟</span><p class="eyebrow">NO HEMOS ENCONTRADO ESA LECCIÓN</p><h1>Volvamos al camino.</h1><p>Puede que el enlace haya cambiado. El temario completo sigue disponible desde tu recorrido.</p><RouterLink to="/" class="button button-primary">Volver al panel principal ↗</RouterLink>
      </section>

      <footer class="course-footer"><RouterLink to="/" class="footer-brand">HowToYoga<span>.</span></RouterLink><span>Aprende con curiosidad y criterio.</span><span>El progreso se guarda en este dispositivo.</span></footer>
    </main>
  </div>
</template>
