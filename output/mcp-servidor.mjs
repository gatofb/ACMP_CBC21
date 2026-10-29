// Las herramientas del MCP de PrepTest, compartidas por la versión local (mcp.mjs, por stdio) y la
// en línea (mcp-http.mjs, en /mcp). La app pone la estructura (catálogo, preguntas, clave, fichas y
// mapa) y el razonamiento lo hace el asistente de IA de quien lo usa: no se llama a la API.
//
// En línea no hay memoria entre pedidos, así que la sesión y el mapa viajan en dos códigos:
//   - sesion: la sesión en curso (materia, modo, preguntas, por cuál va, aciertos y el mapa). Cada
//     respuesta trae el código nuevo y el asistente lo pasa en la siguiente.
//   - mapa: el progreso del alumno en una materia ("ipc:1a2b3d.4c5d6f…"), para seguir otro día.
// En local, el mapa además se guarda en ~/.preptest/mapa.json (o en PREPTEST_MAPA).

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { buscar, catalogo, fichaEn, materia, materias, paraElAlumno, responder, sesion, versionEn } from "./banco.mjs";

const ESTADOS = ["ciego", "laguna", "fragil", "dominado"];
const LETRA_ESTADO = { ciego: "c", laguna: "l", fragil: "f", dominado: "d" };
const ESTADO_LETRA = Object.fromEntries(Object.entries(LETRA_ESTADO).map(([e, l]) => [l, e]));
const ORDEN_PRACTICA = ["ciego", "laguna", "fragil", undefined, "dominado"];
const MODOS = { practica: "p", demo: "q", diagnostico: "d" };
const MODO_LETRA = Object.fromEntries(Object.entries(MODOS).map(([m, l]) => [l, m]));

// Cada idea se nombra en el código con 5 letras de su huella; no se repiten en ninguna materia.
const huella = (texto, n) => createHash("sha1").update(texto).digest("hex").slice(0, n);
const codigoDeFicha = new Map();
const fichaDeCodigo = new Map();
for (const m of materias.values()) {
  const porCodigo = new Map();
  for (const f of m.fichas) {
    const c = huella(f.id, 5);
    if (porCodigo.has(c)) throw new Error(`Dos ideas de ${m.id} comparten el código ${c}`);
    porCodigo.set(c, f.id);
    codigoDeFicha.set(`${m.id}/${f.id}`, c);
  }
  fichaDeCodigo.set(m.id, porCodigo);
}

// ---------- el mapa ----------

// "ipc:1a2b3d.4c5d6f" o varios separados por espacios, comas o punto y coma: se toma el de la materia.
function mapaDeCodigo(materiaId, codigo) {
  const parte = String(codigo || "").split(/[\s,;]+/).find((p) => p.startsWith(`${materiaId}:`));
  const mapa = {};
  for (const e of (parte?.slice(materiaId.length + 1) || "").split(".").filter(Boolean)) {
    const fichaId = fichaDeCodigo.get(materiaId)?.get(e.slice(0, 5));
    if (fichaId && ESTADO_LETRA[e[5]]) mapa[fichaId] = { estado: ESTADO_LETRA[e[5]] };
  }
  return mapa;
}
const entradasDe = (materiaId, mapa) => Object.entries(mapa)
  .filter(([f, x]) => codigoDeFicha.has(`${materiaId}/${f}`) && LETRA_ESTADO[x.estado])
  .map(([f, x]) => codigoDeFicha.get(`${materiaId}/${f}`) + LETRA_ESTADO[x.estado]).join(".");

// En local el mapa también vive en un archivo, con el error y las veces que vio cada idea.
const ARCHIVO_MAPA = process.env.PREPTEST_MAPA || join(homedir(), ".preptest", "mapa.json");
function leerArchivo() {
  try { return JSON.parse(readFileSync(ARCHIVO_MAPA, "utf8")); } catch { return {}; }
}
function guardarEnArchivo(materiaId, fichaId, nuevo, error) {
  const mapas = leerArchivo();
  const mapa = mapas[materiaId] || {};
  const previo = mapa[fichaId] || { vistas: 0 };
  mapa[fichaId] = { estado: nuevo, error: error || null, vistas: previo.vistas + 1, fecha: Date.now() };
  mapas[materiaId] = mapa;
  mkdirSync(dirname(ARCHIVO_MAPA), { recursive: true });
  writeFileSync(ARCHIVO_MAPA, JSON.stringify(mapas, null, 1));
}

