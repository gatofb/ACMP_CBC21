// Servidor de PrepTest UBA XXI: sirve la app y guarda la clave de Claude y las claves del examen
// del lado del servidor. El navegador nunca recibe la respuesta correcta antes de responder.
//
// Uso: npm start   (lee output/.env)

import { readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { DictadoError, dictadoDisponible, transcribir } from "./dictado.mjs";
import { evaluarExplicacion, modelo, proveedor, TutorError } from "./tutor.mjs";
// Catálogo, preguntas, sesiones y corrección con la clave: en banco.mjs, compartido con el MCP.
import { buscar, catalogo, corregir, fichaEn, materia, materias, pideOpciones, responder, sesion, versionEn } from "./banco.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
try {
  process.loadEnvFile(join(AQUI, ".env"));
} catch {
  // Sin .env la app funciona igual; solo la evaluación con Claude queda apagada.
}

const PUERTO = Number(process.env.PORT || 4321);
// En la máquina solo se atiende a esta computadora; en la nube va HOST=0.0.0.0 (lo pone el Dockerfile).
const HOST = process.env.HOST || "127.0.0.1";
const PUBLICO = join(AQUI, "public");
// Explainer Mode: el alumno explica sin opciones y Claude deduce qué habría marcado. Si la pregunta
// pide ver las opciones, el alumno elige una y explica por qué; se corrige lo que eligió.
async function explicar(datos) {
  const { m, pregunta, version, ficha } = buscar(datos);
  const explicacion = String(datos.explicacion || "").trim();
  if (explicacion.length < 10) throw new TutorError("Explicá un poco más para que se pueda evaluar.", 400);
  if (!proveedor()) {
    throw new TutorError("El tutor de IA no está conectado: pegá la clave de la API en output/.env o iniciá la sesión local (ver output/README.md).", 503);
  }
  const eleccion = pideOpciones(pregunta, version) && Object.hasOwn(version.opciones, datos.eleccion) ? datos.eleccion : null;
  const idioma = datos.idioma === "en" ? "en" : "es";
  const en = idioma === "en" ? versionEn(m, pregunta, datos.version) : null;
  const evaluacion = await evaluarExplicacion({
    materia: `${m.nombre} (${m.etiqueta})`, ficha, version, tipo: pregunta.tipo, explicacion, eleccion,
    seguridad: datos.seguridad, intento: datos.intento, dictada: Boolean(datos.dictada), idioma, versionEn: en,
  });
  // La explicación se convierte en la respuesta que habría dado, y se corrige igual que en el diagnóstico.
  const inferida = eleccion || (evaluacion.respuesta_inferida in version.opciones ? evaluacion.respuesta_inferida : null);
  const juicios = Object.fromEntries((evaluacion.juicios || []).filter((j) => j.juicio !== "no_dice")
    .map((j) => [j.letra, j.juicio === "verdadera" ? "V" : "F"]));
  const r = {
    eleccion: pregunta.tipo === "multiple" ? Object.keys(juicios).filter((l) => juicios[l] === "V") : inferida,
    marcas: juicios,
    huecos: evaluacion.huecos,
  };
  return {
    correcta: corregir(pregunta, version, r),
    respuesta_inferida: inferida,
    clave: version.clave,
    huecos: version.huecos?.map((h) => h.clave),
    explicacion_examen: version.explicacion,
    pregunta_guia: ficha.pregunta_guia,
    recurso_ubaxxi: ficha.recurso_ubaxxi,
    en: { pregunta_guia: fichaEn(m, ficha)?.pregunta_guia || ficha.pregunta_guia,
      explicacion_examen: versionEn(m, pregunta, datos.version)?.explicacion || version.explicacion },
    evaluacion,
  };
}

async function leerAudio(req) {
  const partes = [];
  let total = 0;
  for await (const parte of req) {
    total += parte.length;
    if (total > 25 * 1024 * 1024) throw new DictadoError("El audio es demasiado largo: probá con menos de 5 minutos.", 413);
    partes.push(parte);
  }
  return Buffer.concat(partes);
}

const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp",
  ".mp4": "video/mp4", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };

