# Registro de decisiones

Qué se decidió en el proyecto, quién lo decidió y por qué. Sirve para no volver a discutir lo ya resuelto y para que cualquiera que se sume entienda cómo se llegó hasta acá.

**Cómo se usa**
- Cada decisión nueva va al final, con el número siguiente. No se borran entradas: si algo cambia, se agrega una entrada nueva que dice a cuál reemplaza y la vieja se marca como **Reemplazada**.
- **Quién:** *Gastón* cuando la decisión fue suya; *Claude (aprobada)* cuando Claude la propuso y Gastón siguió adelante con ella.
- **Estado:** Vigente · Reemplazada · Pendiente (decidido pero sin hacer).

## Índice

| # | Fecha | Decisión | Estado |
|---|---|---|---|
| [D-001](#d-001) | 2026-10-27 | Proyecto CBC Preptest con carpetas `input`, `rules` y `output` | Vigente |
| [D-002](#d-002) | 2026-10-27 | `input` junta los exámenes de UBA XXI por carrera y materia; se empieza por Abogacía | Vigente |
| [D-003](#d-003) | 2026-10-27 | No se esquiva el bloqueo de Altillo y Arrimo: Gastón baja los PDF y un script los ordena | Vigente |
| [D-004](#d-004) | 2026-10-27 | El script de descargas copia, no mueve, y solo toca exámenes | Vigente |
| [D-005](#d-005) | 2026-10-27 | Foco: preparar para ingresar a Derecho; la lógica vive en `rules` | Vigente |
| [D-006](#d-006) | 2026-10-27 | Capa de entrenamiento, no plataforma de contenidos; se rutea a los videos de UBA XXI | Vigente |
| [D-007](#d-007) | 2026-10-27 | Las cuatro etapas: mapeo, preparar, ejercitar y feedback de la IA | Vigente |
| [D-008](#d-008) | 2026-10-27 | Las decisiones de diseño del modelo de aprendizaje | Vigente; la práctica cambió con D-023 |
| [D-009](#d-009) | 2026-10-27 | Orden de materias: la idea era IPC primero | Reemplazada por D-010 |
| [D-010](#d-010) | 2026-10-27 | Se arranca con ICSE, Cátedra Pedrosa | Vigente |
| [D-011](#d-011) | 2026-10-27 | Banco de preguntas únicas generado por script | Vigente |
| [D-012](#d-012) | 2026-10-27 | Fichas de afirmación como unidad de contenido, en borrador hasta validar | Vigente |
| [D-013](#d-013) | 2026-10-27 | Los exámenes no se republican | Vigente |
| [D-014](#d-014) | 2026-10-27 | El repo se pasa a privado antes de subir nada | Pendiente |
| [D-015](#d-015) | 2026-10-27 | Levantar la app con la API de Claude | Reemplazada por D-016 para uso local |
| [D-016](#d-016) | 2026-10-27 | En local, la app usa la sesión de Claude de Gastón | Vigente |
| [D-017](#d-017) | 2026-10-27 | El tutor usa Claude Opus 5.5 | Vigente |
| [D-018](#d-018) | 2026-10-27 | Cómo está armada la app (MVP) | Vigente |
| [D-019](#d-019) | 2026-10-27 | Claude no lee el `.env` | Vigente |
| [D-020](#d-020) | 2026-10-27 | Se lleva este registro de decisiones | Vigente |
| [D-021](#d-021) | 2026-10-27 | En las combinadas se marca cada afirmación y la app arma la letra de la grilla | Vigente |
| [D-022](#d-022) | 2026-10-27 | Landing, elegir carrera, elegir materia y en la materia el mapa con el diagnóstico | Vigente |
| [D-023](#d-023) | 2026-10-27 | La práctica es el Explainer Mode: se explica sin opciones, escrito o dictado | Vigente |
| [D-024](#d-024) | 2026-10-27 | Módulo de Sociología: Cátedra A · Bustos, con 10 finales | Vigente |
| [D-025](#d-025) | 2026-10-28 | La app no nombra a Claude: se dice "el tutor" | Vigente |

---

### D-001
**Proyecto CBC Preptest con carpetas `input`, `rules` y `output`** · 2026-10-27 · Gastón · Vigente

La carpeta `CBC Preptest` es el clon de [gatofb/ACMP_CBC21](https://github.com/gatofb/ACMP_CBC21). Adentro, `input/` tiene el material de origen (los exámenes), `rules/` la lógica y `output/` la app.

### D-002
**`input` junta los exámenes de UBA XXI por carrera y materia; se empieza por Abogacía** · 2026-10-27 · Gastón · Vigente

Las seis materias de Abogacía: IPC, ICSE, Sociología, Ciencia Política, DDHH y Derecho Constitucional, y Derecho Privado. Las fuentes que pasó Gastón son Altillo, Arrimo Wiki y ubaxxi.uba.ar.

- Estructura: `input/<carrera>/<materia>/<cátedra - instancia>/`.
- Cada materia tiene un `INDICE.md` y un `examenes_arrimo.csv` con los 742 exámenes que lista Arrimo.

### D-003
**No se esquiva el bloqueo de Altillo y Arrimo: Gastón baja los PDF y un script los ordena** · 2026-10-27 · Gastón · Vigente

Los dos sitios bloquean las descargas automáticas con Cloudflare: Altillo bloquea todo y Arrimo deja leer las páginas pero no los PDF. Ese bloqueo no se esquiva. Claude armó el índice de lo que hay en Arrimo, Gastón descarga los PDF a mano y `scripts/ordenar_descargas.py` los ubica en `input/`.

### D-004
**El script de descargas copia, no mueve, y solo toca exámenes** · 2026-10-27 · Claude (aprobada) · Vigente

La primera versión copió a `input/_sin_clasificar/` los 59 PDF personales de Descargas (resúmenes de tarjeta, facturas, informes). Gastón pidió borrarlos y se borraron; los originales nunca se tocaron.

- Desde entonces, el script solo copia los PDF del listado de Arrimo o con nombre de examen. Lo demás lo ignora.
- `input/_sin_clasificar/` está en `.gitignore`.

### D-005
**Foco: preparar para ingresar a Derecho; la lógica vive en `rules`** · 2026-10-27 · Gastón · Vigente

La app prepara a los alumnos para aprender y aprobar el CBC de UBA XXI rumbo a Derecho. Su nombre es **PrepTest UBA SXXI**. El principio es "Si lo podés explicar, lo entendés".

- Pendiente: el programa se llama "UBA XXI" (sin S), y usar "UBA" en la marca de un producto pago puede traer problemas con la Universidad. Hay que revisarlo antes de diseñar la marca.

### D-006
**Capa de entrenamiento, no plataforma de contenidos; se rutea a los videos de UBA XXI** · 2026-10-27 · Gastón · Vigente

UBA XXI ya tiene un campus completo, con más de 700 videos. PrepTest no compite con eso: es la capa que contesta tres preguntas. ¿Qué entendió realmente el alumno? ¿Qué tiene que practicar antes del examen? ¿Qué tan preparado está para aprobar o promocionar? Para estudiar, la app manda a los recursos del campus.

- **Propuesta de valor:** "Prepará tu parcial de UBA XXI con un tutor de IA que detecta lo que todavía no entendés, te hace practicar y te ayuda a llegar preparado al examen".
- **Qué se vende:** entrenamiento personalizado, no clases ni resúmenes.
- **Cómo se valida:** primero con estudiantes reales.

### D-007
**Las cuatro etapas: mapeo, preparar, ejercitar y feedback de la IA** · 2026-10-27 · Gastón · Vigente

1. **Mapeo:** encontrar los puntos ciegos.
2. **Preparar:** qué estudiar, con links a UBA XXI.
3. **Ejercitar:** el alumno elige la respuesta y explica su razonamiento.
4. **Feedback:** la IA evalúa y devuelve la corrección.

El detalle de cada etapa está en [00_modelo_de_aprendizaje.md](00_modelo_de_aprendizaje.md).

### D-008
**Las decisiones de diseño del modelo de aprendizaje** · 2026-10-27 · Claude (aprobada) · Vigente

Están desarrolladas en [00_modelo_de_aprendizaje.md](00_modelo_de_aprendizaje.md):

- **La unidad mínima es la afirmación:** una idea concreta de un autor que el examen puede preguntar. No se trabaja por "unidad" ni por "tema".
- **Punto ciego = estar seguro y equivocarse.** Por eso cada respuesta pide la seguridad: seguro, dudo o adiviné. Con eso salen cuatro estados: dominado, frágil, laguna y punto ciego.
- **Dos notas separadas:** la respuesta (la letra) y la comprensión (la explicación, de 0 a 3). Acertar con una mala explicación cuenta como frágil.
- **Pista antes de revelar:** si el alumno se equivoca, recibe una pista y una segunda oportunidad. El mapa se actualiza con el primer intento, como en el examen.
- **La IA evalúa contra la ficha,** no contra lo que sabe del tema: en el examen cuenta lo que dice el autor según la cátedra.
- **La preparación se muestra como un rango de nota,** y hay simulacros con el formato real (18 consignas en 1:30 h).

Con D-023 la práctica pasó al Explainer Mode. Ya no hay pista antes de revelar ni puntaje de comprensión de 0 a 3: la IA deduce qué habría marcado el alumno y califica su claridad, y el alumno puede volver a explicar. El resto de esta entrada sigue vigente.

### D-009
**Orden de materias: la idea era IPC primero** · 2026-10-27 · Gastón · Reemplazada por D-010

IPC se comparte con muchas carreras y evalúa razonamiento. Después vendrían ICSE y Derecho Privado.

### D-010
**Se arranca con ICSE, Cátedra Pedrosa** · 2026-10-27 · Gastón · Vigente

ICSE ya tenía exámenes descargados. El MVP trabaja con una cátedra por materia, y en ICSE es Pedrosa: es la de 1er y 2do parcial y la que tiene más material. IPC queda para después, y antes de escribir sus reglas hay que leer exámenes reales.

### D-011
**Banco de preguntas únicas generado por script** · 2026-10-27 · Claude (aprobada) · Vigente

Los temas de un examen son las mismas consignas mezcladas, y muchas preguntas se repiten entre cuatrimestres. Los 5 exámenes de Pedrosa (90 consignas) se reducen a 64 preguntas únicas.

- `scripts/extraer_examen.py` saca la clave de dos lugares: la grilla completada (2025 en adelante) o la opción resaltada en amarillo (2024 y antes).
- La clave se valida cruzando temas y cuatrimestres: la misma idea tiene que dar la misma respuesta. No se encontraron errores.
- Cada pregunta tiene un id que sale de su enunciado, así que no cambia al sumar exámenes.
- `rules/ICSE/Pedrosa/banco_preguntas.yaml` no se edita a mano: lo genera `scripts/armar_banco.py`.

### D-012
**Fichas de afirmación como unidad de contenido, en borrador hasta validar** · 2026-10-27 · Claude (aprobada) · Vigente

Hay 51 fichas en `rules/ICSE/Pedrosa/fichas_afirmacion.yaml` que cubren las 64 preguntas. El formato y los 9 tipos de error están en [01_formato_fichas.md](01_formato_fichas.md).

- Las fichas solo enseñan lo que la clave del examen avala; las dudas van a `notas`.
- Quedan en borrador hasta contrastarlas con la bibliografía. 17 tienen dudas anotadas.
- `scripts/validar_fichas.py` comprueba que cada pregunta tenga su ficha y genera `cobertura.md`.

### D-013
**Los exámenes no se republican** · 2026-10-27 · Claude (aprobada) · Vigente

Los exámenes son de la UBA y los recopilan terceros; Arrimo pide que su contenido se use solo como referencia. Se usan para el diagnóstico, los simulacros y como base para armar preguntas propias. Los PDF no se publican.

### D-014
**El repo se pasa a privado antes de subir nada** · 2026-10-27 · Gastón · Pendiente

El repo de GitHub es público, y el commit tiene los PDF y el texto completo de los exámenes. Gastón lo pasa a privado; recién entonces se hace el push.

- Hecho: el primer commit (`7eb7608`) está en `main`, solo local.
- Falta: que el repo figure como privado, commitear `output/` y hacer el push.

### D-015
**Levantar la app con la API de Claude** · 2026-10-27 · Gastón · Reemplazada por D-016 para uso local

El pedido fue levantar la app usando la API de Claude para evaluar las respuestas. La clave va en `output/.env`, que nunca se sube al repo. El camino por la API sigue disponible: es el que necesita la app cuando la usen alumnos.

### D-016
**En local, la app usa la sesión de Claude de Gastón** · 2026-10-27 · Gastón · Vigente

Para probar sin clave de API, el servidor llama al CLI `claude` de la máquina en modo aislado: sin herramientas, sin CLAUDE.md, MCP ni hooks, y sin guardar la sesión.

- Si se pega una clave en `.env`, la app pasa sola a la API. `TUTOR_PROVIDER` fuerza uno de los dos caminos.
- Límite: una suscripción personal no se puede usar para darle servicio a otros alumnos. Para publicar, hace falta la API.

### D-017
**El tutor usa Claude Opus 5.5** · 2026-10-27 · Gastón · Vigente

Es el modelo por defecto, tanto por la sesión como por la API, y se cambia con `CLAUDE_MODEL`. El esfuerzo es `low`, para que responda rápido, y se cambia con `CLAUDE_EFFORT`.

- Para usarlo por la sesión hizo falta actualizar el CLI: `claude update` no alcanzó porque estaba instalado con npm. Se actualizó con `npm install -g @anthropic-ai/claude-code@latest`, a la versión 2.1.311.
- Por la API se activó el respaldo automático (`fallbacks: "default"`): si el modelo rechaza un pedido, la API lo reintenta con otro.

### D-018
**Cómo está armada la app (MVP)** · 2026-10-27 · Claude (aprobada) · Vigente

Está en `output/`. Es un servidor Node con una página web.

- **Diagnóstico:** 18 preguntas, sin Claude.
- **Práctica:** 5 preguntas, con explicación y feedback de Claude.
- **Mi mapa:** cómo le fue al alumno en cada idea.
- Las claves de las preguntas y la clave de la API quedan en el servidor. El navegador recibe la respuesta correcta recién después de responder.
- El mapa del alumno se guarda en su navegador. Alcanza para probar; para alumnos reales hará falta guardarlo en un servidor.
- Usa la marca de la Academia (acmp-design): naranja como color funcional, Poppins e Inter y voseo.
- Se levanta desde la configuración `preptest` del panel del navegador, o con `npm start` en `output/`.
- Pendiente para cuando salga a producción: el snippet de PostHog y el botón flotante de WhatsApp, como en el resto de las páginas.

### D-019
**Claude no lee el `.env`** · 2026-10-27 · Gastón · Vigente

Gastón frenó un comando que mostraba el contenido de `output/.env`. Claude no lee ni muestra ese archivo: la configuración va en el código, con valores por defecto, o la edita Gastón.

### D-020
**Se lleva este registro de decisiones** · 2026-10-27 · Gastón · Vigente

Este archivo es el registro del proyecto. Cada decisión nueva se agrega al final con el formato de arriba.

### D-021
**En las combinadas se marca cada afirmación y la app arma la letra de la grilla** · 2026-10-27 · Claude (aprobada), a partir de lo que señaló Gastón · Vigente

Gastón marcó que mostrar las ocho opciones de una combinada como una sola lista confundía. A–D son afirmaciones y E–H son combinaciones ("Las opciones correctas son la C y la D"), pero se veían iguales. Así es el formato real del examen: en la grilla va una sola letra. Pero la lista plana saltea el paso clave. Como no hay puntaje parcial, hay que juzgar cada afirmación antes de buscar la letra, y eso ya lo pedía el modelo (D-008).

- **En la pregunta:** el alumno marca A, B, C y D como verdaderas o falsas. La app le muestra qué letra iría en la grilla; si ninguna opción coincide, le avisa que revise sus marcas. Si marca una sola verdadera, la respuesta es esa letra, como en el examen.
- **En el feedback:** se ven sus marcas afirmación por afirmación ("Bien" o "Era falsa") y la letra correcta.
- **La explicación** se pide solo sobre la afirmación que más le costó.
- **Las marcas** le llegan al mapa, que detecta la trampa exacta. Hasta D-023 también le llegaban a Claude en la práctica; desde entonces, en la práctica no se marca: se explica.
- **Verificado:** marcando bien las afirmaciones se llega a la clave del examen en las 49 versiones de preguntas combinadas del banco.

### D-022
**Landing, elegir carrera, elegir materia y en la materia el mapa con el diagnóstico** · 2026-10-27 · Gastón · Vigente

La app arranca con una landing que presenta el producto. De ahí se elige la carrera, después la materia, y en la página de la materia está el mapa del alumno con el botón del diagnóstico (y el de practicar).

- **Landing:** la propuesta de valor (D-006), los cuatro pasos (D-007), el principio "Si lo podés explicar, lo entendés" y qué tiene de distinto. Solo usa datos reales: las preguntas y los años salen del banco. No hay testimonios ni cifras inventadas.
- **Carreras y materias** salen de `rules/catalogo.yaml`. Hoy está Abogacía con sus seis materias: ICSE (Cátedra Pedrosa) está disponible y las otras cinco aparecen como "Próximamente". Sumar una materia es agregar su carpeta de reglas y la línea `reglas` en el catálogo.
- **El mapa se guarda por materia** (`preptest.mapa.<materia>` en el navegador). El mapa que ya existía de antes pasó solo a ICSE.
- **El pie aclara** que PrepTest es de Academia Comunica y no es un producto oficial de la UBA ni de UBA XXI (por lo pendiente de D-005).
- **El botón flotante de WhatsApp** de la Academia se carga desde www (`/js/shared/mp-cta.js`), para no sumar una tercera copia del script.

### D-023
**La práctica es el Explainer Mode: se explica sin opciones, escrito o dictado** · 2026-10-27 · Gastón · Vigente

En la práctica no hay opción múltiple: el alumno explica la pregunta con sus palabras, escrita o dictada. Con lo que explicó, la IA le dice qué habría marcado en el examen y le califica la claridad. El detalle está en las etapas 3 y 4 de [00_modelo_de_aprendizaje.md](00_modelo_de_aprendizaje.md).

- **Qué ve:** en verdadero/falso, solo el enunciado; en las combinadas, el enunciado y las afirmaciones A a D, sin la grilla.
- **Qué devuelve la IA:**
  - la letra que se deduce de la explicación (sin regalarla si no se puede decidir) y por qué;
  - la claridad, con cuatro chequeos: dice qué responde, da el motivo del autor, usa bien los conceptos y se entiende sin ambigüedad;
  - lo que explicó bien, qué le faltó, el razonamiento correcto y su misma explicación reescrita más clara;
  - al final, las opciones reales del examen con su letra y la correcta.
- **Explicarlo de nuevo:** hasta tres veces por pregunta. El mapa se actualiza con el primer intento.
- **Dictado con Whisper local** (whisper.cpp con el modelo `large-v3-turbo` que ya estaba en `~/models`): el navegador graba y el servidor transcribe en la máquina, así que el audio no sale de la computadora. Le pasa a Whisper un glosario con los autores de la materia para que escriba bien los nombres ("Povse" y no "Popse"). Tarda alrededor de un segundo.
- **Reemplaza** la práctica con opciones, la pista y la comprobación (D-008 en esa parte). El diagnóstico sigue en el formato del examen, con las marcas de D-021.
- **Pendiente:** para la app publicada hay que decidir dónde se transcribe el audio, porque no va a correr en la máquina de cada alumno.

### D-024
**Módulo de Sociología: Cátedra A · Bustos, con 10 finales** · 2026-10-27 · Gastón · Vigente

Gastón bajó de Altillo 113 PDF de finales de Sociología. Sin duplicados quedan 58 exámenes, de 2003 a 2024 y de tres orígenes: Cátedra A (Bustos), Cátedra B (Lorenzi) y la época en que había una sola cátedra. Están ordenados en `input/Abogacia/Sociologia/` por cátedra.

- **Cátedra A · Bustos:** la eligió Gastón. Sus autores (Heller, Elías, Weber, Marx, Durkheim, Althusser) son los mismos que los finales de 2015 a 2021 de la cátedra única, así que esos también suman.
- **Desde 2015:** los de 2003 a 2011 quedan afuera. Son de un programa viejo, con preguntas abiertas y sin respuestas marcadas.
- **Con 10 exámenes alcanza** (Gastón): 4 finales de Bustos (11/2021 y 02/2022) y 6 cuestionarios del campus (10/2020 y 07/2021). Se frenaron las transcripciones que ya no hacían falta. Los demás PDF quedan en `input/` por si se quieren sumar.
- **Transcripción:** casi todos son escaneos de Altillo, así que la IA los transcribió leyendo las páginas, con el formato de [03_formato_extraccion.md](03_formato_extraccion.md). Cada PDF lleva al lado su `.json`.
  - Las claves del campus son confiables: salen de "La respuesta correcta es…".
  - Las de los escaneos son cruces de un alumno (`marcas`): se cruzaron con el campus y no apareció ninguna contradicción.
- **Tipos de pregunta nuevos:** relacionar autor y concepto (cada par pasa a ser una pregunta propia), verdadero/falso por afirmación, opción múltiple con varias correctas y completar. Funcionan en el diagnóstico, en el Explainer Mode y en la corrección.
- **Resultado:** 207 preguntas únicas y 67 fichas, en borrador, en `rules/Sociologia/Bustos/`. En el mapa de Sociología las fichas se agrupan por autor.
- **Pendiente:**
  - contrastar las fichas con los textos de la cátedra;
  - revisar las dudas anotadas en `notas`. Por ejemplo, una clave de Maffía que podría estar mal (q-7138c3df), y "Lenguaje", que quedó asignado a Lefebvre por contenido;
  - confirmar si las autoras son "Facio y Fries".

### D-025
**La app no nombra a Claude: se dice "el tutor"** · 2026-10-28 · Gastón · Vigente

Ningún texto que ve el alumno dice "Claude": ni los botones ("El tutor está leyendo tu explicación…"), ni las explicaciones de la app, ni los mensajes de error que llegan a la pantalla. Se dice "el tutor" o "el tutor de IA". El nombre solo queda en el código, los comentarios y la configuración técnica.
