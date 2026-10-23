<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import { courseStats, curriculum, references, type CourseModule } from '../data/curriculum'
import { useUserStore, type TrainingLogCategory } from '../stores/useUserStore'

const userStore = useUserStore()
const router = useRouter()
const search = ref('')
const exportNotice = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const backupInput = ref<HTMLInputElement | null>(null)
const trainingLogNotice = ref('')
const logDate = ref(localDateInput())
const logCategory = ref<TrainingLogCategory>('personal-practice')
const logMinutes = ref(45)
const logModuleId = ref('')
const logNote = ref('')
const logCategories: { id: TrainingLogCategory; label: string }[] = [
  { id: 'app-study', label: 'Estudio en la app' },
  { id: 'personal-practice', label: 'Práctica personal' },
  { id: 'observation', label: 'Observación de una clase' },
  { id: 'assisted-teaching', label: 'Docencia asistida o supervisada' },
  { id: 'independent-study', label: 'Estudio autónomo' },
]
const filters = [
  { id: 'all', label: 'Todos' },
  { id: 'in-progress', label: 'En curso' },
  { id: 'not-started', label: 'Por empezar' },
  { id: 'completed', label: 'Completados' },
] as const
type ModuleFilter = typeof filters[number]['id']
const filter = ref<ModuleFilter>('all')

function lessonKey(moduleId: string, lessonId: string) {
  return `${moduleId}/${lessonId}`
}

function completedInModule(module: CourseModule) {
  return module.lessons.filter((item) => userStore.hasCompleted(lessonKey(module.id, item.id))).length
}

function moduleProgress(module: CourseModule) {
  return Math.round((completedInModule(module) / module.lessons.length) * 100)
}

const completedCount = computed(() => Math.min(courseStats.lessons, userStore.totalCompleted))
const overallPercent = computed(() => Math.round((completedCount.value / courseStats.lessons) * 100))
const loggedMinutes = computed(() => userStore.progress.trainingLog.reduce((total, entry) => total + entry.minutes, 0))
const loggedHours = computed(() => loggedMinutes.value / 60)
const loggedHoursLabel = computed(() => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(loggedHours.value))
const loggedHoursPercent = computed(() => Math.min(100, Math.round(loggedMinutes.value / (courseStats.plannedHours * 60) * 100)))
const recentTrainingLogs = computed(() => userStore.progress.trainingLog.slice(0, 5))

function localDateInput(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatLogDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(year, month - 1, day))
}

function categoryLabel(value: TrainingLogCategory) {
  return logCategories.find((category) => category.id === value)?.label ?? 'Trabajo formativo'
}

function addTrainingLog() {
  if (!logDate.value || !Number.isFinite(logMinutes.value) || logMinutes.value < 5 || logMinutes.value > 600) {
    trainingLogNotice.value = 'Indica una fecha y una duración entre 5 y 600 minutos.'
    return
  }
  const added = userStore.addTrainingLog({
    date: logDate.value,
    category: logCategory.value,
    minutes: Math.round(logMinutes.value),
    moduleId: logModuleId.value,
    note: logNote.value.trim().slice(0, 2000),
  })
  if (!added) {
    trainingLogNotice.value = 'No se ha podido guardar esta entrada. Revisa los datos e inténtalo de nuevo.'
    return
  }
  trainingLogNotice.value = 'Entrada añadida a tu bitácora privada en este dispositivo.'
  logMinutes.value = 45
  logNote.value = ''
}

function removeTrainingLog(entryId: string) {
  if (!window.confirm('¿Eliminar esta entrada de la bitácora?')) return
  userStore.deleteTrainingLog(entryId)
  trainingLogNotice.value = 'Entrada eliminada.'
}
const inProgressCount = computed(() => curriculum.filter((item) => {
  const n = completedInModule(item)
  return n > 0 && n < item.lessons.length
}).length)
const nextLesson = computed(() => {
  for (const module of curriculum) {
    const lesson = module.lessons.find((item) => !userStore.hasCompleted(lessonKey(module.id, item.id)))
    if (lesson) return { module, lesson }
  }
  return null
})

