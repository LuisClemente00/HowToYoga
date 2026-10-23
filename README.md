# HowToYoga

HowToYoga es una aplicación educativa en español que acompaña a futuros profesores de yoga mediante un itinerario estructurado de teoría, actividades prácticas, reflexión y autoevaluación.

## Incluye

- **12 módulos y 60 lecciones con contenido aplicado por tema** sobre filosofía, historia, anatomía y biomecánica, asana, alineación y adaptaciones, pranayama, meditación, sánscrito, secuenciación, pedagogía, ética y seguridad, y prácticum.
- Cada lección incluye contenido explicativo, conceptos clave, una actividad aplicada con pasos, una evidencia de aprendizaje, una pregunta de reflexión y una pregunta de autoevaluación con explicación.
- Progreso real por lección y módulo, XP sin penalización por respuestas erróneas, racha de estudio, notas personales y bitácora para registrar estudio, práctica, observación y docencia supervisada.
- Guardado local en el navegador mediante `localStorage`, con opciones para descargar y restaurar una copia de respaldo en JSON; no hay cuentas ni sincronización automática entre dispositivos en esta versión.
- Diseño responsive, navegación accesible por teclado, foco visible, semántica, estados de carga vacíos y página de ruta no encontrada.
- Fuentes de referencia y aviso visible sobre seguridad y límites de la formación.

## Requisitos

- Node.js 20.19+ o 22.12+ (compatible con Vite 8).
- npm.

## Desarrollo local

```bash
npm ci
npm run dev
```

## Comprobación y compilación

```bash
npm run typecheck
npm run build
npm run preview
```

La compilación crea el sitio estático en `dist/`. Para alojar la SPA en un servidor, hay que configurar una regla de fallback que envíe las rutas que no sean archivos estáticos a `index.html`. Sin ello, las rutas de lecciones podrían funcionar navegando dentro de la app pero devolver 404 al recargar.

## Deploy

Vite genera una web estática. Configura el proveedor de hosting para ejecutar `npm run build` y publicar `dist/`. Si la aplicación se aloja en un subdirectorio, configura `base` en `vite.config.ts`. Configura también el fallback de rutas del proveedor (por ejemplo, rewrite a `/index.html`). No hay claves secretas ni servicios externos de autenticación configurados.

## Datos y privacidad

El progreso y las notas se guardan únicamente en el almacenamiento local del navegador utilizado. No se envían a un servidor, pero tampoco se respaldan automáticamente: borrar los datos del sitio o cambiar de dispositivo puede hacer que se pierdan. Las notas no deben utilizarse para registrar información sensible o clínica sobre estudiantes.

## Alcance educativo y certificación

La referencia de 200 horas es una planificación global orientativa, no 200 horas de contenido impartido dentro de la app. Las duraciones de las lecciones digitales suman aproximadamente 14 horas y 26 minutos; el tiempo restante deberá cubrirse con práctica, observación, estudio autónomo y formación supervisada conforme al programa real de la escuela. La bitácora es autodeclarada y no verifica asistencia. Completar HowToYoga no constituye una certificación profesional, no acredita por sí solo horas de formación reconocidas y no sustituye prácticas supervisadas, primeros auxilios, evaluación de competencias ni los requisitos de una escuela o entidad certificadora. Revisa los requisitos vigentes con la entidad correspondiente en tu jurisdicción.

El contenido es educativo general, no asesoramiento médico ni una herramienta de diagnóstico. Los profesores deben impartir únicamente técnicas para las que tengan preparación adecuada, adaptar las prácticas y derivar a profesionales cualificados cuando una consulta quede fuera de su competencia.

## Referencias iniciales

- [Yoga Alliance — RYS Credentials Standards](https://yogaalliance.org/Standards-for-RYS-Credentials)
- [NCCIH — Yoga: What You Need To Know](https://www.nccih.nih.gov/health/yoga-what-you-need-to-know)
- [Internet Encyclopedia of Philosophy — The Yoga Sutras of Patanjali](https://iep.utm.edu/yoga/)
- [St Andrews Encyclopaedia of Theology — Yoga](https://www.saet.ac.uk/Hinduism/Yoga)

Las referencias orientan el estudio; no suponen que la aplicación esté acreditada o respaldada por esas entidades.

## Validación del proyecto

```bash
npm run typecheck
npm run validate:content
npm run validate:store
npm run build
```

`validate:content` comprueba la estructura de los 12 módulos y 60 lecciones, las aplicaciones docentes específicas, las actividades, las evidencias, las reflexiones, las preguntas y la coherencia de la duración. `validate:store` ejecuta pruebas de humo sobre el progreso, la bitácora, las recompensas y las copias de seguridad.
