// El banco de PrepTest: carga de rules/ el catálogo, las preguntas, las fichas y las traducciones,
// arma las sesiones y corrige con la clave del examen. No usa al tutor ni la API.
// Lo comparten el servidor web (server.mjs) y el MCP (mcp.mjs), así la lógica está en un solo lugar.

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { TutorError } from "./tutor.mjs";

const RULES = join(dirname(fileURLToPath(import.meta.url)), "..", "rules");
const TAMANIO_DIAGNOSTICO = 18;
const TAMANIO_DEMO = 4;
const TAMANIO_PRACTICA = 5;

// Las carreras y materias salen de rules/catalogo.yaml; solo las que tienen `reglas` traen preguntas.
const catalogo = yaml.load(readFileSync(join(RULES, "catalogo.yaml"), "utf8"));

// Traducción al inglés de lo que ve el alumno (scripts/traducir_banco.mjs). Cada versión lleva la huella
// del texto en español: si el banco cambió y la traducción quedó vieja, se muestra en español.
const huella = (...partes) => createHash("sha1").update(JSON.stringify(partes)).digest("hex").slice(0, 10);
const huellaVersion = (v) => huella(v.enunciado, v.opciones, v.huecos || null, v.explicacion || null);
const huellaFicha = (f) => huella(f.tema, f.autor, f.pregunta_guia || null);
function leerTraduccion(carpeta) {
  const archivo = join(RULES, carpeta, "traduccion_en.yaml");
  return existsSync(archivo) ? yaml.load(readFileSync(archivo, "utf8")) || {} : {};
}
const materias = new Map();
for (const carrera of catalogo.carreras) {
  for (const m of carrera.materias) {
    if (!m.reglas) continue;
    const banco = yaml.load(readFileSync(join(RULES, m.reglas, "banco_preguntas.yaml"), "utf8"));
    const fichas = yaml.load(readFileSync(join(RULES, m.reglas, "fichas_afirmacion.yaml"), "utf8"));
    const preguntaPorId = new Map(banco.map((q) => [q.id, q]));
    const traduccion = leerTraduccion(m.reglas);
    materias.set(m.id, {
      ...m,
      etiqueta: [m.sigla, m.catedra && `Cátedra ${m.catedra}`, m.instancia].filter(Boolean).join(" · "),
      etiqueta_en: [m.en?.sigla || m.sigla, m.catedra && `Chair ${m.catedra}`, m.en?.instancia || m.instancia].filter(Boolean).join(" · "),
      traduccion,
      banco,
      fichas,
      preguntaPorId,
      fichaPorId: new Map(fichas.map((f) => [f.id, f])),
      fichaDePregunta: new Map(fichas.flatMap((f) => f.preguntas.map((q) => [q, f]))),
      vecesPorFicha: new Map(fichas.map((f) => [f.id,
        f.preguntas.reduce((n, q) => n + preguntaPorId.get(q).veces_tomada, 0)])),
      cuatrimestres: [...new Set(banco.flatMap((q) => q.cuatrimestres))].sort(),
      // Nombres propios de la materia para que el dictado los escriba bien.
      glosario: `${m.nombre}. Autores: ${[...new Set(fichas.map((f) => f.autor)
        .filter((a) => !a.startsWith("Video")))].join(", ")}.`,
    });
  }
}

// La versión en inglés de una pregunta o una ficha, o null si no está traducida o quedó vieja.
function versionEn(m, pregunta, v) {
  const t = m.traduccion.preguntas?.[pregunta.id]?.[v];
  return t && t.fuente === huellaVersion(pregunta.versiones[v]) ? t : null;
}
function fichaEn(m, ficha) {
  const t = m.traduccion.fichas?.[ficha.id];
  return t && t.fuente === huellaFicha(ficha) ? t : null;
}

function materia(id) {
  const m = materias.get(id);
  if (!m) throw new TutorError("Esa materia todavía no está disponible.", 404);
  return m;
}

const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];
const mezclar = (lista) => lista.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(([, x]) => x);

// Preguntas que no se pueden contestar sin ver las opciones ("¿Cuál de las siguientes afirmaciones…?").
// En el Explainer Mode esas se muestran para elegir; en las demás el alumno explica sin verlas.
const PIDE_OPCIONES = new RegExp([
  String.raw`\bcu[aá]l(es)? de (las|los|estas|estos|ellos|ellas)\b`,
  String.raw`\bqu[eé] (premisa|opci[oó]n|afirmaci[oó]n)\b`,
  String.raw`\b(las|los) siguientes (afirmaciones|opciones|proposiciones|caracter[ií]sticas|alternativas|argumentos|fragmentos|autores|preguntas)\b`,
  // "B. Seleccioná la opción que justifica tu respuesta" (IPC): la justificación se elige entre las opciones.
  String.raw`\bopci[oó]n que justifica\b`,
].join("|"), "i");
const pideOpciones = (pregunta, version) =>
  pregunta.tipo === "simple" && !pregunta.relacionar && PIDE_OPCIONES.test(version.enunciado);

function paraElAlumno(m, pregunta, v) {
  // Todo lo que el navegador necesita para mostrar la pregunta, sin la clave.
  const ficha = m.fichaDePregunta.get(pregunta.id);
  const version = pregunta.versiones[v];
  const en = versionEn(m, pregunta, v);
  const fEn = fichaEn(m, ficha);
  return {
    id: pregunta.id,
    version: v,
    tipo: pregunta.tipo,
    relacionar: Boolean(pregunta.relacionar),
    pide_opciones: pideOpciones(pregunta, version),
    puntos: pregunta.puntos,
    enunciado: version.enunciado,
    opciones: version.opciones,
    huecos: version.huecos?.map((h) => ({ opciones: h.opciones })),
    ficha: { id: ficha.id, tema: ficha.tema, autor: ficha.autor, eje: ficha.eje },
    // La misma pregunta en inglés: el navegador muestra la del idioma elegido y se corrige con la española.
    en: en ? {
      enunciado: en.enunciado,
      opciones: en.opciones,
      huecos: en.huecos?.map((h) => ({ opciones: h.opciones })),
      ficha: fEn ? { tema: fEn.tema, autor: fEn.autor } : undefined,
    } : undefined,
  };
}