const filteredModules = computed(() => {
  const normalized = search.value.trim().toLocaleLowerCase('es')
  return curriculum.filter((module) => {
    const matchesSearch = !normalized || `${module.title} ${module.summary} ${module.category} ${module.outcomes.join(' ')}`.toLocaleLowerCase('es').includes(normalized)
    const count = completedInModule(module)
    const matchesFilter = filter.value === 'all'
      || (filter.value === 'completed' && count === module.lessons.length)
      || (filter.value === 'not-started' && count === 0)
      || (filter.value === 'in-progress' && count > 0 && count < module.lessons.length)
    return matchesSearch && matchesFilter
  })
})

function handleSearchShortcut(event: KeyboardEvent) {
  if (event.key !== '/') return
  const target = event.target
  if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return
  event.preventDefault()
  searchInput.value?.focus()
}

onMounted(() => window.addEventListener('keydown', handleSearchShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', handleSearchShortcut))

function exportProgress() {
  const backup = {
    application: 'HowToYoga',
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    progress: userStore.progress,
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `howtoyoga-progreso-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  exportNotice.value = 'Copia descargada. Guárdala en un lugar privado para conservar tus notas.'
}

function chooseBackup() {
  backupInput.value?.click()
}

async function importProgressFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 2_000_000) {
    exportNotice.value = 'El archivo supera el límite de 2 MB y no se ha importado.'
    input.value = ''
    return
  }
  if (!window.confirm('Restaurar una copia sustituirá el progreso y las notas que tienes ahora en este navegador. ¿Quieres continuar?')) {
    input.value = ''
    return
  }
  try {
    const backup: unknown = JSON.parse(await file.text())
    const restored = userStore.importProgress(backup)
    exportNotice.value = restored
      ? 'Copia restaurada. Se ha recuperado el progreso y las notas del archivo.'
      : 'Este archivo no parece una copia válida de HowToYoga. Tu progreso actual no se ha cambiado.'
  } catch {
    exportNotice.value = 'No se pudo leer el archivo. Elige una copia JSON válida de HowToYoga.'
  } finally {
    input.value = ''
  }
}

function setFilter(value: string) {
  if (filters.some((item) => item.id === value)) filter.value = value as ModuleFilter
}

function openModule(module: CourseModule) {
  router.push(`/learn/${module.id}`)
}
</script>

<template>
  <div class="site-shell">
    <AppHeader />

    <main class="dashboard-main">
      <section class="welcome-grid" aria-labelledby="welcome-title">
        <div class="welcome-copy">
          <p class="eyebrow"><span class="eyebrow-line"></span> TU FORMACIÓN, PASO A PASO</p>
          <h1 id="welcome-title">Enseñar yoga empieza<br /><em>por seguir aprendiendo.</em></h1>
          <p class="welcome-description">Un recorrido profundo por la práctica, la anatomía, la filosofía y el arte de acompañar a otras personas. Aprende a tu ritmo, practica con intención y construye tu propio criterio docente.</p>
          <div class="welcome-actions">
            <RouterLink v-if="nextLesson" :to="`/learn/${nextLesson.module.id}/${nextLesson.lesson.id}`" class="button button-primary">
              {{ completedCount === 0 ? 'Comenzar mi recorrido' : 'Continuar aprendiendo' }} <span aria-hidden="true">↗</span>
            </RouterLink>
            <RouterLink v-else to="/learn/practicum/final-capstone" class="button button-primary">Revisar proyecto final <span aria-hidden="true">↗</span></RouterLink>
            <a href="#curriculum" class="text-link">Explorar el temario <span aria-hidden="true">↓</span></a>
          </div>
          <div class="welcome-note"><span class="note-dot"></span> Sin prisas. Con práctica, curiosidad y criterio.</div>
        </div>

        <div class="welcome-art" aria-label="Ilustración botánica minimalista inspirada en el yoga" role="img">
          <div class="art-sun"></div>
          <div class="art-orbit orbit-one"></div>
          <div class="art-orbit orbit-two"></div>
          <svg class="art-plant" viewBox="0 0 320 360" fill="none" aria-hidden="true">
            <path d="M161 324C170 271 159 224 163 171C166 125 187 81 224 44" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <path d="M164 230C113 212 88 181 89 143C125 151 155 180 164 230Z" fill="#A6B68C" fill-opacity=".75" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2" />
            <path d="M166 185C203 180 232 154 238 119C205 123 180 147 166 185Z" fill="#6F8D69" fill-opacity=".78" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2" />
            <path d="M165 150C131 117 126 82 145 53C168 81 176 115 165 150Z" fill="#C8AE76" fill-opacity=".85" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2" />
            <path d="M160 280C118 265 94 239 95 208C127 215 151 240 160 280Z" fill="#789270" fill-opacity=".7" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2" />
            <path d="M168 110C200 101 217 81 218 55C190 63 173 81 168 110Z" fill="#A6B68C" fill-opacity=".8" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2" />
            <path d="M161 324C139 328 117 327 96 318M161 324C181 329 203 326 222 315" stroke="currentColor" stroke-opacity=".45" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          <span class="art-caption">SĀDHANA <span>·</span> PRÁCTICA CONSCIENTE</span>
          <span class="art-number">01 — 12</span>
        </div>
      </section>

      <section class="progress-overview" aria-label="Resumen de progreso">
        <div class="overview-intro">
          <span class="overview-label">TU RECORRIDO</span>
          <div class="overall-number">{{ overallPercent }}<span>%</span></div>
          <p>del itinerario completado</p>
          <div class="overall-track" role="progressbar" :aria-valuenow="overallPercent" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso total">
            <span :style="{ width: `${overallPercent}%` }"></span>
          </div>
        </div>
        <div class="overview-stat">
          <span class="stat-icon">◌</span>
          <strong>{{ completedCount }}<small> / {{ courseStats.lessons }}</small></strong>
          <span>lecciones completadas</span>
        </div>
        <div class="overview-stat">
          <span class="stat-icon">⌂</span>
          <strong>{{ inProgressCount }}<small> / {{ courseStats.modules }}</small></strong>
          <span>módulos en marcha</span>
        </div>
        <div class="overview-stat">
          <span class="stat-icon">✧</span>
          <strong>{{ courseStats.modules }}</strong>
          <span>áreas de aprendizaje</span>
        </div>
      </section>
      <div class="progress-backup-row">
        <span>Tu progreso y tus notas se guardan en este navegador.</span>
        <button type="button" class="backup-button" @click="exportProgress">Descargar copia ↗</button>
        <button type="button" class="backup-button backup-restore-button" @click="chooseBackup">Restaurar copia ↑</button>
        <input ref="backupInput" class="sr-only" type="file" accept=".json,application/json" aria-label="Seleccionar una copia de seguridad de HowToYoga" @change="importProgressFile" />
        <span v-if="exportNotice" class="backup-status" role="status">{{ exportNotice }}</span>
      </div>

      <section class="training-log-section" aria-labelledby="training-log-title">
        <div class="training-log-heading">
          <div>
            <p class="eyebrow"><span class="eyebrow-line"></span> TU PRÁCTICA TAMBIÉN CUENTA</p>
            <h2 id="training-log-title">Bitácora de <em>formación.</em></h2>
            <p>Registra el estudio, la práctica personal, las observaciones y las sesiones supervisadas que forman parte de tu recorrido. Así tendrás un registro reflexivo del trabajo realizado más allá de la pantalla.</p>
          </div>
          <div class="logged-hours-card"><strong>{{ loggedHoursLabel }}</strong><span>horas registradas</span><div class="logged-hours-track" role="progressbar" :aria-valuenow="loggedHoursPercent" aria-valuemin="0" aria-valuemax="100" aria-label="Avance respecto a la referencia orientativa de 200 horas"><span :style="{ width: `${loggedHoursPercent}%` }"></span></div><small>{{ loggedHoursPercent }}% de la referencia orientativa de 200 h</small></div>
        </div>
        <form class="training-log-form" @submit.prevent="addTrainingLog">
          <label><span>Fecha</span><input v-model="logDate" type="date" :max="localDateInput()" required /></label>
          <label><span>Tipo de actividad</span><select v-model="logCategory" required><option v-for="category in logCategories" :key="category.id" :value="category.id">{{ category.label }}</option></select></label>
          <label><span>Duración (minutos)</span><input v-model.number="logMinutes" type="number" min="5" max="600" step="5" required /></label>
          <label><span>Módulo relacionado (opcional)</span><select v-model="logModuleId"><option value="">Trabajo general</option><option v-for="module in curriculum" :key="module.id" :value="module.id">{{ module.number }} · {{ module.shortTitle }}</option></select></label>
          <label class="training-log-note"><span>Nota de aprendizaje (opcional)</span><input v-model="logNote" type="text" maxlength="2000" placeholder="¿Qué practicaste, observaste o quieres revisar?" /></label>
          <button type="submit" class="button button-primary">Añadir a la bitácora <span aria-hidden="true">↗</span></button>
          <p v-if="trainingLogNotice" class="training-log-notice" role="status">{{ trainingLogNotice }}</p>
        </form>
        <div v-if="recentTrainingLogs.length" class="training-log-entries">
          <div class="training-log-entries-heading"><h3>Actividad reciente</h3><span>{{ userStore.progress.trainingLog.length }} {{ userStore.progress.trainingLog.length === 1 ? 'entrada' : 'entradas' }}</span></div>
          <ul>
            <li v-for="entry in recentTrainingLogs" :key="entry.id">
              <div class="training-log-entry-date"><strong>{{ formatLogDate(entry.date) }}</strong><span>{{ categoryLabel(entry.category) }}</span></div>
              <div class="training-log-entry-details"><span>{{ entry.moduleId ? curriculum.find((module) => module.id === entry.moduleId)?.shortTitle ?? 'Trabajo general' : 'Trabajo general' }}</span><p v-if="entry.note">{{ entry.note }}</p></div>
              <strong class="training-log-entry-duration">{{ entry.minutes }} min</strong>
              <button type="button" class="training-log-delete" :aria-label="`Eliminar entrada del ${formatLogDate(entry.date)}`" @click="removeTrainingLog(entry.id)">Eliminar</button>
            </li>
          </ul>
        </div>
        <p v-else class="training-log-empty">Tu primera entrada puede ser una sesión de práctica, la observación de otra persona enseñando o el estudio de un tema que quieras integrar.</p>
        <p class="training-log-disclaimer">Este registro es personal y autodeclarado: no verifica asistencia ni acredita horas. Las 200 horas son una referencia de planificación que puede incluir estudio, práctica y supervisión fuera de la app; consulta siempre los requisitos de tu escuela o entidad formadora.</p>
      </section>

      <section id="curriculum" class="curriculum-section" aria-labelledby="curriculum-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow"><span class="eyebrow-line"></span> EL MAPA COMPLETO</p>
            <h2 id="curriculum-title">Tu formación, <em>en profundidad.</em></h2>
            <p class="section-description">12 módulos, 60 lecciones y actividades para llevar las ideas a la práctica. La duración estimada de las lecciones digitales suma {{ Math.floor(courseStats.lessonMinutes / 60) }} h {{ String(courseStats.lessonMinutes % 60).padStart(2, '0') }} min; la planificación orientativa de 200 h incluye práctica, observación y trabajo supervisado que se realizan fuera de la app. Avanza en orden o vuelve a cualquier tema cuando lo necesites.</p>
          </div>
          <div class="curriculum-total"><strong>{{ courseStats.lessons }}</strong><span>lecciones diseñadas</span></div>
        </div>

        <div class="catalog-controls">
          <label class="search-field">
            <span aria-hidden="true">⌕</span>
            <span class="sr-only">Buscar en el temario</span>
            <input ref="searchInput" v-model="search" type="search" placeholder="Buscar temas, conceptos o habilidades…" />
            <kbd>/</kbd>
          </label>
          <div class="filter-tabs" role="group" aria-label="Filtrar módulos">
            <button v-for="item in filters" :key="item.id" type="button" :class="['filter-tab', { active: filter === item.id }]" @click="setFilter(item.id)">{{ item.label }}</button>
          </div>
        </div>

        <div v-if="filteredModules.length" class="module-grid">
          <button v-for="module in filteredModules" :key="module.id" type="button" class="module-card" @click="openModule(module)">
            <div class="module-card-top">
              <span class="module-number">{{ module.number }}</span>
              <span class="module-icon" :class="`module-${module.id}`" aria-hidden="true">{{ module.icon }}</span>
              <span v-if="moduleProgress(module) === 100" class="completed-badge">✓ Completado</span>
              <span v-else-if="moduleProgress(module) > 0" class="module-percent">{{ moduleProgress(module) }}%</span>
              <span v-else class="module-duration">{{ module.hours }} h sugeridas</span>
            </div>
            <span class="module-category">{{ module.category }} <span aria-hidden="true">·</span> {{ module.level }}</span>
            <h3>{{ module.title }}</h3>
            <p class="module-summary">{{ module.summary }}</p>
            <div class="module-card-bottom">
              <div class="module-progress-copy"><span>{{ completedInModule(module) }} de {{ module.lessons.length }} lecciones</span><span>{{ moduleProgress(module) }}%</span></div>
              <div class="module-track" role="progressbar" :aria-valuenow="moduleProgress(module)" aria-valuemin="0" aria-valuemax="100" :aria-label="`Progreso de ${module.title}`"><span :style="{ width: `${moduleProgress(module)}%` }"></span></div>
              <span class="module-open">{{ moduleProgress(module) === 100 ? 'Repasar módulo' : 'Abrir módulo' }} <span aria-hidden="true">↗</span></span>
            </div>
          </button>
        </div>
        <div v-else class="empty-state">
          <span aria-hidden="true">⌕</span>
          <h3>No encontramos ese tema</h3>
          <p>Prueba con otra palabra o cambia el filtro seleccionado.</p>
          <button class="button button-secondary" type="button" @click="search = ''; filter = 'all'">Mostrar todo el temario</button>
        </div>
      </section>

      <section class="study-principles" aria-labelledby="principles-title">
        <div class="principles-title-block">
          <span class="principle-symbol" aria-hidden="true">✧</span>
          <p class="eyebrow">CÓMO APRENDER AQUÍ</p>
          <h2 id="principles-title">No se trata de memorizar.<br /><em>Se trata de integrar.</em></h2>
        </div>
        <div class="principle-item"><span>01</span><div><h3>Comprende</h3><p>Estudia los conceptos en contexto, con ideas clave y lenguaje aplicable a tu práctica.</p></div></div>
        <div class="principle-item"><span>02</span><div><h3>Experimenta</h3><p>Realiza una actividad, diseña una propuesta o ensaya cómo lo explicarías a un grupo.</p></div></div>
        <div class="principle-item"><span>03</span><div><h3>Reflexiona</h3><p>Responde al cuestionario, guarda tus notas y registra qué quieres seguir explorando.</p></div></div>
      </section>

      <aside class="professional-note" aria-labelledby="note-title">
        <span class="note-icon" aria-hidden="true">i</span>
        <div><h2 id="note-title">Una nota importante sobre esta formación</h2><p>HowToYoga es una herramienta educativa de apoyo. Las 200 horas son una planificación global orientativa, no 200 horas de contenido impartido por la app. El tiempo digital estimado de las lecciones suma {{ Math.floor(courseStats.lessonMinutes / 60) }} h y {{ courseStats.lessonMinutes % 60 }} min; el resto de la dedicación deberá cubrirse con práctica, observación, estudio autónomo y formación supervisada según el programa de tu escuela. Completar la app no constituye una certificación de profesor, no acredita horas reglamentarias ni sustituye clases prácticas supervisadas, primeros auxilios, valoración profesional o los requisitos de la escuela y la jurisdicción donde estudies o enseñes.</p></div>
      </aside>

      <footer class="site-footer">
        <RouterLink to="/" class="footer-brand">HowToYoga<span>.</span></RouterLink>
        <p>Una práctica de aprendizaje continuo.</p>
        <details class="references-details">
          <summary>Fuentes y lecturas de referencia</summary>
          <ul><li v-for="reference in references" :key="reference.url"><a :href="reference.url" target="_blank" rel="noopener noreferrer">{{ reference.title }} ↗</a><span>{{ reference.note }}</span></li></ul>
        </details>
        <span class="footer-copy">© {{ new Date().getFullYear() }} HowToYoga · Aprende con curiosidad y criterio.</span>
      </footer>
    </main>
  </div>
</template>