// Como en la app: bien y seguro (y bien explicado, si explicó) es dominado; mal y seguro, punto ciego.
function estadoDe(correcta, seguridad, bienExplicada = true) {
  if (correcta) return seguridad === "seguro" && bienExplicada ? "dominado" : "fragil";
  return seguridad === "seguro" ? "ciego" : "laguna";
}

// ---------- el código de la sesión ----------
// materia~modo~idioma~preguntas~índice~aciertos~mapa~control. Solo letras, números y . , ~ -

function codigoSesion(s) {
  const cuerpo = [s.materia, MODOS[s.modo], s.idioma, s.refs.map(([id, v]) => `${id.slice(2)}.${v}`).join(","),
    s.i, s.aciertos, entradasDe(s.materia, s.mapa)].join("~");
  return `${cuerpo}~${huella(cuerpo, 4)}`;
}
function leerSesion(codigo) {
  const partes = String(codigo || "").trim().split("~");
  const control = partes.pop();
  const cuerpo = partes.join("~");
  const [materiaId, modo, idioma, refs, i, aciertos = "", mapa = ""] = partes;
  if (partes.length !== 7 || huella(cuerpo, 4) !== control || !MODO_LETRA[modo]) {
    throw new Error("El código de la sesión no es válido: pasalo tal cual lo devolvió la última respuesta, o empezá otra sesión.");
  }
  const m = materia(materiaId);
  const s = {
    materia: materiaId, modo: MODO_LETRA[modo], idioma: idioma === "en" ? "en" : "es", i: Number(i), aciertos,
    refs: refs.split(",").map((r) => { const [id, v] = r.split("."); return [`q-${id}`, Number(v)]; }),
    mapa: mapaDeCodigo(materiaId, `${materiaId}:${mapa}`),
  };
  if (s.refs.some(([id, v]) => !m.preguntaPorId.get(id)?.versiones[v]) || !(s.i >= 0 && s.i < s.refs.length)) {
    throw new Error("Esa sesión ya no coincide con el banco de preguntas (puede haber cambiado): empezá otra.");
  }
  return s;
}

// ---------- textos ----------

const T = {
  es: {
    estado: { ciego: "Punto ciego", laguna: "Laguna", fragil: "Frágil", dominado: "Dominado", sin_ver: "Sin ver" },
    error: {
      concepto_vecino: "confundiste conceptos parecidos", cambio_de_palabra: "se te pasó una palabra cambiada",
      anacronismo: "ubicaste algo en otra época", hecho_equivocado: "atribuiste un hecho que no corresponde",
      dato_inventado: "aceptaste un dato que el texto no dice", absoluto_falso: "te convenció un \"siempre\" o un \"nunca\"",
      motivo_equivocado: "veredicto bien, motivo mal", media_verdad: "te quedaste con la mitad cierta",
      verdad_general: "respondiste con sentido común y no con el autor",
    },
    modo: { diagnostico: "Diagnóstico", demo: "Quick Demo", practica: "Práctica" },
  },
  en: {
    estado: { ciego: "Blind spot", laguna: "Gap", fragil: "Fragile", dominado: "Mastered", sin_ver: "Not seen" },
    error: {
      concepto_vecino: "you mixed up similar concepts", cambio_de_palabra: "you missed a changed word",
      anacronismo: "you placed something in the wrong period", hecho_equivocado: "you attributed the wrong fact",
      dato_inventado: "you accepted a fact the text doesn't state", absoluto_falso: "an \"always\" or a \"never\" convinced you",
      motivo_equivocado: "right verdict, wrong reason", media_verdad: "you settled for the half that's true",
      verdad_general: "you answered with common sense, not with the author",
    },
    modo: { diagnostico: "Diagnostic", demo: "Quick Demo", practica: "Practice" },
  },
};
const loc = (x, idioma) => (idioma === "en" && x?.en ? { ...x, ...x.en } : x);

// ---------- la pregunta, como la ve el alumno ----------

const COMBINACION = /^(?:Las opciones correctas son|The correct options are) (.*)/;
const combina = (texto) => { const m = String(texto).match(COMBINACION); return m ? (m[1].match(/\b[A-D]\b/g) || []).sort() : null; };
const tieneGrilla = (opciones) => Object.values(opciones).some((t) => combina(t));

