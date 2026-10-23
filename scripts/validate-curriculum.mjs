import assert from 'node:assert/strict'
import { readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const source = await readFile(new URL('../src/data/curriculum.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const tempFile = join(tmpdir(), `howtoyoga-curriculum-${process.pid}.mjs`)
await writeFile(tempFile, compiled)

try {
  const { curriculum, courseStats } = await import(pathToFileURL(tempFile).href)
  assert.equal(courseStats.modules, 12, 'El plan debe contener 12 módulos')
  assert.equal(courseStats.lessons, 60, 'El plan debe contener 60 lecciones')
  assert.equal(courseStats.plannedHours, 200, 'La distribución orientativa debe sumar 200 horas')
  assert.equal(courseStats.lessonMinutes, 866, 'La suma de tiempos digitales debe ser coherente con las duraciones indicadas')

  const moduleIds = new Set()
  const lessonIds = new Set()
  const appliedContent = new Set()
  for (const module of curriculum) {
    assert.ok(!moduleIds.has(module.id), `ID de módulo duplicado: ${module.id}`)
    moduleIds.add(module.id)
    assert.ok(module.title && module.summary && module.outcomes.length >= 3, `Módulo incompleto: ${module.id}`)
    assert.ok(module.lessons.length >= 4, `Faltan lecciones en ${module.id}`)
    for (const lesson of module.lessons) {
      assert.ok(!lessonIds.has(lesson.id), `ID de lección duplicado: ${lesson.id}`)
      lessonIds.add(lesson.id)
      assert.ok(lesson.intro.length > 80, `Introducción demasiado breve: ${lesson.id}`)
      assert.ok(lesson.sections.length >= 2, `Faltan secciones: ${lesson.id}`)
      assert.ok(lesson.sections[1].body.length > 100, `La sección aplicada debe tener contenido desarrollado: ${lesson.id}`)
      assert.ok(lesson.sections[1].points.length >= 3, `La sección aplicada requiere tres criterios: ${lesson.id}`)
      assert.ok(!lesson.sections[1].body.includes('La aplicación propuesta'), `Se ha detectado una plantilla antigua repetida: ${lesson.id}`)
      appliedContent.add(lesson.sections[1].body)
      assert.ok(lesson.keyPoints.length >= 3, `Faltan ideas clave: ${lesson.id}`)
      assert.ok(lesson.activity.steps.length >= 3, `Actividad incompleta: ${lesson.id}`)
      assert.ok(lesson.activity.deliverable.length > 10, `Falta evidencia de actividad: ${lesson.id}`)
      assert.ok(lesson.reflection.length > 10, `Falta reflexión: ${lesson.id}`)
      assert.equal(lesson.quiz.options.length, 4, `El cuestionario debe tener cuatro opciones: ${lesson.id}`)
      assert.ok(lesson.quiz.answer >= 0 && lesson.quiz.answer < lesson.quiz.options.length, `Respuesta fuera de rango: ${lesson.id}`)
      assert.ok(lesson.quiz.explanation.length > 20, `Falta explicación de la respuesta: ${lesson.id}`)
    }
  }
  assert.equal(appliedContent.size, courseStats.lessons, 'Cada lección debe tener una aplicación docente propia')
  console.log(`✓ Contenido validado: ${courseStats.modules} módulos y ${courseStats.lessons} lecciones.`)
  console.log(`✓ ${courseStats.plannedHours} h de planificación global orientativa; las lecciones digitales suman ${courseStats.lessonMinutes} min.`)
  console.log('✓ Las 60 aplicaciones docentes son específicas; actividades, evidencias, reflexiones y cuestionarios superan la validación.')
} finally {
  await rm(tempFile, { force: true })
}