// Los mensajes de error en inglés, para quien usa la app en inglés (se reconocen por cómo empiezan).
const ERRORES_EN = [
  ["Esa materia todavía no está disponible", "That subject isn't available yet."],
  ["Pregunta inválida", "Invalid question."],
  ["Opción inválida", "Invalid option."],
  ["Explicá un poco más", "Explain a bit more so it can be assessed."],
  ["El tutor de IA no está conectado", "The AI tutor isn't connected: add the API key to output/.env or start the local session (see output/README.md)."],
  ["El audio es demasiado largo", "The recording is too long: try under 5 minutes."],
  ["La respuesta es demasiado larga", "The answer is too long."],
  ["Pedido inválido", "Invalid request."],
  ["El tutor tardó demasiado", "The tutor took too long to answer. Try again."],
  ["La clave de la API del tutor no es válida", "The tutor's API key isn't valid. Check output/.env."],
  ["El tutor está recibiendo demasiados pedidos", "The tutor is getting too many requests. Try again in a few seconds."],
  ["El tutor no pudo evaluar esta respuesta", "The tutor couldn't assess this answer. Try rephrasing your explanation."],
  ["La respuesta del tutor llegó incompleta", "The tutor's answer came back incomplete. Try again."],
  ["El tutor no", "The tutor couldn't answer. Try again in a moment."],
  ["No se pudo", "Something went wrong. Try again in a moment."],
  ["Error", "The tutor had an error. Try again in a moment."],
  ["El dictado no está disponible", "Dictation isn't available on this server."],
  ["No llegó audio", "No audio arrived."],
  ["Whisper no pudo", "Whisper couldn't transcribe the audio. Try again."],
  ["No encontrado", "Not found."],
];
function mensajeDeError(mensaje, idioma) {
  if (idioma !== "en") return mensaje;
  return ERRORES_EN.find(([es]) => mensaje.startsWith(es))?.[1] || mensaje;
}

// Archivos de public/. El video se sirve por partes (Range), que es lo que pide Safari para reproducirlo.
async function servirArchivo(req, res, ruta) {
  const tipo = TIPOS[extname(ruta)] || "application/octet-stream";
  const { size } = await stat(ruta);
  const rango = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
  if (rango && (rango[1] || rango[2])) {
    const inicio = rango[1] ? Number(rango[1]) : Math.max(0, size - Number(rango[2]));
    const fin = rango[1] && rango[2] ? Math.min(Number(rango[2]), size - 1) : size - 1;
    if (inicio > fin || inicio >= size) {
      res.writeHead(416, { "content-range": `bytes */${size}` });
      return res.end();
    }
    res.writeHead(206, { "content-type": tipo, "content-range": `bytes ${inicio}-${fin}/${size}`,
      "accept-ranges": "bytes", "content-length": fin - inicio + 1 });
    return createReadStream(ruta, { start: inicio, end: fin }).pipe(res);
  }
  res.writeHead(200, { "content-type": tipo, "accept-ranges": "bytes", "content-length": size });
  res.end(await readFile(ruta));
}

function json(res, status, cuerpo) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(cuerpo));
}

async function leerCuerpo(req) {
  // En Vercel el cuerpo suele llegar ya leído en req.body; si no, se lee del pedido como en local.
  if (process.env.VERCEL) {
    let cuerpo;
    try {
      cuerpo = req.body;
      if (Buffer.isBuffer(cuerpo) || typeof cuerpo === "string") cuerpo = JSON.parse(String(cuerpo) || "{}");
    } catch {
      throw new TutorError("Pedido inválido.", 400);
    }
    if (cuerpo !== undefined) {
      if (JSON.stringify(cuerpo).length > 20000) throw new TutorError("La respuesta es demasiado larga.", 413);
      return cuerpo ?? {};
    }
  }
  let texto = "";
  for await (const parte of req) {
    texto += parte;
    if (texto.length > 20000) throw new TutorError("La respuesta es demasiado larga.", 413);
  }
  try {
    return JSON.parse(texto || "{}");
  } catch {
    throw new TutorError("Pedido inválido.", 400);
  }
}

