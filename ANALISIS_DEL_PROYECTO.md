# Revisión y mejoras de HowToYoga

## Evaluación inicial

El proyecto recibido era principalmente una demo de navegación. Gran parte del temario no contenía lecciones desarrolladas, la experiencia de aprendizaje era superficial y el progreso no estaba conectado con un itinerario formativo completo. También faltaban una forma fiable de conservar las notas, un registro de práctica y una explicación clara de qué significaban las horas propuestas.

## Qué se ha reconstruido

### Programa pedagógico

- **12 módulos y 60 lecciones** organizados de fundamentos a prácticum.
- Cada lección incorpora una introducción, explicación conceptual, aplicación docente específica, ideas clave, actividad paso a paso, evidencia de trabajo, pregunta de reflexión y cuestionario con explicación.
- La segunda sección de cada lección está redactada para su tema; no reutiliza el mismo párrafo pedagógico genérico.
- Temas de seguridad, consentimiento revocable, adaptaciones, inclusión, cultura, privacidad, límites profesionales, derivación y respuesta ante incidentes.
- Un proyecto final integrador para preparar, ensayar, evaluar y revisar una clase.
- Enlaces a fuentes de referencia en filosofía, historia del yoga, seguridad y orientación profesional.

### Seguimiento del estudiante

- Progreso por lección y módulo, notas personales y cuestionarios que se pueden volver a intentar sin penalización.
- Guardado automático local, sin depender de una cuenta.
- Bitácora editable para registrar estudio, práctica personal, observación y docencia supervisada, con fecha, duración, módulo opcional y nota de aprendizaje.
- Exportación y restauración de copia JSON, con comprobación del formato y confirmación antes de sustituir los datos actuales.
- La bitácora es autodeclarada: no demuestra asistencia, evaluación o acreditación.

### Diseño y publicación web

- Interfaz adaptable a móvil y escritorio, identidad visual coherente, estados vacíos, navegación entre lecciones, filtros, búsqueda y atajo de teclado `/`.
- Títulos de página por ruta, metadatos básicos, favicon SVG, regla de fallback para rutas SPA y reducción de animación cuando el sistema lo solicita.
- Sin fuentes externas o imágenes remotas obligatorias; el progreso y las notas se quedan en el navegador.

## Horas: criterio importante

Los módulos suman **200 horas de planificación global orientativa**. Sin embargo, las duraciones explícitas de las 60 lecciones digitales suman **866 minutos (14 h 26 min)**. Por eso la app no presenta esas 200 horas como 200 horas de contenido digital impartido: la dedicación global tendría que completarse con práctica personal, observación, estudio autónomo y formación supervisada que organice la escuela o el docente responsable. Registrar horas en la bitácora no las verifica ni las convierte en horas acreditables.

Completar el contenido no equivale a obtener una certificación de profesor de yoga, acreditar horas reglamentarias o reemplazar primeros auxilios, práctica supervisada, evaluación presencial o criterios de una entidad formadora.

## Comprobaciones ejecutadas

- `npm run typecheck` — **correcto**.
- `npm run validate:content` — **correcto**: 12 módulos, 60 lecciones, 200 horas globales orientativas y contenido aplicado específico en todas las lecciones.
- `npm run validate:store` — **correcto**: pruebas de humo para bitácora, actividad, cuestionario, XP, finalización, exportación/restauración y rechazo de copias inválidas.
- `npm run build` — **no se pudo completar en el entorno de revisión**. La carpeta `node_modules` que acompañaba al ZIP original contenía el binario nativo de Rolldown para macOS ARM y no el de Linux x64. El entorno tampoco pudo descargar las dependencias que faltaban. Esto impide confirmar aquí un artefacto de producción generado; no se debe interpretar como un error de tipado, ya que el chequeo TypeScript sí pasó. El paquete entregado excluye `node_modules`: en una máquina con red, instalar desde `package-lock.json` (`npm ci`) debe preparar las dependencias nativas correctas para esa plataforma antes de ejecutar la compilación.

## Límites que quedan para una plataforma de producción completa

- La aplicación es una web estática de un solo usuario por navegador. No incluye cuentas, base de datos, sincronización entre dispositivos, panel editorial ni administración de estudiantes.
- No se han integrado vídeos alojados, clases en directo, entrega de trabajos a un tutor, evaluación externa ni firma/certificado.
- Antes de comercializarla como formación formal, conviene revisar el programa y las fuentes con un profesorado cualificado, añadir bibliografía por unidad y validar las exigencias de la escuela, la jurisdicción y la entidad de acreditación correspondientes.
- La compilación de producción y una prueba visual en navegador deben realizarse tras la instalación limpia de dependencias; el entorno de revisión no permitió verificar esos dos pasos.

## Puesta en marcha

```bash
npm ci
npm run dev
```

Comprobaciones y compilación:

```bash
npm run typecheck
npm run validate:content
npm run validate:store
npm run build
npm run preview
```
