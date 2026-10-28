# Formato de extracción de exámenes

Los exámenes de Arrimo (texto con grilla o con resaltado) los extrae `scripts/extraer_examen.py`. Los que no tienen ese formato se transcriben a mano o con la IA leyendo las páginas: imágenes escaneadas de Altillo, impresiones del campus o documentos de Word. En ese caso, cada PDF lleva al lado un `.json` con el mismo nombre y el formato de abajo, y `scripts/armar_banco.py` usa ese archivo en lugar del PDF.

```
input/Abogacia/Sociologia/Catedra A Bustos - Final/Final_2022_A.pdf
input/Abogacia/Sociologia/Catedra A Bustos - Final/Final_2022_A.json   ← transcripción
```

## Campos

```json
{
  "archivo": "Final_2022_A.pdf",
  "materia": "Sociología (14)",
  "catedra": "A · Bustos",
  "instancia": "Final",
  "fecha": "2022-02-17",
  "periodo": "Final 02/2022",
  "turno": "3er turno",
  "tema": 6,
  "fuente_clave": "marcas",
  "consignas": [ ... ],
  "dudas": ["consigna 4: no se ve bien qué opción está marcada"]
}
```

- `fecha`: si figura en el encabezado; si no, `null`.
- `periodo`: cómo se muestra en el banco. Para finales es `"Final MM/AAAA"`, o `"Final AAAA"` si solo se sabe el año.
- `fuente_clave`: de dónde sale la respuesta correcta.
  - `campus`: impresión del campus con "La respuesta correcta es…". Es confiable.
  - `marcas`: cruces o respuestas escritas en el examen. Pueden ser las de un alumno, así que hay que validarlas.
  - `explicaciones`: el examen trae la explicación de cada respuesta.
  - `sin_clave`: no se sabe la respuesta.
- `dudas`: todo lo que no se pudo leer con seguridad. Nunca se inventa una clave: si no se ve, la consigna va igual, sin `clave`, y se anota la duda.

## Tipos de consigna

Cada consigna lleva `n` (su número en el examen), `puntos` (o `null`), `tipo` y `enunciado`, más los campos de su tipo:

| `tipo` | Qué es | Campos | `clave` |
|---|---|---|---|
| `simple` | Marcar la única opción correcta. | `opciones`: `{"A": "...", "B": "..."}`, con letras en orden aunque el examen use números o viñetas. | `"C"` |
| `multiple` | Marcar todas las opciones correctas. | `opciones` | `["A", "C"]` |
| `vf_items` | Indicar si cada afirmación es verdadera o falsa. | `opciones`: las afirmaciones | `{"A": "V", "B": "F"}` |
| `vf_justificada` | Verdadero/falso con el motivo en la opción ("Es verdadero, porque…"). | `opciones` | `"B"` |
| `relacionar` | Poner el autor que corresponde a cada concepto. | `autores`: la lista que da el examen; `pares`: `[{"concepto": "...", "autor": "..."}]`. Si el examen no muestra la respuesta, `autor` va en `null`. | (va en `pares`) |
| `completar` | Completar la frase eligiendo una palabra por hueco. | El `enunciado` marca cada hueco con `___`; `huecos`: `[{"opciones": ["..."], "clave": "..."}]`, en orden. | (va en cada hueco) |
| `desarrollo` | Pregunta abierta. | `respuesta_modelo`, si el examen la trae. | — |

- El texto se copia tal cual, con sus tildes, sin corregir y sin resumir. Si el examen dice "Según Heller…", eso queda en el enunciado.
- **Opciones numeradas** (1, 2, 3… como en IPC): pasan a letras en el mismo orden (1 = A, 2 = B…), y la clave de la grilla se traduce igual.
- **Ejercicios con partes** ("A: determine si es deductivo o inductivo", "B: seleccione la justificación"): cada casillero de la grilla es una consigna propia, con `n` como `"2A"` y `"2B"`. Si la respuesta de una parte es una letra o una sigla (D/I, V/F), las opciones se escriben completas: `{"A": "Deductivo (D)", "B": "Inductivo (I)"}`.
- **Consignas que se apoyan en otra** ("el argumento del ejercicio 1", "el caso anterior"): el enunciado lleva copiado ese material, para que la pregunta se entienda sola.
- **Explicación oficial**: si el examen trae debajo de cada ejercicio por qué la respuesta es la correcta (como los resueltos de la Cátedra Buacar de IPC), va en `explicacion` de cada consigna que explica, y `fuente_clave` es `explicaciones`.
- `explicacion`: si el examen trae por qué una respuesta es la correcta, va acá, en cualquier tipo.
- En `relacionar` y `completar` cada par y cada hueco es una idea: `armar_banco.py` separa cada par en una pregunta propia ("¿A qué autor corresponde…?") para que cada una tenga su ficha.
