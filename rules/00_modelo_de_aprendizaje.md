# PrepTest UBA XXI — Modelo de aprendizaje

> **Si lo podés explicar, lo entendés.**

No somos otra plataforma de contenidos. El campus de UBA XXI ya tiene videos, guías y actividades. PrepTest es la **capa de entrenamiento** que va arriba y contesta tres preguntas:

1. ¿Qué entendió realmente el alumno?
2. ¿Qué tiene que practicar antes del examen?
3. ¿Qué tan preparado está para aprobar o promocionar?

Este documento define la lógica. La app (en `output/`) la implementa, no la inventa. Las decisiones que llevaron hasta acá, con quién las tomó y por qué, están en [02_registro_de_decisiones.md](02_registro_de_decisiones.md).

---

## 1. Qué evalúa el examen real

Lo que sigue sale de cinco exámenes de ICSE, Cátedra Pedrosa: el 1er parcial del 1er cuatrimestre de 2026 (Temas 1 y 2), el 1er parcial del 2do cuatrimestre de 2024 (Tema 9) y dos recuperatorios del 1er parcial (1er cuatrimestre de 2024 y 2do de 2025). Hay que confirmarlo con el 2do parcial, los finales e IPC antes de cerrar las reglas de cada materia.

**Formato**
- 18 consignas en 1:30 h. Las primeras 16 valen 0,5 y las dos últimas valen 1. Total: 10 puntos.
- **No hay puntaje parcial.** Una opción mal en una combinación hace que valga 0 toda la consigna.
- Solo cuenta la letra escrita en la grilla.

**Los temas son el mismo examen mezclado.** El Tema 2 tiene las mismas 18 consignas que el Tema 1, en otro orden y con las opciones cambiadas de lugar. Consecuencias:
- Memorizar letras no sirve. Memorizar el contenido sí.
- De un cuatrimestre con "12 temas" salen ~18 preguntas únicas, no 216. Antes de cargar el banco hay que **sacar los duplicados**.

**Tres tipos de consigna**

| Tipo | Forma | Qué mide de verdad |
|---|---|---|
| **V/F con justificación** | "Es verdadero, porque…" / "Es falso, porque…" (4 opciones) | Saber el veredicto **y** el motivo. Hay opciones con el veredicto correcto y el motivo equivocado. |
| **Selección múltiple combinada** | A–D son afirmaciones; E–H son combinaciones ("A y C") | Juzgar cada afirmación por separado. Un solo error tira toda la consigna. |
| **Atribución a autor** | Casi todas empiezan con "Según [autor]…" | Lo que dice **ese texto de la cátedra**, no lo que es verdad en general. |

