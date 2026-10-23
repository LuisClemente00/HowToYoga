import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const source = await readFile(new URL('../src/stores/useUserStore.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const temporaryDirectory = new URL('../node_modules/.tmp/', import.meta.url)
const temporaryPath = join(new URL(temporaryDirectory).pathname, `howtoyoga-store-${process.pid}.mjs`)
await mkdir(new URL(temporaryDirectory), { recursive: true })
await writeFile(temporaryPath, compiled)

try {
  const { createPinia, setActivePinia } = await import('pinia')
  const { useUserStore } = await import(pathToFileURL(temporaryPath).href)
  setActivePinia(createPinia())
  const store = useUserStore()

  assert.equal(store.progress.trainingLog.length, 0, 'El registro debe empezar vacío')
  assert.equal(store.addTrainingLog({ date: '2026-10-23', category: 'personal-practice', minutes: 45, moduleId: 'asana', note: 'Ensayo de opciones para una clase.' }), true)
  assert.equal(store.progress.trainingLog.length, 1, 'Debe guardar una entrada')
  assert.equal(store.progress.trainingLog[0].minutes, 45)

  store.markActivityDone('philosophy/meaning-of-yoga')
  assert.equal(store.recordQuizAttempt('philosophy/meaning-of-yoga', true), true, 'La primera respuesta correcta debe otorgar XP')
  assert.equal(store.recordQuizAttempt('philosophy/meaning-of-yoga', true), false, 'No debe duplicar la recompensa')
  assert.equal(store.completeLesson('philosophy/meaning-of-yoga'), true)
  assert.equal(store.completeLesson('philosophy/meaning-of-yoga'), false, 'No debe duplicar la lección completada')

  const backup = { application: 'HowToYoga', schemaVersion: 2, progress: JSON.parse(JSON.stringify(store.progress)) }
  store.resetProgress()
  assert.equal(store.progress.xp, 0)
  assert.equal(store.importProgress(backup), true, 'Debe restaurar una copia de seguridad válida')
  assert.equal(store.progress.trainingLog.length, 1, 'La copia debe incluir la bitácora')
  assert.equal(store.progress.completedLessons.length, 1, 'La copia debe incluir el progreso')

  const beforeInvalidImport = JSON.stringify(store.progress)
  assert.equal(store.importProgress({ application: 'OtroApp', schemaVersion: 2, progress: {} }), false, 'Debe rechazar copias ajenas')
  assert.equal(JSON.stringify(store.progress), beforeInvalidImport, 'Una importación inválida no debe alterar el estado')
  assert.equal(store.deleteTrainingLog(store.progress.trainingLog[0].id), true)
  assert.equal(store.progress.trainingLog.length, 0)

  console.log('✓ Bitácora, actividad, cuestionario, XP, cierre de lección, copia de seguridad y restauración superan las pruebas de humo.')
} finally {
  await rm(temporaryPath, { force: true })
}
