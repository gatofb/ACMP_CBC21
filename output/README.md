# PrepTest UBA XXI — app

Capa de entrenamiento para el 1er parcial de ICSE (Cátedra Pedrosa). Lee las preguntas y las fichas de `rules/ICSE/Pedrosa/` y aplica el modelo de `rules/00_modelo_de_aprendizaje.md`.

- **Diagnóstico:** 18 preguntas reales con la seguridad del alumno y sin feedback. Arma el mapa: dominado, frágil, laguna y punto ciego. No usa Claude.
- **Práctica (Explainer Mode):** 5 preguntas, empezando por los puntos ciegos. No hay opciones: el alumno explica, escrito o dictado. Claude lee la explicación contra la ficha, le dice qué habría marcado en el examen y le califica la claridad con cuatro chequeos. Después el alumno puede volver a explicarla.
- **Dictado:** en local, el navegador graba y el servidor transcribe en la máquina con whisper.cpp; el audio no sale de la computadora. Online no hay Whisper y dicta el navegador (Chrome, Edge o Safari).

La clave de la API y las respuestas correctas quedan en el servidor; el navegador recibe la clave de una pregunta recién después de responderla. El mapa del alumno se guarda en su navegador.

## Cómo levantarla

```bash
cd "/Users/gastonfb/Dev_Apps/MaiPistinerTool/CBC Preptest/output" && npm install && cp .env.example .env
```

Si vas a usar la API, pegá la clave en `output/.env`; si no, usa tu sesión del CLI `claude`. Después:

```bash
cd "/Users/gastonfb/Dev_Apps/MaiPistinerTool/CBC Preptest/output" && npm start
```

Queda en http://localhost:4321.

Para probar la conexión con Claude sin abrir la app (hace dos pedidos; por la API tienen costo y por la sesión consumen tu uso):

```bash
cd "/Users/gastonfb/Dev_Apps/MaiPistinerTool/CBC Preptest/output" && npm run probar-ia
```

## Cómo llega a Claude

- **Por tu sesión (modo local):** si no hay clave en `.env`, el servidor llama al CLI `claude` de esta máquina en modo aislado: sin herramientas, sin CLAUDE.md, MCP ni hooks, y sin guardar la sesión. Usa tu suscripción, así que sirve para probar vos; para darle servicio a alumnos hace falta la API.
- **Por la API:** con `ANTHROPIC_API_KEY` en `.env`. Los pedidos usan el respaldo automático de la API (`fallbacks: "default"`): si el modelo rechaza un pedido, la API lo reintenta con otro modelo.

## Publicarla en la nube

En la nube la app usa siempre la API: la sesión del CLI es tu suscripción personal y no puede atender a otros alumnos.

- **Imagen:** el [Dockerfile](../Dockerfile) está en la carpeta `CBC Preptest`, no en `output/`, porque el servidor lee las preguntas de `rules/`. La imagen lleva solo `rules/` y `output/`, sin `input/`, sin `.env` y sin `node_modules`. Cualquier servicio que construya desde un Dockerfile sirve (Cloud Run, Railway, Render, Fly).
- **Clave:** `ANTHROPIC_API_KEY` se carga como variable de entorno (o secreto) en el panel del servicio. Nunca va en el repo ni en la imagen: el repo es público.
- **Qué fija la imagen:** `HOST=0.0.0.0` para recibir pedidos de afuera, `PORT=8080` (si el servicio pone otro `PORT`, gana el suyo) y `TUTOR_PROVIDER=api`.
- **Dictado:** whisper.cpp no está en la imagen, así que en la nube dicta el navegador del alumno (Web Speech API, en `es-AR`). En Chrome el audio pasa por Google; en Edge, por Microsoft; en Safari, por Apple. En Firefox no hay dictado y el alumno escribe (D-032).
- **Gasto:** la app no tiene clave de acceso ni límite de pedidos, así que cualquiera con el link puede usarla. Conviene una clave de API solo para la app, con tope de gasto en la consola de Anthropic.

### En Vercel

Vercel no usa el Dockerfile. Usa [vercel.json](../vercel.json) y la carpeta [api/](../api) de `CBC Preptest`:

- **Páginas:** las sirve Vercel directo desde `output/public/`.
- **`/api/...`:** cada ruta es una función de Vercel (`api/estado.mjs`, `api/explicar.mjs`, etc.) que le pasa el pedido al mismo `server.mjs`. Las funciones llevan `rules/` y tienen hasta 60 segundos por pedido, para que el tutor alcance a evaluar.
- **Cómo publicarla:** en Vercel, importar el repo `gatofb/ACMP_CBC21` y dejar *Root Directory* vacío, porque `CBC Preptest` ya es la raíz del repo. No hace falta tocar el framework ni los comandos: los fija `vercel.json`. En *Settings → Build and Deployment* no tiene que haber nada pisado (Framework *Other*, sin Output Directory propio).
- **Variables:** solo `ANTHROPIC_API_KEY`, en *Settings → Environment Variables*. `CLAUDE_MODEL` y `CLAUDE_EFFORT` son opcionales.
- **Qué sube:** [.vercelignore](../.vercelignore) deja pasar solo `api/`, `output/` y `rules/`, sin `.env` ni `node_modules`.
- **Dependencias:** Vercel las instala con el [package.json](../package.json) de la raíz, porque las funciones no ven las de `output/`. Repite las de `output/package.json`: si cambian ahí, se cambian en los dos.
- **Dictado:** Whisper tampoco está en Vercel; dicta el navegador, como en la nube.

## Configuración (`.env`)

| Variable | Por defecto | Para qué |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Clave de la API de Claude. Si está, se usa la API. |
| `TUTOR_PROVIDER` | automático | `api` o `sesion`, para forzar un camino. |
| `CLAUDE_MODEL` | `claude-opus-5-5` por la API; el del CLI por la sesión | Modelo que evalúa. Claude Opus 5.5 por la sesión necesita el CLI 2.1.280 o más nuevo. |
| `CLAUDE_EFFORT` | `low` | `low`, `medium` o `high`. Más alto es más preciso, pero más lento y caro. |
| `CLAUDE_CLI` | `claude` | Ruta al CLI, si no está en el PATH. |
| `WHISPER_CLI` | `whisper-cli` | Ejecutable de whisper.cpp para el dictado. |
| `WHISPER_MODEL` | `~/models/ggml-large-v3-turbo-q5_0.bin` | Modelo de whisper.cpp. |
| `FFMPEG` | `ffmpeg` | Para pasar el audio del navegador a WAV de 16 kHz. |
| `PORT` | `4321` | Puerto donde escucha. |
| `HOST` | `127.0.0.1` | Desde dónde acepta conexiones. Local: solo esta computadora. En la nube: `0.0.0.0`. |