export const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname === "/api/estado") {
      return json(res, 200, { ia: proveedor(), modelo: modelo(), dictado: await dictadoDisponible() });
    }
    if (url.pathname === "/api/transcribir" && req.method === "POST") {
      const m = materia(url.searchParams.get("materia"));
      const idioma = url.searchParams.get("idioma") === "en" ? "en" : "es";
      return json(res, 200, { texto: await transcribir(await leerAudio(req), m.glosario, idioma) });
    }
    if (url.pathname === "/api/explicar" && req.method === "POST") {
      return json(res, 200, await explicar(await leerCuerpo(req)));
    }
    if (url.pathname === "/api/catalogo") {
      return json(res, 200, catalogo.carreras.map((c) => ({
        ...c,
        materias: c.materias.map(({ reglas, ...m }) => {
          const cargada = materias.get(m.id);
          return cargada
            ? { ...m, disponible: true, etiqueta: cargada.etiqueta, en: { ...m.en, etiqueta: cargada.etiqueta_en },
              fichas: cargada.fichas.length, preguntas: cargada.banco.length,
              apariciones: cargada.banco.reduce((n, q) => n + q.veces_tomada, 0), cuatrimestres: cargada.cuatrimestres }
            : { ...m, disponible: false };
        }),
      })));
    }
    if (url.pathname === "/api/fichas") {
      const m = materia(url.searchParams.get("materia"));
      return json(res, 200, m.fichas.map((f) => {
        const en = fichaEn(m, f);
        return { id: f.id, eje: f.eje, tema: f.tema, autor: f.autor, veces: m.vecesPorFicha.get(f.id),
          en: en ? { tema: en.tema, autor: en.autor } : undefined };
      }));
    }
    if (url.pathname === "/api/sesion") {
      const pedidas = (url.searchParams.get("fichas") || "").split(",").filter(Boolean);
      return json(res, 200, sesion(materia(url.searchParams.get("materia")), url.searchParams.get("modo"), pedidas));
    }
    if (url.pathname === "/mcp" || url.pathname === "/api/mcp") {
      // El MCP en línea, como en Vercel. Se carga recién acá para no sumar el SDK a las otras rutas.
      const { atenderMcp } = await import("./mcp-http.mjs");
      return await atenderMcp(req, res, req.method === "POST" ? await leerCuerpo(req) : undefined);
    }
    if (url.pathname === "/api/responder" && req.method === "POST") {
      return json(res, 200, responder(await leerCuerpo(req)));
    }

    // La presentación vive en presentation-v3/ (en Vercel se copia a public al publicar; acá se sirve de su carpeta).
    if (url.pathname === "/presentation-v3") {
      res.writeHead(302, { location: "/presentation-v3/" });
      return res.end();
    }
    if (url.pathname.startsWith("/presentation-v3/")) {
      const base = join(AQUI, "..", "presentation-v3");
      const pedida = decodeURIComponent(url.pathname.slice("/presentation-v3/".length)) || "index.html";
      const archivo = normalize(join(base, pedida));
      if (!archivo.startsWith(base)) return json(res, 403, { error: "Ruta no permitida." });
      return await servirArchivo(req, res, archivo);
    }
    const ruta = normalize(join(PUBLICO, url.pathname === "/" ? "index.html" : url.pathname));
    if (!ruta.startsWith(PUBLICO)) return json(res, 403, { error: "Ruta no permitida." });
    return await servirArchivo(req, res, ruta);
  } catch (error) {
    const idioma = req.headers["x-idioma"] === "en" ? "en" : "es";
    if (error instanceof TutorError || error instanceof DictadoError) {
      return json(res, error.status, { error: mensajeDeError(error.message, idioma) });
    }
    if (error.code === "ENOENT") return json(res, 404, { error: mensajeDeError("No encontrado.", idioma) });
    console.error(error);
    json(res, 500, { error: "Error inesperado del servidor." });
  }
});

// En Vercel no se escucha en un puerto: cada función de api/ le pasa su pedido a este servidor.
if (!process.env.VERCEL) servidor.listen(PUERTO, HOST, () => {
  console.log(`PrepTest UBA XXI en http://${HOST === "127.0.0.1" ? "localhost" : HOST}:${PUERTO}`);
  const via = { api: `API con ${modelo()}`, sesion: `tu sesión del CLI claude (${modelo()})` }[proveedor()];
  for (const m of materias.values()) console.log(`${m.etiqueta}: ${m.fichas.length} fichas, ${m.banco.length} preguntas`);
  console.log(`Claude: ${via || "no disponible"}`);
  dictadoDisponible().then((ok) => console.log(`Dictado: ${ok ? "whisper.cpp local" : "no disponible"}`));
});