function textoDe(p, idioma) {
  if (idioma !== "en" || !p.en) return { enunciado: p.enunciado, opciones: p.opciones, huecos: p.huecos, ficha: p.ficha };
  return { enunciado: p.en.enunciado, opciones: p.en.opciones, huecos: p.en.huecos || p.huecos, ficha: { ...p.ficha, ...p.en.ficha } };
}

function comoResponder(p) {
  if (p.tipo === "combinada" || tieneGrilla(p.opciones)) {
    return "Combinada: que juzgue A, B, C y D como verdaderas (V) o falsas (F); mandá `marcas` con las cuatro y PrepTest busca la letra de la grilla (E a H).";
  }
  if (p.tipo === "vf_items") return "Verdadero o falso por afirmación: mandá `marcas` con V o F para cada letra.";
  if (p.tipo === "multiple") return "Puede haber más de una correcta: mandá `eleccion` con la lista de letras.";
  if (p.tipo === "completar") return "Completar: mandá `huecos` con la palabra de cada hueco, en orden, elegida entre las opciones de ese hueco.";
  if (p.tipo === "vf_justificada") return "Verdadero o falso con el motivo: mandá `eleccion` con la letra.";
  return "Una sola correcta: mandá `eleccion` con la letra.";
}

function preguntaTexto(s) {
  const [id, v] = s.refs[s.i];
  const m = materia(s.materia);
  const p = paraElAlumno(m, m.preguntaPorId.get(id), v);
  const t = textoDe(p, s.idioma);
  const etiqueta = p.relacionar ? "Relacionar (el autor es la respuesta)" : `${t.ficha.autor} · ${t.ficha.tema}`;
  const puntos = p.puntos ? ` · ${p.puntos} ${s.idioma === "en" ? (p.puntos === 1 ? "point" : "points") : (p.puntos === 1 ? "punto" : "puntos")}` : "";
  const opciones = Object.entries(t.opciones).map(([l, o]) => `${l}. ${o}`).join("\n");
  const huecos = t.huecos?.length ? `\n${t.huecos.map((h, n) => `Hueco ${n + 1}: ${h.opciones.join(" / ")}`).join("\n")}` : "";
  // En el Explainer Mode de la app las opciones quedan ocultas salvo que la pregunta las necesite.
  const explicar = p.pide_opciones || ["combinada", "vf_items", "multiple"].includes(p.tipo) || tieneGrilla(p.opciones)
    ? "Si explica con sus palabras, mostrale las opciones: esta pregunta no se contesta sin verlas."
    : "Si explica con sus palabras, no le muestres las opciones: que explique la idea y vos deducís qué letra marcaría.";
  return [
    `Pregunta ${s.i + 1} de ${s.refs.length} · ${T[s.idioma].modo[s.modo]} · ${loc(m, s.idioma).sigla || s.materia}`,
    `[${etiqueta}${puntos} · id: ${id}]`,
    "",
    t.enunciado,
    "",
    opciones + huecos,
    "",
    `Cómo responder: ${comoResponder(p)} Pedile también qué tan seguro está (seguro, dudo o adiviné).`,
    explicar,
    "",
    `sesion: ${codigoSesion(s)}`,
    "(Pasá ese código tal cual en `responder`.)",
  ].join("\n");
}

// ---------- corrección ----------

function letraDeLaGrilla(opciones, marcas) {
  const afirmaciones = ["A", "B", "C", "D"];
  if (afirmaciones.some((l) => !marcas[l])) return null;
  const verdaderas = afirmaciones.filter((l) => marcas[l] === "V");
  if (verdaderas.length === 1) return verdaderas[0];
  return Object.entries(opciones).find(([, t]) => combina(t)?.join() === verdaderas.join())?.[0] || null;
}

function claveTexto(version, mostrada, tipo) {
  const o = mostrada.opciones;
  if (tipo === "vf_items") return Object.entries(version.clave).map(([l, v]) => `${l}: ${v === "V" ? "verdadera" : "falsa"}`).join(" · ");
  if (tipo === "multiple") return version.clave.map((l) => `${l}. ${o[l]}`).join(" · ");
  if (tipo === "completar") return version.huecos.map((h, n) => `hueco ${n + 1}: ${mostrada.huecos?.[n]?.clave || h.clave}`).join(" · ");
  return `${version.clave}. ${o[version.clave]}`;
}

