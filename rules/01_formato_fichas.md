# Formato de las fichas de afirmación

Cada materia y cátedra tiene su carpeta en `rules/<materia>/<cátedra>/` con dos archivos:

| Archivo | Qué es | Quién lo escribe |
|---|---|---|
| `banco_preguntas.yaml` | Las preguntas únicas de los exámenes reales, con sus versiones, la clave y dónde se tomó cada una. | `scripts/armar_banco.py`. No se edita a mano. |
| `fichas_afirmacion.yaml` | Las fichas: qué hay que saber, qué trampas pone el examen y cómo se explica. Cada ficha apunta a sus preguntas del banco. | A mano, y después se revisa contra la bibliografía. |

`scripts/validar_fichas.py` comprueba que toda pregunta del banco tenga su ficha y calcula cuántas veces se tomó cada ficha.

## Campos de una ficha

```yaml
- id: romero.rodrigazo-1975          # <autor>.<tema-corto>, único en la cátedra
  eje: historia                      # conceptos | historia | videos
  autor: Luis A. Romero
  fuente: Breve historia contemporánea de la Argentina (capítulo pendiente)
  tema: El Rodrigazo (1975)
  afirmacion: >                      # la idea en 1 o 2 líneas, como la sostiene el autor
    ...
  puntos:                            # lo que el examen da por VERDADERO, una idea por línea
    - ...
  trampas:                           # lo que el examen da por FALSO
    - texto: ...                     # la opción falsa, resumida
      error: anacronismo             # uno de los tipos de error de abajo
      por_que: ...                   # una línea: por qué está mal
  pregunta_guia: ...                 # qué buscar al leer o mirar el video
  explicacion_modelo: >              # una explicación de nivel 3 (ver la rúbrica en 00_modelo_de_aprendizaje.md)
    ...
  recurso_ubaxxi: pendiente          # unidad, título, link y minuto del recurso del campus
  preguntas: [q-805de77b, q-85b635b6]
  estado: borrador                   # borrador | revisada | validada
  notas: ...                         # opcional: dudas, cosas para validar
```

**Reglas de contenido**
- `puntos` y `trampas` salen de los exámenes: lo que la clave da por correcto o incorrecto. No se agregan "verdades" que el examen no evaluó.
- `por_que` y `explicacion_modelo` pueden usar hechos firmes (fechas, nombres, cargos) para explicar el error. Si algo no es seguro, se escribe en `notas` para validarlo, nunca se afirma.
- No se inventan citas, capítulos ni páginas. Mientras no esté identificado, `fuente` dice "pendiente".
- La ficha refleja la postura de la cátedra. Si el examen dice algo discutible, la ficha lo enseña igual y lo anota en `notas`.
- Estado `borrador` hasta que alguien la contraste con el texto del autor.

## Tipos de error

Es el mismo vocabulario que usa el mapa del alumno ("confundís Estado con gobierno").

| Código | Qué hace la opción falsa | Ejemplo del examen |
|---|---|---|
| `concepto_vecino` | Confunde dos conceptos parecidos. | Democracia directa ↔ representativa; populismo ↔ fascismo. |
| `cambio_de_palabra` | Repite la frase correcta con una palabra clave cambiada o invertida. | "sociedad secularizada" → "volcada a la izquierda"; Estado ↔ gobierno. |
| `anacronismo` | Pone un hecho, actor o término en otra época. | Videla gobernando en 1975; el kirchnerismo en 1987. |
| `hecho_equivocado` | Atribuye un hecho, lugar o actor que no corresponde. | El Rodrigazo como protesta agraria en Santa Fe. |
| `dato_inventado` | Agrega algo plausible que el texto no dice. | Las Pymes como actor de la nación; el Partido Comunista soviético en 1975. |
| `absoluto_falso` | Generaliza con "nunca", "siempre", "solo" o "necesariamente". | "La autoridad del presidente nunca fue discutida". |
| `motivo_equivocado` | En verdadero/falso, el veredicto está bien pero el motivo no. | "Es falso, porque el populismo no reconoce fronteras". |
| `media_verdad` | Arranca con algo cierto y concluye algo falso. | "Es el derecho a tener derechos, por eso es un área de consensos". |
| `verdad_general` | Suena razonable, pero no es lo que sostiene el autor. | Una explicación económica donde el autor da una histórica. |