**Cómo están armadas las opciones incorrectas.** Cada distractor es un error típico, y por eso sirve para diagnosticar: confundir conceptos vecinos (Estado, gobierno y régimen), cambiar una palabra clave, anacronismos (Videla gobernando en 1975), hechos equivocados, datos inventados, absolutos falsos ("nunca", "necesariamente"), veredicto correcto con motivo equivocado, medias verdades y verdades generales que el autor no sostiene. La lista cerrada de códigos está en [01_formato_fichas.md](01_formato_fichas.md#tipos-de-error).

**Las preguntas vuelven entre cuatrimestres.** En los 5 exámenes de Pedrosa relevados (1er parcial y recuperatorios de 2024 a 2026) hay 90 consignas, pero solo 64 preguntas distintas. La misma idea aparece reformulada, con otras opciones o con el enunciado invertido: Petrino se preguntó como "ligado a lo europeo" (falso) y como "ligado a lo latinoamericano" (verdadero). Por eso enseñamos la idea y no la pregunta.

**Peso de la bibliografía.** En ICSE, 10 de las 18 consignas son de Romero. El resto son de capítulos del manual de la cátedra, uno por consigna. La frecuencia en los exámenes es el mejor indicador de qué estudiar primero.

**El examen pregunta por los videos del campus.** Desde 2024 aparecen consignas del tipo "En el video sobre la Transición a la Democracia en Sudáfrica…" o "En el video en que Levy Yeyati entrevista a Gerchunoff…". Mandar al alumno a los videos de UBA XXI no es un complemento: es parte de lo que se evalúa.

**Régimen de aprobación de UBA XXI** (guía de exámenes 2026; hay que confirmarlo en el programa de cada materia):
- Promedio de los dos parciales de 7 o más: **promoción**.
- Promedio entre 4 y 6: **final**, que se aprueba con 4.
- Recuperatorio: uno solo de los dos parciales, y solo con ausencia justificada.

---

## 2. La unidad mínima: la afirmación

No enseñamos "unidades" ni "temas". Enseñamos **afirmaciones**: una idea concreta de un autor que el examen puede preguntar. Todo cuelga de ahí: las preguntas, los videos, el mapa del alumno y la nota estimada.

```yaml
id: icse.romero.rodrigazo
materia: ICSE
catedra: Pedrosa
unidad: 3
autor: Luis A. Romero
fuente: Breve historia contemporánea de la Argentina, cap. X
afirmacion: >
  En 1975 el Rodrigazo desató una crisis económica incontrolable:
  corrida al dólar, inflación galopante e indexación.
conceptos: [Rodrigazo, crisis 1975, tercer peronismo]
errores_tipicos: [anacronismo, actor_equivocado]
recurso_ubaxxi:            # adónde mandamos a estudiar
  titulo: "Unidad 3 — Video: El tercer peronismo"
  url: <link del campus>
  minuto: "04:10"          # si aplica
frecuencia: 4/4 cuatrimestres relevados
preguntas: [icse-2026-1c-p1-c06, ...]
```

**Regla:** la IA evalúa contra el texto de la afirmación, no contra lo que ella sabe del tema. En ICSE la respuesta correcta es la de la cátedra. Si la ficha no alcanza para evaluar, la IA lo dice; no completa con lo que sabe por su cuenta.

---

## 3. Las cuatro etapas

```
 MAPEO ──▶ PREPARAR ──▶ EJERCITAR ──▶ FEEDBACK DE LA IA
   ▲                                        │
   └──────── se actualiza el mapa ──────────┘
```

### Etapa 1 · Mapeo: encontrar los puntos ciegos

**Qué es un punto ciego:** algo que el alumno **cree que sabe y no sabe**. Es lo más peligroso, porque nunca lo va a repasar por su cuenta. Para detectarlo no alcanza con ver si la respuesta está bien: después de cada respuesta preguntamos cuánta seguridad tiene.

> ¿Qué tan seguro estás? · **Seguro** · **Dudo** · **Adiviné**

|  | Seguro | Dudo / Adiviné |
|---|---|---|
| **Correcta** | 🟢 **Dominado** | 🟡 **Frágil**: sabe, pero no lo puede sostener |
| **Incorrecta** | 🔴 **Punto ciego** | 🟠 **Laguna**: sabe que no sabe |

**Reglas del diagnóstico**
- Formato real (mismos tres tipos de consigna), pero **sin reloj** y **sin feedback** durante la prueba. Primero medimos, después enseñamos.
- 18 preguntas como máximo, que cubran todas las unidades del parcial. No más de 15 minutos.
- Preguntas mezcladas de distintas unidades, no agrupadas por unidad.
- En las combinadas pedimos V/F por cada afirmación (A–D) además de la letra final. Así sabemos **cuál** afirmación falló, no solo que falló la consigna.
- El resultado no es una nota: es un **mapa por afirmación** con los cuatro colores y el primer tipo de error que aparece ("confundís Estado con gobierno").

### Etapa 2 · Preparar: qué estudiar y dónde

El plan se arma solo, ordenado por **prioridad = peso en el examen × tamaño de la brecha**.

| Estado | Brecha | Qué hacemos |
|---|---|---|
| 🔴 Punto ciego | Alta | Primero. Video + práctica con explicación obligatoria. |
| 🟠 Laguna | Alta | Video + práctica. |
| 🟡 Frágil | Media | Sin video: práctica con explicación para afianzarlo. |
| 🟢 Dominado | Baja | Solo repaso espaciado. |

**Cómo mandamos a los videos de UBA XXI**
- Por cada afirmación, un recurso concreto del campus: unidad, título y minuto si se puede. No mandamos "mirá la unidad 3".
- **Antes del video**, una pregunta guía: *"Mientras lo mirás, buscá por qué un cambio de gobierno no implica un cambio de régimen."* Ver sin una pregunta es pasivo; ver buscando una respuesta es estudiar.
- **Después del video**, se vuelve a la misma afirmación con una pregunta distinta. La que falló no se repite tal cual.
- Sesiones cortas: 3 a 5 afirmaciones por vez, 20 a 25 minutos.

### Etapa 3 · Ejercitar: Explainer Mode

Esta es la diferencia con cualquier banco de preguntas. **La explicación es el ejercicio.** El examen ya pregunta el "porque"; nosotros entrenamos exactamente eso.

En la práctica **no hay opciones para elegir**: el alumno explica y la IA deduce qué habría marcado. Explicar sin ver las opciones obliga a recordar la idea, no a reconocerla, y no deja adivinar. El diagnóstico y los simulacros siguen en el formato real del examen.

**Qué ve el alumno**
- **Verdadero/falso:** solo el enunciado, sin las cuatro opciones "Es verdadero, porque…".
- **Combinadas:** el enunciado y las afirmaciones A a D, sin la grilla de combinaciones (E a H).

**Flujo de cada pregunta**
1. **Marca la seguridad**: seguro / dudo / adiviné.
2. **Explica** con sus palabras, **escrito o dictado**:
   - Verdadero/falso: *¿es verdadero o falso? ¿por qué, según el autor?*
   - Combinadas: *¿cuáles de estas afirmaciones son correctas? ¿por qué?*
   - El dictado se transcribe con Whisper en la misma máquina (el audio no sale de la computadora), y el texto queda en la caja para corregirlo antes de mandarlo.
3. Recibe el **feedback** (etapa 4).
4. Puede **explicarlo de nuevo** con lo que aprendió, hasta tres veces por pregunta. En el mapa cuenta el primer intento, como en el examen.

**Variantes de ejercicio para sumar más adelante** (de menor a mayor exigencia)
1. **Explicar**: el porqué, con sus palabras (lo que hace hoy el Explainer Mode).
2. **Reformular**: la misma afirmación con otras palabras o invertida. Así comprobamos que no memorizó la frase.
3. **Armar la trampa**: *"Escribí una opción falsa que parezca verdadera."* Solo puede armar una trampa quien entendió la idea. Es el nivel más alto.

**Cuándo vuelve cada afirmación (repaso espaciado)**
- Si falló: vuelve en la misma sesión con otra pregunta, al día siguiente y a los 3 días.
- Si acertó sin seguridad: al día siguiente y a la semana.
- Si es dominada: a la semana y otra vez cerca del examen.
- Las sesiones mezclan afirmaciones de distintas unidades. Agrupar por unidad da sensación de avance, pero en el examen todo viene mezclado.

### Etapa 4 · Evaluación y feedback de la IA

**Dos resultados separados, siempre**
- **Qué habría marcado**: la IA lee la explicación como si fuera la respuesta y deduce la letra de la grilla. En las combinadas, juzga cada afirmación según lo que dijo (verdadera, falsa o no la mencionó). Si con lo que dijo no se puede decidir, no le regala la letra. La letra se compara con la clave: eso es objetivo.
- **Claridad**: cuatro chequeos, cada uno se cumple o no.

| Chequeo | Se cumple cuando… |
|---|---|
| **Dice qué responde** | Se entiende si es verdadero o falso, o qué afirmaciones da por correctas. |
| **Da el motivo del autor** | Da un motivo, y es el que sostiene el autor según la ficha. |
| **Usa bien los conceptos** | Usa los conceptos con precisión, sin confundir conceptos vecinos. |
| **Se entiende sin ambigüedad** | Alguien que no sabe del tema lo entendería; no se contradice ni deja dos lecturas. |

Con 3 o 4 chequeos la explicación cuenta como clara. Para el mapa: letra correcta, seguro y clara es **dominado**; letra correcta sin seguridad o poco clara es **frágil**; letra incorrecta (o imposible de deducir) con seguridad es **punto ciego**, y sin seguridad es **laguna**.

**Estructura del feedback** (siempre en este orden, corto y para leer en el celular)
1. **Qué habría marcado**: "Con tu explicación marcabas la C" y si es la correcta, con la parte de su explicación que lleva a esa letra.
2. **Claridad**: los cuatro chequeos.
3. **Lo que explicaste bien**: una línea concreta, no "¡muy bien!".
4. **Qué te faltó**: qué confundió o qué agregar, con el tipo de error ("Confundiste gobierno con régimen").
5. **El razonamiento correcto**: 2 o 3 líneas, apoyadas en la afirmación del autor.
6. **Así lo explicarías más claro**: su misma explicación reescrita bien, en primera persona y con su estilo.
7. **Para reforzar**: la pregunta guía y el recurso de UBA XXI.
8. **Así estaba en el examen**: las opciones reales, con la letra que se deduce de su explicación y la correcta.

**Reglas para la IA**
- Evalúa contra la ficha de la afirmación. Si la explicación es razonable pero no es lo que dice el autor, lo marca con claridad: *"Puede tener sentido, pero en el examen cuenta lo que dice Romero."*
- No inventa citas, capítulos, páginas ni videos. Si algo no está en la ficha, no existe.
- En las explicaciones dictadas no penaliza muletillas, repeticiones ni errores de transcripción en nombres propios: evalúa la idea.
- Habla como un tutor rioplatense, de vos y en segunda persona, cercano y directo. Corrige el razonamiento, no a la persona.
- Ortografía y redacción no se corrigen, salvo que impidan entender la idea. La claridad sí: es lo que se califica.

---

## 4. ¿Qué tan preparado estoy?

**Nota estimada.** Se calcula por afirmación, ponderando el dominio por la frecuencia en el examen. Se muestra **como un rango, no como un número**: "Hoy estás entre 5 y 6,5".

**Lo que ve el alumno**

```
Aprobar (4)       ████████████░░░  probable
Promocionar (7)   ██████░░░░░░░░░  todavía no
Lo que más te acerca a promocionar: 3 puntos ciegos de Romero (1973–1976)
```

**Simulacro**: lo único que se parece de verdad al día del examen.
- 18 consignas, 1:30 h, sin pistas, sin explicación y sin feedback hasta el final.
- Al terminar: la nota, el mapa actualizado y la comparación con el último simulacro.
- Se habilita cuando cubrió todas las afirmaciones al menos una vez. Lo recomendamos 2 o 3 veces, espaciados, antes del parcial.

**Promoción.** Como se promociona con un promedio de 7 en los dos parciales, después del 1er parcial el alumno carga su nota real y la app le dice qué necesita en el 2do: *"Te sacaste 6. Para promocionar necesitás un 8."*

---

## 5. Qué hay que construir del lado del contenido

El circuito es `input/` (exámenes) → `rules/` (fichas y reglas) → `output/` (app).

1. **Juntar** los exámenes por materia y cátedra (en curso: índice de Arrimo en `input/`).
2. **Sacar duplicados**: los temas de un mismo examen son la misma pregunta mezclada.
3. **Extraer las claves**: los PDF de Arrimo traen la grilla completada (2025 en adelante) o la opción correcta resaltada en amarillo (2024 y antes); `scripts/extraer_examen.py` lee las dos. Hay que **validarlas**, porque no son oficiales: cruzar temas y cuatrimestres ayuda, porque la misma idea tiene que dar la misma respuesta.
4. **Etiquetar** cada pregunta: afirmación, tipo de consigna y tipo de error de cada distractor.
5. **Medir la frecuencia** entre cuatrimestres: qué afirmaciones se repiten siempre.
6. **Escribir las fichas de afirmación** a partir de la bibliografía de la cátedra.
7. **Asignar a cada ficha** el video o recurso de UBA XXI que le corresponde.
8. **Armar preguntas propias** para la práctica (variantes, reformulaciones). Los exámenes reales quedan para el diagnóstico y los simulacros.

---

## 6. Decisiones abiertas y riesgos

| Tema | Qué hay que resolver |
|---|---|
| **IPC primero** | Solo vimos ICSE. IPC probablemente pregunta lógica y argumentación, donde "explicar el proceso" pesa todavía más. Antes de escribir sus reglas hay que leer exámenes reales de IPC. |
| **Videos del campus** | Están detrás de login. Alguien con cuenta tiene que relevarlos y asignarlos a las fichas. ¿Los links profundos funcionan para cualquier alumno logueado? |
| **Cátedras** | Cada cátedra tiene su propio banco y su bibliografía. El MVP va con **una cátedra por materia** (en ICSE, Pedrosa: es la de 1er y 2do parcial y la que tiene más material). |
| **Derechos** | Los exámenes son de la UBA y están recopilados por terceros. Los usamos como referencia y para armar preguntas propias. No republicamos los PDF. |
| **Nombre** | El programa se llama "UBA XXI" (sin S). Además, usar "UBA" en la marca de un producto pago puede traer problemas con la Universidad. Conviene revisarlo antes de diseñar la marca. |
| **Fricción** | Escribir explicaciones en el celular cansa. Resuelto en local con el dictado (Whisper en la máquina). Para la app publicada hay que decidir dónde se transcribe. |
| **Claves erróneas** | Si una clave de Arrimo está mal, la IA "corrige" al alumno con algo falso. Cada clave se valida antes de entrar al banco. |

## 7. Cómo validamos con alumnos reales

Antes de agregar materias, con un grupo chico de ICSE o IPC:
- **¿La nota estimada predice la real?** Comparamos el último simulacro con la nota del parcial.
- **¿Se cierran los puntos ciegos?** Qué porcentaje de 🔴 pasa a 🟢 y sigue en 🟢 una semana después.
- **¿Explican de verdad?** El puntaje de comprensión promedio sube con las sesiones.
- **¿Vuelven?** Sesiones por semana en las 3 semanas previas al parcial.
- **¿Lo pagarían?** Recién después de que vieron su mapa y su nota estimada.
