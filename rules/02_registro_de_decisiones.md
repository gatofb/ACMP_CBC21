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
| [D-026](#d-026) | 2026-10-28 | En la nube la app usa la API de Anthropic y corre desde un Dockerfile | Vigente |
| [D-027](#d-027) | 2026-10-28 | Módulo de IPC: Cátedra A · Buacar, con 10 versiones de parciales y finales | Vigente |
| [D-028](#d-028) | 2026-10-28 | La app también se publica en Vercel, con una función por ruta de la API | Vigente |
| [D-029](#d-029) | 2026-10-28 | Quick Demo: un diagnóstico de 4 preguntas para probar la app | Vigente |
| [D-030](#d-030) | 2026-10-28 | En el Explainer Mode se muestran las opciones cuando la pregunta no se contesta sin ellas | Vigente (ampliada por D-039) |
| [D-031](#d-031) | 2026-10-28 | La marca se escribe "Academia Comunica", sin "de Mai Pistiner", en la presentación y la app | Vigente |
| [D-032](#d-032) | 2026-10-28 | En la versión online dicta el navegador; Whisper queda para local | Vigente |
| [D-033](#d-033) | 2026-10-28 | Las preguntas de IPC no mencionan la grilla de resolución del examen en papel | Vigente |
| [D-034](#d-034) | 2026-10-28 | La app es bilingüe: español e inglés, con las preguntas traducidas | Vigente |
| [D-035](#d-035) | 2026-10-28 | La Home se simplifica con la idea de la presentación, el video y PostHog | Reemplazada por D-036 (lo de PostHog sigue) |
| [D-036](#d-036) | 2026-10-28 | Home más directa: hero con una muestra del Explainer, tres pasos y un bloque naranja | Vigente (el video, ver D-037) |
| [D-037](#d-037) | 2026-10-28 | El video "How it works" va en "Cómo funciona", al lado de los pasos | Vigente |
| [D-038](#d-038) | 2026-10-28 | La Home termina con un link a la presentación del proyecto | Vigente |
| [D-039](#d-039) | 2026-10-28 | Las preguntas que piden "la opción que justifica tu respuesta" también muestran las opciones | Vigente |
| [D-040](#d-040) | 2026-10-29 | MCP de PrepTest: la app pone la estructura y el razonamiento lo hace el Claude del alumno | Vigente |
| [D-041](#d-041) | 2026-10-29 | Dos planes en la Home: gratis por el MCP o 10 USD/mes con la app, y una página MCP con el instructivo | Vigente |
| [D-042](#d-042) | 2026-10-29 | MCP en línea en /mcp: se agrega como conector en Claude, ChatGPT, Gemini o Grok, con códigos de sesión y de mapa | Vigente |

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
- **Pendiente:** para la app publicada hay que decidir dónde se transcribe el audio, porque no va a correr en la máquina de cada alumno. Se resolvió en D-032: dicta el navegador.

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

### D-026
**En la nube la app usa la API de Anthropic y corre desde un Dockerfile** · 2026-10-28 · Gastón · Vigente

Para que la app pueda publicarse en un servicio en la nube y la usen otros alumnos:

- **Solo la API:** en la nube la evaluación va siempre por la API (`TUTOR_PROVIDER=api`). La sesión del CLI queda para probar en local, porque es una suscripción personal.
- **La clave** se carga como variable de entorno en el servicio. No va en el repo (es público) ni en la imagen.
- **Dockerfile en `CBC Preptest/`:** la imagen lleva `rules/` y `output/`, sin `input/` ni `.env`. Escucha en `0.0.0.0` y en el puerto 8080, o en el `PORT` que ponga el servicio.
- **En local no cambia nada:** sin `HOST`, el servidor sigue atendiendo solo a esta computadora.
- **Dictado:** no está en la nube; el alumno escribe. Sigue pendiente lo de D-023. Desde D-032, en la nube dicta el navegador.
- **Sin clave de acceso ni límite de pedidos, por ahora** (Gastón): el gasto se controla con una clave de API solo para la app y un tope en la consola de Anthropic.

### D-027
**Módulo de IPC: Cátedra A · Buacar, con 10 versiones de parciales y finales** · 2026-10-28 · Gastón · Vigente

Gastón dejó en Descargas 33 PDF de IPC de tres cátedras: Buacar (9 PDF con 62 versiones), Perot (23 finales e integradores) y Gimeno (1). Están ordenados en `input/Abogacia/IPC/` por cátedra e instancia.

- **Cátedra A · Buacar:** la eligió Gastón. Tiene más material y cada ejercicio trae la explicación oficial de la cátedra. Los de Perot y Gimeno quedan en `input/` para un módulo futuro.
- **10 versiones**, con peso en 2025: 1er parcial 2025 (temas 1 y 2), 2do parcial 2025 (temas 1 y 2), final 02/2025 (temas 1 y 2), 1er parcial 2026 de abril y de septiembre, final 12/2024 y final 07/2026 (tema 1 de cada uno).
- **Transcripción:** los PDF tienen texto, así que la IA los transcribió del texto, mirando la imagen solo en las tablas y fórmulas. Las claves salen de la grilla y coinciden con lo resaltado. [03_formato_extraccion.md](03_formato_extraccion.md) suma las reglas de IPC: opciones numeradas, ejercicios con partes (A/B, HF/HA) y consignas que se apoyan en otra.
- **Arreglos en `armar_banco.py`**, sin cambios en ICSE:
  - dos consignas del mismo examen nunca se juntan (las partes 9P y 9C);
  - se compara también lo que pide la primera oración (hipótesis auxiliar ≠ consecuencia observacional del mismo caso);
  - la instrucción de examen se saca solo si no tiene contenido.
  
  Por esos arreglos también cambió el banco de Sociología, que ahora tiene 212 preguntas: había preguntas juntadas por error. `scripts/remapear_fichas.py` pasó las fichas al banco nuevo.
- **Resultado:** 97 preguntas únicas (90 con explicación oficial) y 30 fichas, en borrador, en `rules/IPC/Buacar/`. El mapa se agrupa por tema: argumentos, enunciados, deductivos, inductivos, explicación, contrastación, Darwin, Kuhn, epistemología feminista, ética, etc.
- **Pendiente:**
  - contrastar las fichas con el libro de la cátedra;
  - revisar las dudas anotadas: una clave que podría aceptar dos conclusiones (q-c39c7bda) y una explicación oficial de Lamarck que no cierra con su clave;
  - en los ejercicios donde la cátedra acepta dos soluciones (premisa faltante y conclusión intercambiables), la app hoy acepta solo la de la grilla.

### D-028
**La app también se publica en Vercel, con una función por ruta de la API** · 2026-10-28 · Gastón · Vigente

Además del Dockerfile (D-026), la app puede publicarse en Vercel, que no corre un servidor encendido sino funciones por pedido.

- **Mismo servidor:** `api/` tiene una función por ruta (estado, catálogo, fichas, sesión, responder, explicar, transcribir) y cada una le pasa el pedido a `output/server.mjs`. No hay una copia aparte de la lógica.
- **En Vercel no escucha en un puerto:** `server.mjs` solo abre el puerto si no está en Vercel. En local y en Docker no cambia nada.
- **El cuerpo del pedido:** Vercel suele entregarlo ya leído en `req.body`; si no, se lee como en local.
- **Configuración en `vercel.json`:** las páginas salen de `output/public/`, las dependencias se instalan en `output/` y las funciones llevan `rules/` y tienen hasta 60 segundos.
- **Única variable:** `ANTHROPIC_API_KEY`. El dictado tampoco está en Vercel (desde D-032, dicta el navegador).
- **Pendiente:** probarla en Vercel. Se probó en local, imitando cómo Vercel entrega los pedidos.

### D-029
**Quick Demo: un diagnóstico de 4 preguntas para probar la app** · 2026-10-28 · Gastón · Vigente

En la tarjeta del diagnóstico, al lado de "Hacer el diagnóstico", hay un botón **Quick Demo · 4 preguntas**.

- **Es el mismo diagnóstico, en corto:** una pregunta por ficha, de las ideas que más se toman; mismo formato y sin correcciones en el medio. El servidor lo arma con `modo=demo`.
- **Entra al mapa**, como cualquier diagnóstico. El resultado dice "Resultado del Quick Demo", no calcula el puntaje del examen (con 4 preguntas no dice nada) y ofrece "Hacer el diagnóstico completo".
- El botón queda siempre visible, también cuando el mapa ya tiene ideas trabajadas.

### D-030
**En el Explainer Mode se muestran las opciones cuando la pregunta no se contesta sin ellas** · 2026-10-28 · Gastón · Vigente

Gastón probó una pregunta de IPC ("Indique cuál de las siguientes afirmaciones expresa una tesis sostenida por la teoría feminista del punto de vista…") y no se podía contestar: el Explainer ocultaba las opciones.

- **Cuáles:** las preguntas simples cuyo enunciado se refiere a las opciones: "cuál de las siguientes / de ellos", "qué premisa", "las siguientes afirmaciones, características, proposiciones…". Las de relacionar no entran. Hoy son 21 preguntas de Sociología y 27 de IPC. ICSE no tiene.
- **Cómo:** se muestran las opciones para elegir una y la consigna dice "Elegí una opción y explicá por qué es la correcta". Se corrige la opción elegida, no la que deduce la IA. La IA evalúa si la explicación sostiene esa elección y califica la claridad igual que siempre.
- **Lo demás no cambia:** en las otras preguntas el alumno sigue explicando sin ver las opciones (etapa 3 de [00_modelo_de_aprendizaje.md](00_modelo_de_aprendizaje.md)).

### D-031
**La marca se escribe "Academia Comunica", sin "de Mai Pistiner", en la presentación y la app** · 2026-10-28 · Gastón · Vigente

En PrepTest el nombre queda solo como **Academia Comunica**.

- **Dónde:** el logo (sin la línea "de Mai Pistiner"), la portada y los textos alternativos de las dos presentaciones (`presentation/` y `presentation-v2/`), y el logo de la app (`output/public/logo-acmp-primary.svg`). Los textos de la app ya decían "Academia Comunica".
- **Se aparta del manual de marca de ACMP,** que pide el nombre completo en contextos formales. Es una decisión para este proyecto.
- **En la v2 el logo además va sin las ondas,** solo con el texto.

### D-032
**En la versión online dicta el navegador; Whisper queda para local** · 2026-10-28 · Gastón · Vigente

En la nube y en Vercel no hay Whisper (D-026, D-028). Gastón pidió sumar dictado a la versión online con el dictado del navegador o `whisper-small`, el que mejor funcione en español o inglés. Se eligió el del navegador (Web Speech API).

- **Por qué el navegador y no `whisper-small`:** `whisper-small` tendría que correr en el navegador del alumno y bajar un modelo de unos 200 MB, lento en el celular. El del navegador no baja nada, transcribe mientras el alumno habla y en español rioplatense anda bien. Tampoco suma otra clave ni costo.
- **Cuándo se usa:** si el servidor tiene Whisper (local), sigue Whisper. Si no, dicta el navegador. Si el navegador no tiene dictado (Firefox), el alumno escribe.
- **Idioma:** `es-AR`, porque las explicaciones son en español.
- **Privacidad:** en Chrome el audio pasa por Google; en Edge, por Microsoft; en Safari, por Apple. En local el audio sigue sin salir de la máquina.
- **Cómo anda:** muestra lo que va entendiendo y suma cada frase al cuadro; el alumno la corrige antes de enviar. Si el navegador corta por un silencio, sigue escuchando hasta que el alumno toca Terminar. En Android escucha frase por frase, porque en modo continuo repite frases.
- **Sin el glosario de autores:** el dictado del navegador no acepta la lista de nombres que se le pasa a Whisper, así que puede escribir mal algún apellido.
- **Pendiente:** probarlo en Vercel con un micrófono, en Chrome y en Safari del celular. En local se probó la lógica con un reconocedor simulado.

### D-033
**Las preguntas de IPC no mencionan la grilla de resolución del examen en papel** · 2026-10-28 · Gastón · Vigente

Los exámenes de IPC se contestan en una grilla de papel, y 102 versiones de preguntas decían cómo anotar la respuesta ("Seleccioná una opción y escribí el número en la grilla de resolución", "Escriba "V" o "F" donde dice "A"…"). En la app no hay grilla: Gastón pidió sacarlas.

- **Dónde:** `scripts/armar_banco.py` limpia el enunciado que ve el alumno al armar el banco, así no vuelve al regenerarlo. El agrupado y los ids siguen saliendo del enunciado original: las fichas y los mapas de los alumnos no cambian.
- **Cómo:** la oración que solo dice cómo anotar se saca. Si dice algo más, queda esa parte: "Seleccione dos opciones.", "Seleccione la opción que justifica su respuesta.". Si la pregunta está en la oración, se reescribe: "Escribí el número correspondiente al silogismo inductivo donde dice "S"…" pasa a "¿Cuál es el silogismo inductivo?". También se saca la etiqueta "(casillero "HF")" al final de la pregunta.
- **Efecto en D-030:** "las opciones presentadas" solo aparecía en esas instrucciones, así que se sacó de la regla. Las dos preguntas que la usaban ("Identifique la hipótesis auxiliar / la consecuencia observacional del caso del ejercicio 1") se explican con palabras, como las demás de hipótesis.
- ICSE y Sociología no tenían estas instrucciones: sus bancos quedan iguales.

### D-034
**La app es bilingüe: español e inglés, con las preguntas traducidas** · 2026-10-28 · Gastón · Vigente

Gastón pidió pasar todo a inglés para que la app sea bilingüe, menos la presentación. El inglés es para que alguien que no lee español pueda usar la app, por ejemplo en la demo.

- **Qué se traduce:** toda la interfaz (`output/public/textos.js`), la Home, el catálogo (`en` en `rules/catalogo.yaml`), los mensajes de error del servidor, y de cada pregunta el enunciado, las opciones, los huecos y la explicación del examen. De las fichas, lo que ve el alumno: tema, autor y pregunta guía. Las 373 preguntas (445 versiones) y las 148 fichas.
- **Lo que no se traduce:** el resto de la ficha (afirmación, puntos, trampas, explicación modelo). El tutor la lee en español, que es la fuente, y escribe el feedback en el idioma del alumno.
- **Cómo se traduce:** `scripts/traducir_banco.mjs` con el CLI `claude` de esta máquina. Guarda `rules/<cátedra>/traduccion_en.yaml` con la huella del texto en español de cada versión: si el banco cambia, el servidor muestra esa pregunta en español hasta que se vuelve a correr el script, que solo traduce lo que falta. Valida que las letras, las combinaciones ("The correct options are C and D") y los huecos queden en su lugar.
- **Se corrige siempre en español:** el navegador recibe la pregunta en los dos idiomas y muestra la del idioma elegido; las letras son las mismas y en las de completar la palabra se pasa a español por su posición.
- **Cómo se elige:** el botón ES / EN de la barra, `?lang=en` en el link, o el idioma del navegador la primera vez. Queda guardado. Cambiarlo redibuja la pantalla sin perder la sesión ni lo escrito.
- **Dictado:** el del navegador usa `en-US` y Whisper `-l en` cuando la app está en inglés.
- **Pendiente:** la traducción es un borrador hecho con IA; falta que alguien la revise, sobre todo los términos de cada autor.

### D-035
**La Home se simplifica con la idea de la presentación, el video y PostHog** · 2026-10-28 · Gastón · Reemplazada por D-036 (lo de PostHog sigue)

Gastón pidió simplificar la Home a partir de la presentación, con algunas cosas que expliquen qué es la app, y sumar su video "How it works".

- **Queda así:** el principio ("Si lo podés explicar, lo entendés"), el video, los tres pasos de la presentación (encontrá lo que no sabés, explicalo, recibí feedback), los cuatro estados del mapa, una banda con el dato de que las ideas se repiten (las preguntas y las ideas se cuentan del banco) y la frase del cierre de la presentación.
- **Sale:** el paso "Preparar" (los videos del campus todavía no están asignados) y la grilla de "Qué tiene de distinto".
- **El video:** va en `output/public/video/como-funciona-en.mp4` con su imagen de portada. Está en inglés; en español se avisa debajo. Si el archivo no está, la sección no se muestra.
- **PostHog:** como toda página que sale a producción, `index.html` lleva el snippet entre `<!-- acmp:posthog -->` y `<!-- /acmp:posthog -->`.

### D-036
**Home más directa: hero con una muestra del Explainer, tres pasos y un bloque naranja** · 2026-10-28 · Gastón · Vigente

Reemplaza a D-035 (menos lo de PostHog, que sigue). Gastón pidió una Home más simple, directa y con más impacto. Quedan tres bloques:

- **Hero en dos columnas:** el principio en grande ("Si lo podés explicar, lo entendés"), una línea de qué hace la app, el botón "Elegí tu materia →" y tres cifras que salen del banco (preguntas, ideas y materias). A la derecha, una tarjeta navy con una muestra del Explainer Mode armada con una pregunta real de ICSE: la pregunta, la explicación del alumno, lo que habría marcado, la claridad y cómo queda en el mapa. Así se entiende la app sin leer.
- **Cómo funciona:** tres pasos de una línea (diagnóstico, explicás, feedback).
- **Bloque naranja al final:** las mismas ideas vuelven con otras palabras, con el dato de cuántas preguntas y cuántas ideas hay, y el botón otra vez. Es el uso del naranja que pide la marca: bloque entero solo para el CTA grande.
- **El video** se abre en una ventana desde "Mirá cómo funciona"; el botón solo aparece si `output/public/video/como-funciona-en.mp4` existe.
- **Con una sola carrera**, el botón lleva directo a sus materias.
- **Entrada animada** del hero, que arranca recién cuando el navegador dibuja: en una vista previa o una captura el contenido se ve igual.
- **Salen:** los cuatro estados del mapa, la banda navy y la frase de cierre.

### D-037
**El video "How it works" va en "Cómo funciona", al lado de los pasos** · 2026-10-28 · Gastón · Vigente

Cambia lo del video de D-036 (que se abría en una ventana). Gastón pidió el video debajo de "Cómo funciona" y eligió la versión con audio, que se reproduce al tocarla.

- **El archivo:** `V1-preptest-how-it-works-en.mp4` de la carpeta de Drive de Gastón (2:03, vertical 4:5, en inglés), comprimido a 720×900 y 3,5 MB (era 10,7 MB) con `faststart` para que arranque sin bajarlo entero. Queda en `output/public/video/como-funciona-en.mp4`. La portada es el cuadro del segundo 30 ("How PrepTest works"), en WebP.
- **Dónde:** como es vertical, en pantallas anchas va a la derecha de los tres pasos, que pasan a una columna; en el celular, debajo de los pasos. El botón "Mirá cómo funciona" del hero baja hasta el video.
- **Si el archivo no está**, no aparecen ni el video ni el botón, y los pasos quedan en fila.
- En español se avisa debajo que el video está en inglés. Hay otra versión sin audio en la misma carpeta; no se usa.

### D-038
**La Home termina con un link a la presentación del proyecto** · 2026-10-28 · Gastón · Vigente

Gastón pidió el link a la presentación al final de la Home.

- **Qué:** debajo del bloque naranja, el botón "Ver la presentación del proyecto →" (en inglés, "See the project presentation →") abre `/presentation-v3/` en otra pestaña, así no se pierde la app. En español se avisa que está en inglés.
- **Dónde está la presentación:** en Vercel, `vercel.json` copia `presentation-v3/` a `output/public/` al publicar. En local, `server.mjs` la sirve desde su carpeta, así el link también anda en `localhost:4321`.

### D-039
**Las preguntas que piden "la opción que justifica tu respuesta" también muestran las opciones** · 2026-10-28 · Gastón · Vigente

Amplía D-030. Gastón probó una de IPC ("A. Determine si el argumento es deductivo o inductivo… B. Seleccione la opción que justifica su respuesta") y en el Explainer Mode no veía las opciones que la consigna le pedía elegir.

- **Regla:** `PIDE_OPCIONES` en `output/server.mjs` también reconoce "la opción que justifica". Son 14 preguntas de IPC, todas de dos partes (veredicto y justificación). Con eso IPC tiene 41 preguntas que muestran las opciones; Sociología sigue en 21 e ICSE en 0.
- **No entran** las de Sociología que dicen "Seleccione la opción correcta" o "Marque con una cruz": se contestan bien con palabras. Tampoco las de IPC que piden clasificar el argumento (deductivo, analogía, enumeración, silogismo): las categorías ya están en el enunciado.

### D-040
**MCP de PrepTest: la app pone la estructura y el razonamiento lo hace el Claude del alumno** · 2026-10-29 · Gastón · Vigente

Gastón pidió un MCP para elegir carrera y materia y que le dé las preguntas para contestar de a una, sin usar los tokens de la API. La idea: la app provee la estructura y la lógica corre del lado del usuario.

- **Qué es:** `output/mcp.mjs`, un servidor MCP por stdio. Tools: `ver_catalogo`, `ver_ideas`, `empezar` (práctica, demo o diagnóstico), `responder` y `ver_mapa`, y el prompt `practicar`.
- **Sin API:** lo que tiene clave se corrige con la clave del examen. Si el alumno explica con sus palabras, su propio Claude deduce qué marcaría y juzga la claridad, manda eso a `responder` y da el feedback con la ficha que le devuelve el MCP. Las reglas del tutor van en las instrucciones del servidor.
- **Misma lógica que la app:** las preguntas, las sesiones y la corrección pasaron a `output/banco.mjs`, que usan el servidor web y el MCP. El servidor devuelve lo mismo que antes (se comparó la salida de sus rutas).
- **Como en la app:** práctica con feedback en cada pregunta y primero los puntos ciegos; demo y diagnóstico sin feedback hasta el final. El mapa usa los mismos cuatro estados y se guarda en `~/.preptest/mapa.json`, aparte del mapa del navegador. Se puede usar en inglés.
- **Registro:** `.mcp.json` en la raíz para Claude Code; los pasos para Claude Desktop están en `output/README.md`.
- **Dependencias:** `@modelcontextprotocol/sdk` 1.32.2 y `zod` 4.6.7 en `output/` (la 3 tenía una vulnerabilidad).

### D-041
**Dos planes en la Home: gratis por el MCP o 10 USD/mes con la app, y una página MCP con el instructivo** · 2026-10-29 · Gastón · Vigente

Gastón pidió las instrucciones del MCP en una página que se llame MCP, y en la Home la opción de usarlo gratis (lleva al instructivo) o pagar 10 USD/mes (lleva a la app).

- **Home:** una sección "Planes" entre "Cómo funciona" y el bloque naranja. Gratis (0 USD): desde el asistente de IA de cada uno, con el MCP; botón "Usalo gratis →" a `#/mcp`. PrepTest completo (10 USD/mes): la app con el tutor, el dictado y el mapa en la web; botón "Pagá 10 USD/mes →" a las materias.
- **No hay cobro:** el botón de pago entra a la app; todavía no hay pasarela de pago ni cuentas.
- **Página `#/mcp`:** qué se puede hacer, qué hace falta (Node.js 20 y un asistente que acepte MCP), los tres pasos (bajar el repo de GitHub e instalar, sumar el servidor a la configuración MCP del asistente, pedirle "Quiero practicar con PrepTest") con botones para copiar, y las diferencias con la versión paga. En español e inglés.
- **Sin nombrar a Claude (D-025):** la página habla de "tu asistente de IA"; los pasos sirven para cualquier asistente con MCP.
- **Depende del repo público:** el paso 1 clona `gatofb/ACMP_CBC21`. Si el repo pasa a privado, hay que cambiar cómo se baja el MCP.

### D-042
**MCP en línea en /mcp: se agrega como conector en Claude, ChatGPT, Gemini o Grok, con códigos de sesión y de mapa** · 2026-10-29 · Gastón · Vigente

Gastón quería que el MCP aparezca como conector. Los conectores de los asistentes solo aceptan servidores publicados en internet, así que se armó la versión en línea, y pidió que el plan gratis muestre los logos de Gemini, Claude, ChatGPT y Grok.

- **Dirección:** `https://acmp-cbc21.vercel.app/mcp` (Streamable HTTP, sin estado, sin autenticación). `vercel.json` la lleva a `api/mcp.mjs`, que usa `output/mcp-http.mjs`. Si se abre en el navegador, lleva a la página `#/mcp`.
- **Sin memoria en el servidor:** cada pedido arma su propio servidor. La sesión viaja en un código corto que devuelve cada pregunta (materia, modo, idioma, preguntas, por cuál va, aciertos y mapa) y el mapa en otro código que se da al terminar, para seguir otro día. Los dos tienen un control de 4 caracteres: si se alteran, dan error. Cada idea se nombra con 5 caracteres de su huella; se verificó que no se repiten en ninguna materia.
- **Una sola lógica:** las herramientas están en `output/mcp-servidor.mjs`, que usan la versión en línea y la local (`output/mcp.mjs`, que además guarda el mapa en la computadora). Reemplaza el diseño de sesión en memoria de D-040.
- **Página `#/mcp`:** primero la dirección para copiar, después cómo agregarla en cada asistente (con su logo), qué pedirle y el código del mapa. La versión local queda al final, plegada. Los pasos de cada asistente salen de su documentación y de guías de octubre de 2026: en ChatGPT depende del plan y va por la web, en Gemini por ahora es para cuentas personales de Estados Unidos y en Grok puede pedir plan pago. Los menús cambian seguido y la página lo avisa.
- **Logos:** de Lobe Icons (`@lobehub/icons-static-svg` 1.101.0, licencia MIT), en un solo color (navy 300) en `output/public/logos/`. Simple Icons no tiene los de ChatGPT ni Grok.
- **D-025 sigue:** el tutor de la app no se llama Claude. Nombrar a los asistentes con los que funciona el conector es otra cosa: es para que el alumno sepa dónde agregarlo.
- **Pendiente:** probarlo agregado como conector en cada asistente; se probó con el cliente del SDK de MCP, por HTTP y por stdio.
