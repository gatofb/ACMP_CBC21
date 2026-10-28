# PrepTest UBA XXI — app

Capa de entrenamiento para el 1er parcial de ICSE (Cátedra Pedrosa). Lee las preguntas y las fichas de `rules/ICSE/Pedrosa/` y aplica el modelo de `rules/00_modelo_de_aprendizaje.md`.

- **Diagnóstico:** 18 preguntas reales con la seguridad del alumno y sin feedback. Arma el mapa: dominado, frágil, laguna y punto ciego. No usa Claude.
- **Práctica (Explainer Mode):** 5 preguntas, empezando por los puntos ciegos. No hay opciones: el alumno explica, escrito o dictado. Claude lee la explicación contra la ficha, le dice qué habría marcado en el examen y le califica la claridad con cuatro chequeos. Después el alumno puede volver a explicarla.
- **Dictado:** el navegador graba y el servidor transcribe en la máquina con whisper.cpp; el audio no sale de la computadora.

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
| `PORT` | `4321` | Puerto local. |
