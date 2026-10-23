import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'howtoyoga-progress-v2'

export type TrainingLogCategory = 'app-study' | 'personal-practice' | 'observation' | 'assisted-teaching' | 'independent-study'

export interface TrainingLogEntry {
  id: string
  date: string
  category: TrainingLogCategory
  minutes: number
  moduleId: string
  note: string
}

const allowedLogCategories: TrainingLogCategory[] = ['app-study', 'personal-practice', 'observation', 'assisted-teaching', 'independent-study']

export interface LearnerProgress {
  xp: number
  streak: number
  lastStudyDate: string | null
  completedLessons: string[]
  activityChecks: string[]
  quizAttempts: string[]
  quizResults: Record<string, number>
  quizRewards: string[]
  lessonNotes: Record<string, string>
  trainingLog: TrainingLogEntry[]
}

function blankProgress(): LearnerProgress {
  return {
    xp: 0,
    streak: 0,
    lastStudyDate: null,
    completedLessons: [],
    activityChecks: [],
    quizAttempts: [],
    quizResults: {},
    quizRewards: [],
    lessonNotes: {},
    trainingLog: [],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0).slice(0, 1000))]
}

function normalizeProgress(value: unknown): LearnerProgress {
  const saved = isRecord(value) ? value : {}
  const defaults = blankProgress()
  const lastStudyDate = typeof saved.lastStudyDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(saved.lastStudyDate)
    ? saved.lastStudyDate
    : null
  const quizResults: Record<string, number> = {}
  if (isRecord(saved.quizResults)) {
    for (const [key, score] of Object.entries(saved.quizResults).slice(0, 1000)) {
      if (key && typeof score === 'number' && Number.isFinite(score)) quizResults[key] = Math.max(0, Math.min(100, Math.round(score)))
    }
  }
  const lessonNotes: Record<string, string> = {}
  let noteCharacters = 0
  if (isRecord(saved.lessonNotes)) {
    for (const [key, note] of Object.entries(saved.lessonNotes).slice(0, 500)) {
      if (!key || typeof note !== 'string') continue
      const remaining = 1_000_000 - noteCharacters
      if (remaining <= 0) break
      const safeNote = note.slice(0, Math.min(30_000, remaining))
      lessonNotes[key] = safeNote
      noteCharacters += safeNote.length
    }
  }

  const trainingLog: TrainingLogEntry[] = []
  if (Array.isArray(saved.trainingLog)) {
    const seenEntryIds = new Set<string>()
    for (const item of saved.trainingLog.slice(0, 2000)) {
      if (!isRecord(item)) continue
      if (typeof item.id !== 'string' || !item.id || seenEntryIds.has(item.id)) continue
      if (typeof item.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) continue
      if (typeof item.category !== 'string' || !allowedLogCategories.includes(item.category as TrainingLogCategory)) continue
      if (typeof item.minutes !== 'number' || !Number.isFinite(item.minutes) || item.minutes < 1) continue
      seenEntryIds.add(item.id)
      trainingLog.push({
        id: item.id.slice(0, 100),
        date: item.date,
        category: item.category as TrainingLogCategory,
        minutes: Math.min(1440, Math.round(item.minutes)),
        moduleId: typeof item.moduleId === 'string' ? item.moduleId.slice(0, 100) : '',
        note: typeof item.note === 'string' ? item.note.slice(0, 2000) : '',
      })
    }
  }

  return {
    ...defaults,
    xp: typeof saved.xp === 'number' && Number.isFinite(saved.xp) ? Math.max(0, Math.min(1_000_000_000, Math.floor(saved.xp))) : 0,
    streak: typeof saved.streak === 'number' && Number.isFinite(saved.streak) ? Math.max(0, Math.min(100_000, Math.floor(saved.streak))) : 0,
    lastStudyDate,
    completedLessons: stringList(saved.completedLessons),
    activityChecks: stringList(saved.activityChecks),
    quizAttempts: stringList(saved.quizAttempts),
    quizRewards: stringList(saved.quizRewards),
    quizResults,
    lessonNotes,
    trainingLog,
  }
}

function loadProgress(): LearnerProgress {
  if (typeof window === 'undefined') return blankProgress()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? normalizeProgress(JSON.parse(raw) as unknown) : blankProgress()
  } catch {
    return blankProgress()
  }
}

function localDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function daysBetween(previous: string, current: string): number {
  const [py, pm, pd] = previous.split('-').map(Number)
  const [cy, cm, cd] = current.split('-').map(Number)
  return Math.round((Date.UTC(cy, cm - 1, cd) - Date.UTC(py, pm - 1, pd)) / 86_400_000)
}

export const useUserStore = defineStore('user', () => {
  const progress = ref<LearnerProgress>(loadProgress())
  const totalCompleted = computed(() => progress.value.completedLessons.length)

  if (typeof window !== 'undefined') {
    watch(progress, (value) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
      } catch {
        // Private browsing or a full storage quota must not break the learning experience.
      }
    }, { deep: true })
  }

  function touchStudyDay() {
    const today = localDateKey()
    const previous = progress.value.lastStudyDate
    if (previous === today) return
    if (!previous) progress.value.streak = 1
    else {
      const gap = daysBetween(previous, today)
      progress.value.streak = gap === 1 ? progress.value.streak + 1 : 1
    }
    progress.value.lastStudyDate = today
  }

  function hasCompleted(lessonKey: string) {
    return progress.value.completedLessons.includes(lessonKey)
  }

  function hasCheckedActivity(lessonKey: string) {
    return progress.value.activityChecks.includes(lessonKey)
  }

  function hasAttemptedQuiz(lessonKey: string) {
    return progress.value.quizAttempts.includes(lessonKey)
  }

  function markActivityDone(lessonKey: string) {
    if (!progress.value.activityChecks.includes(lessonKey)) {
      progress.value.activityChecks.push(lessonKey)
      touchStudyDay()
    }
  }

  function recordQuizAttempt(lessonKey: string, isCorrect: boolean): boolean {
    if (!progress.value.quizAttempts.includes(lessonKey)) progress.value.quizAttempts.push(lessonKey)
    progress.value.quizResults[lessonKey] = isCorrect ? 100 : Math.max(0, progress.value.quizResults[lessonKey] ?? 0)
    let earnedReward = false
    if (isCorrect && !progress.value.quizRewards.includes(lessonKey)) {
      progress.value.quizRewards.push(lessonKey)
      progress.value.xp += 5
      earnedReward = true
    }
    touchStudyDay()
    return earnedReward
  }

  function completeLesson(lessonKey: string) {
    if (hasCompleted(lessonKey)) return false
    progress.value.completedLessons.push(lessonKey)
    progress.value.xp += 20
    touchStudyDay()
    return true
  }

  function saveNote(lessonKey: string, value: string) {
    progress.value.lessonNotes[lessonKey] = value
  }

  function getNote(lessonKey: string) {
    return progress.value.lessonNotes[lessonKey] ?? ''
  }

  function addTrainingLog(entry: Omit<TrainingLogEntry, 'id'>) {
    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `log-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const cleanEntry = normalizeProgress({ ...blankProgress(), trainingLog: [{ ...entry, id }] }).trainingLog[0]
    if (!cleanEntry) return false
    progress.value.trainingLog.unshift(cleanEntry)
    progress.value.trainingLog = progress.value.trainingLog.slice(0, 2000)
    touchStudyDay()
    return true
  }

  function deleteTrainingLog(entryId: string) {
    const initialLength = progress.value.trainingLog.length
    progress.value.trainingLog = progress.value.trainingLog.filter((entry) => entry.id !== entryId)
    return progress.value.trainingLog.length !== initialLength
  }

  function importProgress(backup: unknown): boolean {
    if (!isRecord(backup) || backup.application !== 'HowToYoga' || backup.schemaVersion !== 2 || !isRecord(backup.progress)) return false
    const imported = backup.progress
    if (typeof imported.xp !== 'number' || !Array.isArray(imported.completedLessons) || !Array.isArray(imported.activityChecks) || !Array.isArray(imported.quizAttempts) || !isRecord(imported.quizResults) || !isRecord(imported.lessonNotes)) return false
    progress.value = normalizeProgress(imported)
    return true
  }

  function resetProgress() {
    progress.value = blankProgress()
    if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem(STORAGE_KEY) } catch { /* ignore storage restrictions */ }
    }
  }

  return {
    progress,
    totalCompleted,
    hasCompleted,
    hasCheckedActivity,
    hasAttemptedQuiz,
    markActivityDone,
    recordQuizAttempt,
    completeLesson,
    saveNote,
    getNote,
    addTrainingLog,
    deleteTrainingLog,
    importProgress,
    resetProgress,
  }
})