function unaPreguntaDe(m, ficha) {
  const pregunta = m.preguntaPorId.get(azar(ficha.preguntas));
  return paraElAlumno(m, pregunta, Math.floor(Math.random() * pregunta.versiones.length));
}

function sesion(m, modo, pedidas) {
  if (modo === "diagnostico" || modo === "demo") {
    // Una pregunta por ficha, primero las que más se toman, y después todo mezclado.
    // El Quick Demo es el mismo diagnóstico, en corto.
    const elegidas = mezclar(m.fichas)
      .sort((a, b) => m.vecesPorFicha.get(b.id) - m.vecesPorFicha.get(a.id))
      .slice(0, modo === "demo" ? TAMANIO_DEMO : TAMANIO_DIAGNOSTICO);
    return mezclar(elegidas).map((f) => unaPreguntaDe(m, f));
  }
  const prioridad = pedidas.map((id) => m.fichaPorId.get(id)).filter(Boolean);
  const resto = mezclar(m.fichas.filter((f) => !prioridad.includes(f)));
  return [...prioridad, ...resto].slice(0, TAMANIO_PRACTICA).map((f) => unaPreguntaDe(m, f));
}

const palabras = (s) => new Set(s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .match(/[a-zñ0-9]{4,}/g) || []);

// Qué afirmaciones da por correctas un alumno, según el tipo: la letra elegida, las afirmaciones
// que combina, las marcas V/F o las opciones tildadas. Sirve para buscar en qué trampa cayó.
function dadasPorCiertas(pregunta, version, r) {
  if (pregunta.tipo === "completar") return [];
  if (r.marcas) return Object.keys(r.marcas).filter((l) => r.marcas[l] === "V").map((l) => version.opciones[l]);
  if (Array.isArray(r.eleccion)) return r.eleccion.map((l) => version.opciones[l]);
  const texto = version.opciones[r.eleccion] || "";
  const combinadas = texto.match(/^Las opciones correctas son (.*)/);
  return combinadas ? (combinadas[1].match(/\b[A-D]\b/g) || []).map((l) => version.opciones[l]) : [texto];
}

function errorProbable(ficha, pregunta, version, r) {
  // Qué trampa de la ficha se parece más a lo que el alumno dio por cierto (para el mapa).
  const falsas = dadasPorCiertas(pregunta, version, r).filter((t) => t && !version.correctas.includes(t));
  if (!falsas.length) return null; // eligió una combinación incompleta: le faltó una verdadera
  let mejor = null;
  for (const trampa of ficha.trampas) {
    const t = palabras(trampa.texto);
    for (const f of falsas) {
      const o = palabras(f);
      const comun = [...t].filter((p) => o.has(p)).length / Math.max(1, Math.min(t.size, o.size));
      if (!mejor || comun > mejor.parecido) mejor = { error: trampa.error, parecido: comun };
    }
  }
  return mejor && mejor.parecido >= 0.3 ? mejor.error : null;
}

function buscar(datos) {
  const m = materia(datos.materia);
  const pregunta = m.preguntaPorId.get(datos.pregunta_id);
  const version = pregunta?.versiones[datos.version];
  if (!version) throw new TutorError("Pregunta inválida.", 400);
  return { m, pregunta, version, ficha: m.fichaDePregunta.get(pregunta.id) };
}

const mismaPalabra = (a, b) => String(a).trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  === String(b).trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const mismoConjunto = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

// Corrige una respuesta según el tipo de consigna. Como en el examen, no hay puntaje parcial.
function corregir(pregunta, version, r) {
  switch (pregunta.tipo) {
    case "multiple":
      return Array.isArray(r.eleccion) && mismoConjunto(r.eleccion, version.clave);
    case "vf_items":
      return Boolean(r.marcas) && Object.entries(version.clave).every(([l, v]) => r.marcas[l] === v);
    case "completar":
      return Array.isArray(r.huecos) && version.huecos.every((h, i) => mismaPalabra(r.huecos[i] ?? "", h.clave));
    default:
      return r.eleccion === version.clave;
  }
}

// Diagnóstico: formato del examen, se corrige con la clave y no usa a Claude.
function responder(datos) {
  const { pregunta, version, ficha } = buscar(datos);
  const letras = Object.keys(version.opciones);
  const marcas = datos.marcas && typeof datos.marcas === "object"
    ? Object.fromEntries(letras.filter((l) => ["V", "F"].includes(datos.marcas[l])).map((l) => [l, datos.marcas[l]]))
    : null;
  const r = { eleccion: datos.eleccion, marcas, huecos: datos.huecos };
  if (["simple", "vf_justificada", "combinada"].includes(pregunta.tipo) && !letras.includes(datos.eleccion)) {
    throw new TutorError("Opción inválida.", 400);
  }
  const correcta = corregir(pregunta, version, r);
  return { correcta, error_probable: correcta ? null : errorProbable(ficha, pregunta, version, r) };
}

export {
  catalogo, materias, materia, versionEn, fichaEn, pideOpciones, paraElAlumno, sesion, buscar, corregir,
  responder, errorProbable, TAMANIO_DIAGNOSTICO, TAMANIO_DEMO, TAMANIO_PRACTICA,
};