function resumen(s, local) {
  const m = materia(s.materia);
  const textos = T[s.idioma];
  const correctas = [...s.aciertos].filter((x) => x === "1").length;
  let puntos = 0;
  let total = 0;
  const filas = s.refs.map(([id, v], n) => {
    const { pregunta, version, ficha } = buscar({ materia: s.materia, pregunta_id: id, version: v });
    const mostrada = s.idioma === "en" ? versionEn(m, pregunta, v) || version : version;
    const en = s.idioma === "en" ? fichaEn(m, ficha) : null;
    const bien = s.aciertos[n] === "1";
    total += pregunta.puntos || 0;
    if (bien) puntos += pregunta.puntos || 0;
    return `- ${en?.tema || ficha.tema} (${en?.autor || ficha.autor}): ${bien ? "bien" : "mal"} · ${textos.estado[s.mapa[ficha.id]?.estado] || textos.estado.sin_ver}` +
      (s.modo !== "practica" ? ` · la correcta: ${claveTexto(version, mostrada, pregunta.tipo)}` : "");
  });
  const codigo = `${s.materia}:${entradasDe(s.materia, s.mapa)}`;
  return [
    `Terminó la sesión (${textos.modo[s.modo]}): acertó ${correctas} de ${s.refs.length}` +
      (s.modo === "diagnostico" && total ? `, ${puntos.toFixed(1)} de ${total.toFixed(0)} puntos con el puntaje del examen.` : "."),
    ...filas,
    "",
    `Código de su mapa de ${loc(m, s.idioma).sigla}: ${codigo}`,
    local
      ? "El mapa también quedó guardado en esta computadora. Proponele seguir con `empezar` en modo practica: arranca por sus puntos ciegos."
      : "Dale este código para que lo guarde y pasalo en `mapa` la próxima vez (en empezar, ver_ideas o ver_mapa) para seguir donde quedó. Proponele seguir con `empezar` en modo practica, con este mapa: arranca por sus puntos ciegos.",
  ].join("\n");
}

// ---------- el servidor ----------

const instrucciones = (local) => `PrepTest prepara los exámenes del CBC de la UBA por UBA XXI con preguntas de exámenes reales. Este MCP pone la estructura (catálogo, preguntas, clave, fichas y el mapa del alumno) y vos hacés de tutor. No hay API de por medio.

Cómo usarlo:
1. ver_catalogo para que el alumno elija carrera y materia; ver_ideas si quiere elegir qué ideas practicar.
2. empezar con la materia y el modo: practica (5 preguntas, primero sus puntos ciegos y con feedback en cada una), demo (4, sin feedback hasta el final) o diagnostico (18, como el examen, sin feedback hasta el final).
3. Mostrale la pregunta tal cual. Puede contestar de dos maneras:
   - Como en el examen: elige la letra o marca V/F. Mandá eso a responder.
   - Explicando con sus palabras (Explainer Mode): leé su explicación, deducí qué letra o marcas daría (no le regales la correcta si no la sostuvo), juzgá si se entiende, da el motivo del autor, usa bien los conceptos y no es ambigua (bien_explicada = al menos 3 de esos 4), y mandá a responder la respuesta deducida, su explicación y bien_explicada.
   Siempre preguntale qué tan seguro está antes de responder: seguro, dudo o adivine.
4. responder corrige con la clave, actualiza su mapa y te devuelve la ficha de la idea. Con eso dale el feedback: qué hizo bien, qué le faltó, el razonamiento correcto según el autor y, si explicó, su explicación reescrita más clara. Después mostrale la siguiente pregunta que viene en la misma respuesta.

Los códigos:
- Cada pregunta trae una línea "sesion: …". Pasá ese código tal cual en el siguiente responder; no lo inventes ni lo cortes. Si se pierde, empezá otra sesión.
- Al terminar, PrepTest da el código del mapa de la materia ("ipc:…"). ${local
  ? "En esta versión el mapa también se guarda en la computadora del alumno, así que el código es opcional."
  : "Dáselo al alumno para que lo guarde y, la próxima vez, pasalo en `mapa` en empezar, ver_ideas o ver_mapa para seguir donde quedó."}

Reglas del tutor:
- La ficha es la única fuente: en el examen cuenta lo que dice el autor según la cátedra, no el sentido común. No inventes citas, páginas, fechas ni videos.
- Hablale en segunda persona, en español rioplatense con voseo, corto y directo (si eligió inglés, en inglés). Corregí el razonamiento, no a la persona.
- En demo y diagnostico no le digas si acertó hasta el final, como en el examen.
- No le muestres la respuesta antes de que conteste.`;

const texto = (t) => ({ content: [{ type: "text", text: t }] });
const fallo = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const conErrores = (fn) => async (args) => {
  try { return await fn(args); } catch (error) { return fallo(error.message || String(error)); }
};
const IDIOMA = z.enum(["es", "en"]).optional().describe("Idioma de las preguntas: es (por defecto) o en.");
const MAPA = z.string().max(2000).optional().describe("El código del mapa que dio PrepTest al terminar una sesión (por ejemplo ipc:1a2b3d.4c5d6f). Sin código, empieza de cero.");
const LETRA = z.string().regex(/^[A-H]$/);

// local: la versión por stdio, que además guarda el mapa en un archivo de la computadora.
export function crearServidor({ local = false } = {}) {
  // El mapa de una materia: el del código si lo pasaron; si no, en local, el del archivo.
  const mapaDe = (materiaId, codigo) => (codigo || !local ? mapaDeCodigo(materiaId, codigo) : leerArchivo()[materiaId] || {});
  const servidor = new McpServer({ name: "preptest", version: "1.1.0" }, { instructions: instrucciones(local) });

  servidor.registerTool("ver_catalogo", {
    title: "Ver carreras y materias",
    description: "Lista las carreras y sus materias del CBC. Las disponibles traen preguntas; las demás están en preparación.",
    inputSchema: { idioma: IDIOMA, mapa: MAPA },
    annotations: { readOnlyHint: true },
  }, conErrores(({ idioma = "es", mapa }) => texto(catalogo.carreras.map((carrera) => {
    const c = loc(carrera, idioma);
    const lineas = carrera.materias.map((materiaCat) => {
      const mc = loc(materiaCat, idioma);
      const cargada = materias.get(mc.id);
      if (!cargada) return `- ${mc.sigla} · ${mc.nombre}: próximamente`;
      const vistas = Object.keys(mapaDe(mc.id, mapa)).length;
      return `- ${mc.sigla} · ${mc.nombre} (id: ${mc.id}) · Cátedra ${mc.catedra} · ${mc.instancia} · ${cargada.fichas.length} ideas, ` +
        `${cargada.banco.length} preguntas · ${vistas ? `trabajó ${vistas} ideas` : "sin empezar"}`;
    });
    return `${c.nombre} (id: ${c.id}): ${c.descripcion}\n${lineas.join("\n")}`;
  }).join("\n\n"))));

  servidor.registerTool("ver_ideas", {
    title: "Ver las ideas de una materia",
    description: "Lista las ideas (fichas) de una materia, cuántas veces se tomaron y en qué estado están en el mapa del alumno. Sirve para elegir qué practicar.",
    inputSchema: { materia: z.string().describe("Id de la materia, por ejemplo icse, sociologia o ipc."), idioma: IDIOMA, mapa: MAPA },
    annotations: { readOnlyHint: true },
  }, conErrores(({ materia: id, idioma = "es", mapa }) => {
    const m = materia(id);
    const estados = mapaDe(id, mapa);
    const lineas = [...m.fichas].sort((a, b) => m.vecesPorFicha.get(b.id) - m.vecesPorFicha.get(a.id)).map((f) => {
      const en = idioma === "en" ? fichaEn(m, f) : null;
      return `- ${en?.tema || f.tema} · ${en?.autor || f.autor} (id: ${f.id}) · tomada ${m.vecesPorFicha.get(f.id)} veces · ` +
        (T[idioma].estado[estados[f.id]?.estado] || T[idioma].estado.sin_ver);
    });
    return texto(`${loc(m, idioma).nombre}: ${m.fichas.length} ideas\n${lineas.join("\n")}`);
  }));

  servidor.registerTool("empezar", {
    title: "Empezar una sesión",
    description: "Arma una sesión de preguntas de exámenes reales y devuelve la primera con su código de sesión. Modos: practica (5, primero los puntos ciegos, con feedback en cada una), demo (4) o diagnostico (18, como el examen).",
    inputSchema: {
      materia: z.string().describe("Id de la materia (ver_catalogo)."),
      modo: z.enum(["practica", "demo", "diagnostico"]).optional().describe("practica por defecto."),
      ideas: z.array(z.string()).max(20).optional().describe("Ids de ideas para practicar primero (ver_ideas). Solo en practica."),
      idioma: IDIOMA,
      mapa: MAPA,
    },
  }, conErrores(({ materia: id, modo = "practica", ideas, idioma = "es", mapa }) => {
    const m = materia(id);
    const desconocidas = (ideas || []).filter((x) => !m.fichaPorId.has(x));
    if (desconocidas.length) return fallo(`No existen estas ideas en ${id}: ${desconocidas.join(", ")}. Usá ver_ideas para ver los ids.`);
    const estados = mapaDe(id, mapa);
    const pedidas = ideas?.length ? ideas : [...m.fichas]
      .sort((a, b) => ORDEN_PRACTICA.indexOf(estados[a.id]?.estado) - ORDEN_PRACTICA.indexOf(estados[b.id]?.estado)
        || m.vecesPorFicha.get(b.id) - m.vecesPorFicha.get(a.id))
      .slice(0, 5).map((f) => f.id);
    const preguntas = sesion(m, modo, modo === "practica" ? pedidas : []);
    const s = { materia: id, modo, idioma, refs: preguntas.map((p) => [p.id, p.version]), i: 0, aciertos: "",
      mapa: Object.fromEntries(Object.entries(estados).map(([f, x]) => [f, { estado: x.estado }])) };
    return texto(preguntaTexto(s));
  }));

  servidor.registerTool("responder", {
    title: "Responder la pregunta actual",
    description: "Corrige la respuesta a la pregunta de la sesión con la clave del examen, actualiza el mapa y devuelve la ficha de la idea para que des el feedback, junto con la siguiente pregunta y su código de sesión (o el resumen y el código del mapa al terminar). No usa IA.",
    inputSchema: {
      sesion: z.string().max(4000).describe("El código de sesión que vino con la pregunta, tal cual."),
      eleccion: z.union([LETRA, z.array(LETRA)]).optional().describe("La letra elegida, o la lista de letras en las de opción múltiple."),
      marcas: z.record(z.string(), z.enum(["V", "F"])).optional().describe("V o F por letra, en las combinadas (A a D) y en las de verdadero o falso por afirmación."),
      huecos: z.array(z.string()).optional().describe("La palabra de cada hueco, en orden, en las de completar."),
      seguridad: z.enum(["seguro", "dudo", "adivine"]).describe("Qué tan seguro estaba el alumno."),
      explicacion: z.string().max(4000).optional().describe("Lo que explicó el alumno con sus palabras, si explicó."),
      bien_explicada: z.boolean().optional().describe("Si explicó: true cuando cumple al menos 3 de 4 (dice la respuesta, da el motivo del autor, usa bien los conceptos, no es ambigua)."),
    },
  }, conErrores(({ sesion: codigo, eleccion, marcas, huecos, seguridad, explicacion, bien_explicada }) => {
    const s = leerSesion(codigo);
    const [id, v] = s.refs[s.i];
    const { pregunta, version, ficha, m } = buscar({ materia: s.materia, pregunta_id: id, version: v });
    const mostrada = s.idioma === "en" ? versionEn(m, pregunta, v) || version : version;

    // En las combinadas se pueden mandar las marcas A–D: la letra sale de la grilla, como en la app.
    let letra = eleccion;
    if (pregunta.tipo === "combinada" || tieneGrilla(version.opciones)) {
      if (!letra && marcas) letra = letraDeLaGrilla(version.opciones, marcas);
      if (!letra) return fallo("En las combinadas mandá las cuatro marcas A–D (o la letra E–H). Con esas marcas ninguna opción del examen coincide: que las revise.");
    }
    // Las palabras de completar en inglés se pasan a español por su posición.
    const huecosEs = huecos && s.idioma === "en" && mostrada.huecos
      ? huecos.map((h, n) => version.huecos[n].opciones[mostrada.huecos[n].opciones.indexOf(h)] ?? h) : huecos;

    const r = responder({ materia: s.materia, pregunta_id: id, version: v, eleccion: letra, marcas, huecos: huecosEs });
    const nuevo = estadoDe(r.correcta, seguridad, explicacion ? bien_explicada !== false : true);
    s.mapa[ficha.id] = { estado: nuevo };
    if (local) guardarEnArchivo(s.materia, ficha.id, nuevo, r.error_probable);
    s.aciertos += r.correcta ? "1" : "0";

    const trampa = r.error_probable && ficha.trampas?.find((t) => t.error === r.error_probable);
    const partes = s.modo === "practica" ? [
      r.correcta ? "Correcta." : "Incorrecta.",
      `Respuesta correcta: ${claveTexto(version, mostrada, pregunta.tipo)}`,
      r.error_probable ? `Error probable: ${T[s.idioma].error[r.error_probable]}${trampa ? `. La trampa: «${trampa.texto}». Por qué es trampa: ${trampa.por_que}` : ""}` : "",
      mostrada.explicacion ? `Explicación del examen: ${mostrada.explicacion}` : "",
      `En su mapa, esta idea queda como: ${T[s.idioma].estado[nuevo]}.`,
      "",
      "Ficha de la idea (la única fuente para el feedback; está en español):",
      `Tema: ${ficha.tema} · Autor: ${ficha.autor}`,
      `Afirmación: ${String(ficha.afirmacion).trim()}`,
      ficha.puntos?.length ? `Puntos clave:\n${ficha.puntos.map((x) => `- ${x}`).join("\n")}` : "",
      ficha.explicacion_modelo ? `Explicación modelo: ${String(ficha.explicacion_modelo).trim()}` : "",
      ficha.pregunta_guia ? `Pregunta guía para reforzar: ${s.idioma === "en" ? fichaEn(m, ficha)?.pregunta_guia || ficha.pregunta_guia : ficha.pregunta_guia}` : "",
    ] : ["Respuesta registrada. En este modo no se dice si acertó hasta el final."];

    const termino = s.i + 1 >= s.refs.length;
    if (!termino) s.i += 1;
    const sigue = termino ? `\n---\n${resumen(s, local)}` : `\n---\nSiguiente:\n${preguntaTexto(s)}`;
    return texto(partes.filter(Boolean).join("\n") + sigue);
  }));

  servidor.registerTool("ver_mapa", {
    title: "Ver el mapa del alumno",
    description: "Muestra el mapa del alumno en una materia: cuántas ideas tiene en cada estado (dominado, frágil, laguna, punto ciego) y cuáles son.",
    inputSchema: { materia: z.string().describe("Id de la materia."), idioma: IDIOMA, mapa: MAPA },
    annotations: { readOnlyHint: true },
  }, conErrores(({ materia: id, idioma = "es", mapa }) => {
    const m = materia(id);
    const estados = mapaDe(id, mapa);
    const nombre = (f) => (idioma === "en" ? fichaEn(m, f)?.tema : null) || f.tema;
    const bloques = ESTADOS.map((e) => {
      const ideas = m.fichas.filter((f) => estados[f.id]?.estado === e);
      return `${T[idioma].estado[e]}: ${ideas.length}${ideas.length ? `\n${ideas.map((f) => `- ${nombre(f)}`).join("\n")}` : ""}`;
    });
    const sinVer = m.fichas.filter((f) => !estados[f.id]).length;
    return texto(`Mapa de ${loc(m, idioma).nombre} (${Object.keys(estados).length} de ${m.fichas.length} ideas trabajadas)\n\n` +
      `${bloques.join("\n\n")}\n\n${T[idioma].estado.sin_ver}: ${sinVer}`);
  }));

  servidor.registerPrompt("practicar", {
    title: "Practicar con PrepTest",
    description: "Arranca una práctica: elegís carrera y materia y vas contestando de a una.",
    argsSchema: { materia: z.string().optional().describe("Id de la materia, si ya sabés cuál.") },
  }, ({ materia: id }) => ({
    messages: [{
      role: "user",
      content: { type: "text", text: id
        ? `Quiero practicar ${id} con PrepTest. Empezá una sesión de práctica y haceme las preguntas de a una.`
        : "Quiero practicar con PrepTest. Mostrame las carreras y materias para elegir, y después haceme las preguntas de a una." },
    }],
  }));

  return servidor;
}
