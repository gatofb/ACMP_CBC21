// PrepTest UBA XXI: diagnóstico, práctica con explicación y mapa del alumno.
// Las reglas pedagógicas están en rules/00_modelo_de_aprendizaje.md.
// Bilingüe: los textos están en textos.js y las preguntas traducidas llegan del servidor en `en`.
// Se corrige siempre contra la versión en español.

import { TEXTOS } from "./textos.js";

const app = document.getElementById("app");

// ---------- idioma ----------

const IDIOMAS = ["es", "en"];
function idiomaInicial() {
  // ?lang=en en el link, si no lo que eligió antes, si no el idioma del navegador.
  const pedido = new URLSearchParams(location.search).get("lang");
  if (IDIOMAS.includes(pedido)) {
    try { localStorage.setItem("preptest.idioma", pedido); } catch { /* sin almacenamiento */ }
    return pedido;
  }
  try {
    const guardado = localStorage.getItem("preptest.idioma");
    if (IDIOMAS.includes(guardado)) return guardado;
  } catch { /* sin almacenamiento */ }
  return /^es\b/i.test(navigator.language || "es") ? "es" : "en";
}
let idioma = idiomaInicial();

function t(clave, ...datos) {
  const v = TEXTOS[idioma][clave] ?? TEXTOS.es[clave];
  return typeof v === "function" ? v(...datos) : v;
}

// La pregunta como la ve el alumno, en su idioma. Las letras y la corrección no cambian.
function vista(p) {
  if (idioma !== "en" || !p.en) return p;
  return { ...p, enunciado: p.en.enunciado, opciones: p.en.opciones, huecos: p.en.huecos || p.huecos,
    ficha: { ...p.ficha, ...p.en.ficha } };
}
const loc = (x) => (idioma === "en" && x?.en ? { ...x, ...x.en } : x);

// En las de completar el alumno elige palabras traducidas: se pasan a español por la posición.
const huecoAlEspanol = (p, n, palabra) => {
  const i = vista(p).huecos[n].opciones.indexOf(palabra);
  return i >= 0 ? p.huecos[n].opciones[i] : palabra;
};
const huecoAlIdioma = (p, n, palabra) => {
  const i = p.huecos?.[n]?.opciones.indexOf(palabra) ?? -1;
  return i >= 0 ? vista(p).huecos[n].opciones[i] : palabra;
};

const numero = (n) => (idioma === "es" ? String(n).replace(".", ",") : String(n));

// ---------- estados del mapa ----------

const COLORES = { ciego: "var(--ciego)", laguna: "var(--laguna)", fragil: "var(--fragil)", dominado: "var(--dominado)" };
const ESTADOS = Object.keys(COLORES);
const nombreEstado = (e) => t(`estado_${e}`);
const ORDEN_PRACTICA = ["ciego", "laguna", "fragil", undefined, "dominado"];
const textoError = (e) => (e && TEXTOS.es[`error_${e}`] ? t(`error_${e}`) : "");
const SEGURIDAD = ["seguro", "dudo", "adivine"];

// servidor: cómo llega al tutor · catalogo: carreras y materias · carrera/materia: lo que eligió el alumno
// redibujar: vuelve a mostrar la pantalla actual (al cambiar el idioma).
const estado = { servidor: null, catalogo: [], carrera: null, materia: null, fichas: [], sesion: null, redibujar: null };

// ---------- utilidades ----------

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// El mapa se guarda por materia: cada una tiene sus propias ideas.
const claveMapa = (materiaId = estado.materia?.id) => `preptest.mapa.${materiaId}`;
function leerMapa(materiaId) {
  try { return JSON.parse(localStorage.getItem(claveMapa(materiaId)) || "{}"); } catch { return {}; }
}
function guardarMapa(mapa) {
  try { localStorage.setItem(claveMapa(), JSON.stringify(mapa)); } catch { /* sin almacenamiento */ }
}
function migrarMapaViejo() {
  // Antes había una sola materia (ICSE) y el mapa se guardaba en "preptest.mapa".
  try {
    const viejo = localStorage.getItem("preptest.mapa");
    if (!viejo) return;
    const actual = JSON.parse(localStorage.getItem(claveMapa("icse")) || "{}");
    localStorage.setItem(claveMapa("icse"), JSON.stringify({ ...JSON.parse(viejo), ...actual }));
    localStorage.removeItem("preptest.mapa");
  } catch { /* sin almacenamiento */ }
}

// bienExplicada: en el Explainer Mode, claridad de 3 o 4; en el diagnóstico no se explica.
function estadoDe(correcta, seguridad, bienExplicada = true) {
  if (correcta) return seguridad === "seguro" && bienExplicada ? "dominado" : "fragil";
  return seguridad === "seguro" ? "ciego" : "laguna";
}

function registrar(fichaId, nuevo, error) {
  const mapa = leerMapa();
  const previo = mapa[fichaId] || { vistas: 0 };
  mapa[fichaId] = { estado: nuevo, error: error || null, vistas: previo.vistas + 1, fecha: Date.now() };
  guardarMapa(mapa);
}

async function api(ruta, cuerpo) {
  // x-idioma: el servidor traduce sus mensajes de error.
  const res = await fetch(ruta, cuerpo ? {
    method: "POST", headers: { "content-type": "application/json", "x-idioma": idioma }, body: JSON.stringify(cuerpo),
  } : { headers: { "x-idioma": idioma } });
  const datos = await res.json();
  if (!res.ok) throw new Error(datos.error || t("error_servidor"));
  return datos;
}

function opcionesHtml(p, { bloqueadas = false, clave = null, elegida = null } = {}) {
  return `<fieldset class="opciones${bloqueadas ? " bloqueadas" : ""}">
    <legend class="eyebrow" style="padding:0">${t("opciones")}</legend>
    ${Object.entries(p.opciones).map(([letra, texto]) => {
      const clase = clave ? (letra === clave ? "correcta" : letra === elegida ? "incorrecta" : "") : "";
      return `<label class="${clase}">
        <input type="radio" name="opcion" value="${letra}" ${letra === elegida ? "checked" : ""} ${bloqueadas ? "disabled" : ""}>
        <span class="letra">${letra}</span><span>${esc(texto)}</span>
      </label>`;
    }).join("")}
  </fieldset>`;
}

// Preguntas combinadas: A–D son afirmaciones y E–H combinaciones ("Las opciones correctas son la C y la D").
// Como en el examen no hay puntaje parcial, el alumno juzga cada afirmación y la app busca la letra de la grilla.
const AFIRMACIONES = ["A", "B", "C", "D"];
const COMBINACION = /^(?:Las opciones correctas son|The correct options are) (.*)/;

function combina(texto) {
  const m = String(texto).match(COMBINACION);
  return m ? (m[1].match(/\b[A-D]\b/g) || []).sort() : null;
}

// Las letras que la clave da por verdaderas, según el tipo de pregunta.
function verdaderasDe(p, clave) {
  if (p.tipo === "multiple") return clave;
  if (p.tipo === "vf_items") return Object.keys(clave).filter((l) => clave[l] === "V");
  return combina(p.opciones[clave]) || [clave];
}

// Las afirmaciones que el alumno juzga una por una: A–D en las combinadas, todas en vf_items y multiple.
const letrasAJuzgar = (p) => (p.tipo === "combinada" ? AFIRMACIONES : Object.keys(p.opciones));
const tieneGrilla = (p) => Object.values(p.opciones).some((t) => combina(t));

// La letra que iría en la grilla; null si faltan marcas, "" si ninguna opción coincide.
function letraDeLaGrilla(p, marcas) {
  if (AFIRMACIONES.some((l) => !marcas[l])) return null;
  const verdaderas = AFIRMACIONES.filter((l) => marcas[l] === "V");
  if (verdaderas.length === 1) return verdaderas[0];
  const opcion = Object.entries(p.opciones).find(([, t]) => combina(t)?.join() === verdaderas.join());
  return opcion ? opcion[0] : "";
}

function afirmacionesHtml(p, marcas = {}, { verdaderas = null } = {}) {
  return `<div class="afirmaciones">
    <p class="eyebrow">${verdaderas ? t("tus_marcas") : p.tipo === "multiple" ? t("marca_multiple") : t("marca_vf")}</p>
    ${letrasAJuzgar(p).map((l) => {
      const real = verdaderas && (verdaderas.includes(l) ? "V" : "F");
      const bien = real && marcas[l] === real;
      return `<div class="afirmacion${real ? (bien ? " correcta" : " incorrecta") : ""}">
        <span class="letra">${l}</span>
        <span class="texto">${esc(p.opciones[l])}${real ? `<small>${bien ? t("bien") : t("era", real)}</small>` : ""}</span>
        <span class="vf" role="group" aria-label="${t("afirmacion_n", l)}">
          ${[["V", t("verdadera"), t("letra_v")], ["F", t("falsa"), t("letra_f")]].map(([v, nombre, letra]) => `<button type="button" data-marca="${l}" data-valor="${v}"
            aria-pressed="${marcas[l] === v}" aria-label="${nombre}" title="${nombre}" ${real ? "disabled" : ""}>${letra}</button>`).join("")}
        </span>
      </div>`;
    }).join("")}
  </div>`;
}

function grillaHtml(p, letra, { clave = null } = {}) {
  const combinaciones = Object.entries(p.opciones).filter(([, t]) => combina(t));
  let mensaje;
  if (clave) mensaje = t("grilla_correcta", clave, letra);
  else if (letra === null) mensaje = t("grilla_falta");
  else if (letra === "") mensaje = t("grilla_ninguna");
  else mensaje = t("grilla_tuya", letra);
  return `<div class="grilla">
    <p class="titulo">${mensaje}</p>
    <ul>${combinaciones.map(([l, texto]) => `<li class="${l === (clave || letra) ? "activa" : ""}"><span class="letra">${l}</span>${esc(texto.replace(/^(?:Las opciones correctas son|The correct options are) /, "").replace(/\.$/, ""))}</li>`).join("")}</ul>
  </div>`;
}

// Completar: la frase con un desplegable por hueco (diagnóstico) o con las palabras resueltas (feedback).
function completarHtml(p, { elegidas = [], correctas = null } = {}) {
  let i = 0;
  const partes = esc(p.enunciado).split(/_{3,}/);
  return `<p class="frase-completar">${partes.map((texto, k) => {
    if (k === partes.length - 1) return texto;
    const n = i++;
    if (!correctas) {
      return `${texto}<select data-hueco="${n}" aria-label="${t("hueco_n", n + 1)}"><option value="">${t("elegi_hueco")}</option>${
        p.huecos[n].opciones.map((o) => `<option${elegidas[n] === o ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
    }
    const bien = elegidas[n] && elegidas[n].toLowerCase() === String(correctas[n]).toLowerCase();
    return `${texto}<span class="hueco ${bien ? "bien" : "mal"}">${esc(correctas[n])}${!bien ? `<small>${elegidas[n] ? t("pusiste", esc(elegidas[n])) : t("no_completaste")}</small>` : ""}</span>`;
  }).join("")}</p>`;
}

function leyendaHtml({ conSinVer = true } = {}) {
  return `<div class="leyenda">${ESTADOS.map((e) => `<span style="--c:${COLORES[e]}">${nombreEstado(e)}: ${t(`ayuda_${e}`).toLowerCase()}</span>`).join("")}${
    conSinVer ? `<span>${t("sin_ver_todavia")}</span>` : ""}</div>`;
}

// ---------- vistas ----------

function avisoIa() {
  const { ia } = estado.servidor;
  if (!ia) return `<div class="aviso">${t("sin_tutor")}</div>`;
  if (ia === "sesion") return `<div class="aviso info">${t("tutor_local")}</div>`;
  return "";
}

// El video de la Home está en inglés; en español se avisa debajo. Va debajo de "Cómo funciona" y el
// botón "Mirá cómo funciona" del hero lleva hasta él. Los dos aparecen solo si el archivo existe.
const VIDEO = { mp4: "video/como-funciona-en.mp4", poster: "video/como-funciona-en.webp" };
// La presentación del proyecto (presentation-v3, que vercel.json copia a public al publicar).
const PRESENTACION = "/presentation-v3/";
let hayVideo = null;
const videoDisponible = () => (hayVideo ??= fetch(VIDEO.mp4, { method: "HEAD" }).then((r) => r.ok).catch(() => false));

// Una muestra del Explainer Mode (una pregunta real de ICSE) para que se entienda la app de un vistazo.
function muestraHtml() {
  return `<div class="muestra entra" style="--d:3" role="img" aria-label="${esc(t("muestra_alt"))}">
    <p class="eyebrow">Explainer Mode</p>
    <p class="muestra-pregunta">${esc(t("muestra_pregunta"))}</p>
    <p class="muestra-burbuja">${esc(t("muestra_explicacion"))}</p>
    <p class="muestra-veredicto"><i aria-hidden="true">✓</i>${esc(t("muestra_veredicto"))}</p>
    <p class="muestra-claridad"><span></span><span></span><span></span><span></span>${esc(t("muestra_claridad"))}</p>
    <span class="muestra-chip">${esc(t("muestra_mapa"))}</span>
  </div>`;
}

// Con una sola carrera, los botones de la app llevan directo a sus materias.
const destinoApp = () => (estado.catalogo.length === 1 ? `#/${estado.catalogo[0].id}` : "#/carreras");

// Asistentes de IA que aceptan conectores MCP (logos en public/logos/, de Lobe Icons).
const ASISTENTES = [["gemini", "Gemini"], ["claude", "Claude"], ["chatgpt", "ChatGPT"], ["grok", "Grok"]];
const logoHtml = (id, nombre) => `<img class="logo-asistente" src="logos/${id}.svg" alt="${nombre}" width="22" height="22">`;
const asistentesHtml = () => `<div class="asistentes"><span class="chico">${t("funciona_con")}</span>
  ${ASISTENTES.map(([id, nombre]) => `<span class="asistente">${logoHtml(id, nombre)}${nombre}</span>`).join("")}</div>`;

// Los dos planes: gratis por el MCP (con el asistente de cada uno) o la app completa con el tutor.
// No hay cobro integrado: "Pagá" lleva a la app.
function planHtml(plan, href, clase) {
  return `<div class="plan ${clase}">
    <p class="plan-nombre">${plan.nombre}</p>
    <p class="plan-precio">${plan.precio}</p>
    <p class="plan-texto">${plan.texto}</p>
    <ul>${plan.items.map((x) => `<li>${x}</li>`).join("")}</ul>
    ${clase === "gratis" ? asistentesHtml() : ""}
    <a class="btn grande${clase === "gratis" ? " secundario" : ""}" href="${href}">${plan.cta}</a>
  </div>`;
}

function landing() {
  const disponibles = estado.catalogo.flatMap((c) => c.materias.filter((m) => m.disponible));
  const suma = (campo) => disponibles.reduce((n, m) => n + m[campo], 0);
  const destino = destinoApp();
  const boton = (clase = "") => `<a class="btn grande ${clase}" href="${destino}">${t("cta_materia")}</a>`;
  app.innerHTML = `
    <section class="hero">
      <div>
        <p class="eyebrow entra" style="--d:0">${t("hero_eyebrow")}</p>
        <h1 class="entra" style="--d:1">${t("hero_titulo")}</h1>
        <p class="sub entra" style="--d:2">${t("hero_sub")}</p>
        <div class="acciones entra" style="--d:3">
          ${boton()}
          <a class="btn secundario grande" href="#video" data-ancla data-video hidden>▶ ${t("cta_video")}</a>
        </div>
        <ul class="cifras entra" style="--d:4">
          ${t("cifras", suma("preguntas"), suma("fichas"), disponibles.length)
            .map(([n, texto]) => `<li><b>${n}</b><span>${texto}</span></li>`).join("")}
        </ul>
      </div>
      ${muestraHtml()}
    </section>

    <section class="seccion como-funciona">
      <h2>${t("pasos_titulo")}</h2>
      <div class="como-funciona-cuerpo">
      <ol class="pasos">
        ${t("pasos").map(([titulo, texto], i) => `<li><span class="numero">${i + 1}</span><h3>${titulo}</h3><p>${texto}</p></li>`).join("")}
      </ol>
      <div class="video-bloque" id="video" data-video hidden>
        <video controls playsinline preload="metadata" poster="${VIDEO.poster}"><source src="${VIDEO.mp4}" type="video/mp4"></video>
        ${t("video_nota") ? `<p class="chico">${t("video_nota")}</p>` : ""}
      </div>
      </div>
    </section>

    <section class="seccion planes">
      <p class="eyebrow">${t("planes_eyebrow")}</p>
      <h2>${t("planes_titulo")}</h2>
      <div class="planes-grilla">
        ${planHtml(t("plan_gratis"), "#/mcp", "gratis")}
        ${planHtml(t("plan_pago"), destino, "pago")}
      </div>
    </section>

    <section class="cta-naranja">
      <h2>${t("cta_titulo")}</h2>
      <p>${t("cta_texto", suma("apariciones"), suma("fichas"))}</p>
      ${boton("blanco")}
    </section>

    <p class="presentacion">
      <a class="btn secundario" href="${PRESENTACION}" target="_blank" rel="noopener">${t("ver_presentacion")}</a>
      ${t("presentacion_nota") ? `<span class="chico">${t("presentacion_nota")}</span>` : ""}
    </p>`;

  // La entrada se anima recién cuando el navegador dibuja: si no dibuja (una vista previa, una captura),
  // el contenido se ve igual, sin quedar invisible.
  requestAnimationFrame(() => app.querySelector(".hero")?.classList.add("animar"));
  // Con el video, los pasos van en una columna y el video (vertical) al lado.
  videoDisponible().then((ok) => {
    app.querySelectorAll("[data-video]").forEach((el) => { el.hidden = !ok; });
    app.querySelector(".como-funciona")?.classList.toggle("con-video", ok);
  });
  estado.redibujar = landing;
}

// ---------- MCP: usarlo gratis desde el asistente de IA de cada uno ----------

const MCP_INSTALAR = "git clone https://github.com/gatofb/ACMP_CBC21.git ~/preptest && cd ~/preptest/output && npm install";
const mcpConfig = (usuario) => `"preptest": {\n  "command": "node",\n  "args": ["/Users/${usuario}/preptest/output/mcp.mjs"]\n}`;

function codigoHtml(texto) {
  return `<div class="codigo"><pre><code>${esc(texto)}</code></pre>
    <button type="button" class="copiar" data-copiar="${esc(texto)}">${t("copiar")}</button></div>`;
}

// Copia el comando. Si el navegador no deja usar el portapapeles, prueba el método viejo y, si
// tampoco, deja el texto seleccionado para copiarlo con Cmd+C o Ctrl+C.
async function copiarTexto(boton) {
  const texto = boton.dataset.copiar;
  let ok = false;
  try { await navigator.clipboard.writeText(texto); ok = true; } catch {
    const area = Object.assign(document.createElement("textarea"), { value: texto });
    area.style.cssText = "position:fixed;opacity:0";
    document.body.append(area);
    area.select();
    try { ok = document.execCommand("copy"); } catch { /* sin portapapeles */ }
    area.remove();
  }
  if (!ok) {
    const rango = document.createRange();
    rango.selectNodeContents(boton.parentElement.querySelector("code"));
    getSelection().removeAllRanges();
    getSelection().addRange(rango);
    return;
  }
  boton.textContent = t("copiado");
  setTimeout(() => { boton.textContent = t("copiar"); }, 1500);
}

// La dirección del conector en línea (output/mcp-http.mjs, publicado en Vercel).
const MCP_URL = "https://acmp-cbc21.vercel.app/mcp";

function verMcp() {
  app.innerHTML = `
    <p class="eyebrow">${t("mcp_eyebrow")}</p>
    <h1>${t("mcp_titulo")}</h1>
    <p class="sub">${t("mcp_sub")}</p>
    ${asistentesHtml()}
    <div class="tarjeta destacada-mcp">
      <h2>${t("mcp_url_titulo")}</h2>
      ${codigoHtml(MCP_URL)}
      <p class="mcp-texto">${t("mcp_url_texto")}</p>
    </div>
    <div class="tarjeta">
      <h2>${t("mcp_asistentes_titulo")}</h2>
      <ul class="lista-asistentes">
        ${t("mcp_asistentes").map(([id, nombre, pasos]) => `<li>${logoHtml(id, nombre)}<div><b>${nombre}</b><p>${pasos}</p></div></li>`).join("")}
      </ul>
      <p class="chico">${t("mcp_menus_nota")}</p>
    </div>
    <div class="tarjeta">
      <h2>${t("mcp_despues_titulo")}</h2>
      <p class="mcp-texto">${t("mcp_paso3")}</p>
      <p class="frase">“${t("mcp_paso3_frase")}”</p>
      <p class="mcp-texto">${t("mcp_mapa_nota")}</p>
    </div>
    <div class="tarjeta">
      <h2>${t("mcp_puede_titulo")}</h2>
      <ul class="lista-mcp">${t("mcp_puede").map((x) => `<li>${x}</li>`).join("")}</ul>
    </div>
    <details class="tarjeta mcp-local">
      <summary><h2>${t("mcp_local_titulo")}</h2></summary>
      <p class="mcp-texto">${t("mcp_local_texto")}</p>
      <ol class="pasos-mcp">
        <li><p>${t("mcp_paso1")}</p>${codigoHtml(MCP_INSTALAR)}</li>
        <li><p>${t("mcp_paso2")}</p>${codigoHtml(mcpConfig(idioma === "en" ? "YOUR_USER" : "TU_USUARIO"))}<p class="chico">${t("mcp_paso2_nota")}</p></li>
      </ol>
    </details>
    <div class="tarjeta">
      <h2>${t("mcp_diferencias_titulo")}</h2>
      <p class="mcp-texto">${t("mcp_diferencias")}</p>
      <div class="acciones"><a class="btn secundario" href="${destinoApp()}">${t("mcp_ver_pago")}</a></div>
    </div>`;
  estado.redibujar = verMcp;
}

function verCarreras() {
  app.innerHTML = `
    <p class="eyebrow">${t("paso_de", 1)}</p>
    <h1>${t("elegi_carrera")}</h1>
    <p class="sub">${t("carreras_sub")}</p>
    <div class="grilla-tarjetas">
      ${estado.catalogo.map((carrera) => {
        const c = loc(carrera);
        const listas = c.materias.filter((m) => m.disponible).length;
        return `<a class="tarjeta eleccion" href="#/${c.id}">
          <h2>${esc(c.nombre)}</h2><p>${esc(c.descripcion)}</p>
          <span class="chico">${t("materias_disponibles", c.materias.length, listas)}</span>
        </a>`;
      }).join("")}
      <div class="tarjeta eleccion apagada"><h2>${t("otras_carreras")}</h2><p>${t("otras_carreras_texto")}</p><span class="chico">${t("proximamente")}</span></div>
    </div>`;
  estado.redibujar = verCarreras;
}

function verMaterias(carrera) {
  const c = loc(carrera);
  app.innerHTML = `
    <p class="eyebrow"><a href="#/carreras">${t("nav_carreras")}</a> · ${esc(c.nombre)} · ${t("paso_de", 2)}</p>
    <h1>${t("elegi_materia")}</h1>
    <p class="sub">${t("materias_sub")}</p>
    <div class="grilla-tarjetas">
      ${carrera.materias.map((materia) => {
        const m = loc(materia);
        const mapa = m.disponible ? leerMapa(m.id) : {};
        const vistas = Object.keys(mapa).length;
        const contenido = `<p class="eyebrow">${esc(m.sigla)} (${m.codigo})</p><h3>${esc(m.nombre)}</h3>`;
        return m.disponible
          ? `<a class="tarjeta eleccion" href="#/${carrera.id}/${m.id}">${contenido}
              <p>${t("catedra", esc(m.catedra))} · ${esc(m.instancia)}</p>
              <span class="chico">${t("ideas_trabajadas_chico", m.fichas, vistas)}</span></a>`
          : `<div class="tarjeta eleccion apagada">${contenido}<span class="chico">${t("proximamente")}</span></div>`;
      }).join("")}
    </div>`;
  estado.redibujar = () => verMaterias(carrera);
}

function resumenHtml(conteo) {
  return `<div class="resumen">${ESTADOS.map((k) =>
    `<div style="--c:${COLORES[k]}"><b>${conteo[k] || 0}</b><small>${nombreEstado(k)}</small></div>`).join("")}</div>`;
}

// Cómo se agrupa el mapa: por eje si la materia tiene varios (ICSE: conceptos, videos, Romero);
// si todo es de un mismo eje (Sociología), por autor, primero los que más se toman.
function gruposDelMapa(fichas, ejes) {
  const usados = [...new Set(fichas.map((f) => f.eje))];
  if (usados.length > 1) {
    return Object.entries(ejes).filter(([eje]) => usados.includes(eje))
      .map(([eje, nombre]) => [nombre, fichas.filter((f) => f.eje === eje)]);
  }
  const porAutor = new Map();
  for (const f of fichas) porAutor.set(f.autor, [...(porAutor.get(f.autor) || []), f]);
  const total = (lista) => lista.reduce((n, f) => n + f.veces, 0);
  return [...porAutor.entries()].sort((a, b) => total(b[1]) - total(a[1]));
}

function verMateria() {
  const { carrera, materia, servidor } = estado;
  const fichas = estado.fichas.map(loc);
  const mat = loc(materia);
  const mapa = leerMapa();
  const vistas = Object.keys(mapa).length;
  const conteo = Object.values(mapa).reduce((n, m) => ({ ...n, [m.estado]: (n[m.estado] || 0) + 1 }), {});
  const ejes = { conceptos: t("eje_conceptos"), videos: t("eje_videos"), historia: t("eje_historia") };
  // Qué exámenes se usan, según la instancia en español de rules/catalogo.yaml.
  const examenes = /final/i.test(materia.instancia) ? (/parcial/i.test(materia.instancia) ? t("examenes_ambos") : t("examenes_finales")) : t("examenes_parciales");
  app.innerHTML = `
    <p class="eyebrow"><a href="#/carreras">${t("nav_carreras")}</a> · <a href="#/${carrera.id}">${esc(loc(carrera).nombre)}</a> · ${esc(mat.etiqueta)}</p>
    <h1>${t("tu_mapa", esc(mat.nombre))}</h1>
    ${avisoIa()}
    <div class="tarjeta destacada">
      ${vistas
        ? `<h2>${t("ideas_trabajadas", vistas, fichas.length)}</h2><p>${t("mapa_con_ideas")}</p>`
        : `<h2>${t("empeza_diagnostico")}</h2><p>${t("texto_diagnostico", examenes)}</p>`}
      <div class="acciones">
        <button class="btn${vistas ? " secundario" : ""}" data-accion="diagnostico">${vistas ? t("repetir_diagnostico") : t("hacer_diagnostico")}</button>
        <button class="btn secundario" data-accion="demo">${t("quick_demo_boton")}</button>
        <button class="btn${vistas ? "" : " secundario"}" data-accion="practica" ${servidor.ia ? "" : "disabled"}>${t("practicar_explainer")}</button>
      </div>
    </div>
    ${resumenHtml(conteo)}
    ${leyendaHtml()}
    ${gruposDelMapa(fichas, ejes).map(([nombre, lista]) => `
      <div class="tarjeta">
        <h3>${esc(nombre)}</h3>
        <ul class="lista-fichas">
          ${lista.sort((a, b) => b.veces - a.veces).map((f) => {
            const m = mapa[f.id];
            return `<li><span><span class="tema">${esc(f.tema)}</span><span class="autor">${esc(f.autor)} · ${t("tomada", f.veces)}${m?.error && m.estado !== "dominado" ? ` · ${esc(textoError(m.error))}` : ""}</span></span>
              <span class="estado" style="--c:${m ? COLORES[m.estado] : "var(--sin-ver)"}">${m ? nombreEstado(m.estado) : t("sin_ver")}</span></li>`;
          }).join("")}
        </ul>
      </div>`).join("")}
    ${vistas ? `<div class="acciones"><button class="btn secundario" data-accion="borrar">${t("borrar_mapa")}</button></div>` : ""}`;
  estado.redibujar = verMateria;
}

async function empezar(modo) {
  app.innerHTML = `<div class="tarjeta"><div class="cargando">${t("armando")}</div></div>`;
  let pedidas = "";
  if (modo === "practica") {
    const mapa = leerMapa();
    pedidas = [...estado.fichas]
      .sort((a, b) => ORDEN_PRACTICA.indexOf(mapa[a.id]?.estado) - ORDEN_PRACTICA.indexOf(mapa[b.id]?.estado)
        || b.veces - a.veces)
      .slice(0, 5).map((f) => f.id).join(",");
  }
  const preguntas = await api(`/api/sesion?materia=${estado.materia.id}&modo=${modo}&fichas=${encodeURIComponent(pedidas)}`);
  estado.sesion = { modo, preguntas, i: 0, resultados: [] };
  modo === "practica" ? explicar() : pregunta();
}

// ---------- piezas compartidas ----------

function progresoHtml(modo) {
  const { sesion } = estado;
  return `<div class="progreso">
    <span class="chico">${t("de", sesion.i + 1, sesion.preguntas.length)}</span>
    <div class="barra-p"><i style="width:${(sesion.i / sesion.preguntas.length) * 100}%"></i></div>
    <span class="chico">${t(`modo_${modo}`)}</span>
  </div>`;
}

function cabeceraHtml(p, { sinEnunciado = false } = {}) {
  const puntos = p.puntos ? t("puntos", p.puntos, numero(p.puntos)) : "";
  // En las de relacionar el autor es la respuesta: la etiqueta no lo puede mostrar.
  const etiqueta = p.relacionar ? t("relacionar") : esc(p.ficha.autor);
  return `<span class="etiqueta">${etiqueta}${puntos}</span>
    ${sinEnunciado ? "" : `<p class="enunciado">${esc(p.enunciado)}</p>`}`;
}

// Qué ve y qué tiene que explicar el alumno en el Explainer Mode, según el tipo.
// p es la pregunta en español: las reglas miran el enunciado original.
function consignaExplicar(p) {
  if (p.tipo === "vf_justificada") return t("consigna_vf");
  if (p.tipo === "combinada" || tieneGrilla(p)) return t("consigna_combinada");
  if (p.pide_opciones) return t("consigna_elegir");
  if (p.tipo === "vf_items") return t("consigna_vf_items");
  if (p.tipo === "multiple") return t("consigna_multiple");
  if (p.tipo === "completar") return t("consigna_completar");
  if (p.relacionar && /^¿Qué concepto/.test(p.enunciado)) return t("consigna_concepto");
  if (p.relacionar) return t("consigna_autor");
  return t("consigna_general");
}

function seguridadHtml() {
  return `<div class="bloque">
    <p class="titulo">${t("que_tan_seguro")}</p>
    <div class="seguridad" role="group" aria-label="${t("seguridad")}">
      ${SEGURIDAD.map((v) => `<button type="button" data-seguridad="${v}" aria-pressed="false">${t(v)}</button>`).join("")}
    </div>
  </div>`;
}

// Devuelve una función que dice qué eligió el alumno (o null).
function conectarSeguridad(form, alCambiar) {
  let seguridad = null;
  form.querySelectorAll("[data-seguridad]").forEach((b) => b.addEventListener("click", () => {
    seguridad = b.dataset.seguridad;
    form.querySelectorAll("[data-seguridad]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    alCambiar();
  }));
  return () => seguridad;
}

function botonSiguiente() {
  return estado.sesion.i + 1 < estado.sesion.preguntas.length ? t("siguiente_pregunta") : t("ver_como_me_fue");
}

// ---------- diagnóstico: formato del examen, sin correcciones en el medio ----------

function pregunta() {
  const { sesion } = estado;
  const p = sesion.preguntas[sesion.i];
  const pv = vista(p);
  const combinada = p.tipo === "combinada";
  const porAfirmacion = ["combinada", "vf_items", "multiple"].includes(p.tipo);
  const cuerpo = p.tipo === "completar" ? completarHtml(pv)
    : combinada ? `${afirmacionesHtml(pv)}<div id="grilla">${grillaHtml(pv, null)}</div>`
      : porAfirmacion ? afirmacionesHtml(pv) : opcionesHtml(pv);
  app.innerHTML = `
    ${progresoHtml(estado.sesion.modo === "demo" ? "demo" : "diagnostico")}
    <form class="tarjeta" id="form-pregunta">
      ${cabeceraHtml(pv, { sinEnunciado: p.tipo === "completar" })}
      ${cuerpo}
      ${seguridadHtml()}
      <div class="acciones">
        <button class="btn" type="submit" disabled>${t("siguiente")}</button>
        <button class="btn secundario" type="button" data-accion="salir">${t("salir")}</button>
      </div>
    </form>`;
  estado.redibujar = pregunta;

  const form = document.getElementById("form-pregunta");
  const boton = form.querySelector("[type=submit]");
  const marcas = {};
  const todasMarcadas = () => letrasAJuzgar(p).every((l) => marcas[l]);
  const huecos = () => [...form.querySelectorAll("[data-hueco]")].map((s, n) => s.value && huecoAlEspanol(p, n, s.value));
  // Lo que se manda a corregir, o null mientras falte algo.
  const respuestaDada = () => {
    if (p.tipo === "completar") return huecos().every(Boolean) ? { huecos: huecos() } : null;
    if (combinada) { const l = letraDeLaGrilla(p, marcas); return l ? { eleccion: l, marcas } : null; }
    if (p.tipo === "vf_items") return todasMarcadas() ? { marcas } : null;
    if (p.tipo === "multiple") return todasMarcadas() ? { eleccion: letrasAJuzgar(p).filter((l) => marcas[l] === "V") } : null;
    const elegida = form.querySelector("input[name=opcion]:checked")?.value;
    return elegida ? { eleccion: elegida } : null;
  };
  const listo = () => { boton.disabled = !(respuestaDada() && seguridad()); };
  const seguridad = conectarSeguridad(form, listo);
  form.querySelectorAll("[data-marca]").forEach((b) => b.addEventListener("click", () => {
    marcas[b.dataset.marca] = b.dataset.valor;
    form.querySelectorAll(`[data-marca="${b.dataset.marca}"]`).forEach((x) => x.setAttribute("aria-pressed", x === b));
    if (combinada) document.getElementById("grilla").innerHTML = grillaHtml(vista(p), letraDeLaGrilla(p, marcas));
    listo();
  }));
  form.addEventListener("change", listo);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const respuesta = { materia: estado.materia.id, pregunta_id: p.id, version: p.version, ...respuestaDada() };
    boton.disabled = true;
    boton.textContent = t("guardando");
    try {
      const r = await api("/api/responder", respuesta);
      sesion.resultados.push({ p, ...respuesta, ...r });
      registrar(p.ficha.id, estadoDe(r.correcta, seguridad()), r.error_probable);
      siguiente();
    } catch (error) {
      boton.disabled = false;
      boton.textContent = t("probar_de_nuevo");
      form.insertAdjacentHTML("beforeend", `<div class="aviso" style="margin-top:14px">${esc(error.message)}</div>`);
    }
  });
}

// ---------- Explainer Mode: el alumno explica sin opciones y el tutor deduce qué habría marcado ----------

const CLARIDAD = ["dice_la_respuesta", "da_el_motivo_del_autor", "usa_bien_los_conceptos", "se_entiende_sin_ambiguedad"];
const MAX_INTENTOS = 3;
const MIN_EXPLICACION = 10; // caracteres; el servidor pide lo mismo

const MICROFONO = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>`;
// Dictado del navegador (Chrome, Edge, Safari): se usa cuando el servidor no tiene Whisper, como en la nube.
const reconocedor = () => window.SpeechRecognition || window.webkitSpeechRecognition;

function listaAfirmacionesHtml(p) {
  return `<ul class="lista-afirmaciones">${letrasAJuzgar(p).map((l) =>
    `<li><span class="letra">${l}</span><span>${esc(p.opciones[l])}</span></li>`).join("")}</ul>`;
}

// borrador: lo que ya había escrito, cuando se vuelve a dibujar la pantalla por el idioma.
function explicar({ previa = null, borrador = null } = {}) {
  const { sesion, servidor } = estado;
  const p = sesion.preguntas[sesion.i];
  const pv = vista(p);
  const intento = previa ? previa.intento + 1 : 1;
  // Se muestran solo las afirmaciones a juzgar; las opciones para elegir quedan ocultas, salvo que
  // la pregunta no se pueda contestar sin verlas ("¿Cuál de las siguientes…?").
  const muestraItems = ["combinada", "vf_items", "multiple"].includes(p.tipo) || tieneGrilla(p);
  const eligeOpcion = p.pide_opciones && !muestraItems;
  app.innerHTML = `
    ${progresoHtml("explainer")}
    <form class="tarjeta" id="form-explicar">
      ${cabeceraHtml(pv)}
      ${muestraItems ? listaAfirmacionesHtml(pv) : eligeOpcion ? opcionesHtml(pv, { elegida: previa?.eleccion }) : ""}
      ${previa ? `<div class="pista"><b>${t("explicalo_de_nuevo")}</b>${t("pista_reintento")}</div>` : ""}
      <div class="bloque">
        <label class="titulo" for="explicacion">${consignaExplicar(p)}</label>
        <textarea id="explicacion" maxlength="4000" placeholder="${t("placeholder")}">${esc(borrador ?? previa?.borrador ?? "")}</textarea>
        ${servidor.dictado || reconocedor()
          ? `<div class="dictado"><button type="button" class="btn secundario" id="grabar">${MICROFONO}<span>${t("dictar")}</span></button>
             <span class="chico" id="estado-dictado">${t("ayuda_dictado")}</span></div>`
          : `<p class="chico">${t("sin_dictado")}</p>`}
      </div>
      ${intento === 1 ? seguridadHtml() : ""}
      <div class="acciones">
        <button class="btn" type="submit" disabled>${t("enviar_explicacion")}</button>
        <button class="btn secundario" type="button" data-accion="salir">${t("salir")}</button>
      </div>
      <p class="chico falta" id="falta" aria-live="polite"></p>
    </form>`;

  const form = document.getElementById("form-explicar");
  const boton = form.querySelector("[type=submit]");
  const caja = form.querySelector("#explicacion");
  estado.redibujar = () => explicar({ previa, borrador: caja.value });
  let dictada = false;
  const eleccion = () => form.querySelector("input[name=opcion]:checked")?.value;
  // Lo que falta para poder enviar. Se avisa recién cuando el alumno empezó, para no retarlo de entrada.
  const aviso = form.querySelector("#falta");
  let empezo = Boolean(caja.value.trim());
  const falta = () => {
    if (caja.value.trim().length < MIN_EXPLICACION) return t("falta_texto", MIN_EXPLICACION);
    if (eligeOpcion && !eleccion()) return t("falta_opcion");
    if (intento === 1 && !seguridad()) return t("falta_seguridad");
    return "";
  };
  const listo = () => {
    const motivo = falta();
    boton.disabled = Boolean(motivo);
    aviso.textContent = empezo ? motivo : "";
  };
  form.addEventListener("input", () => { empezo = true; }, true);
  form.addEventListener("click", (e) => { if (e.target.closest("[data-seguridad], input")) empezo = true; }, true);
  const seguridad = intento === 1 ? conectarSeguridad(form, listo) : () => previa.seguridad;
  caja.addEventListener("input", listo);
  form.addEventListener("change", listo);
  conectarDictado(form, (texto) => {
    caja.value = [caja.value.trim(), texto].filter(Boolean).join(" ");
    dictada = true;
    listo();
  });
  listo();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const envio = { materia: estado.materia.id, pregunta_id: p.id, version: p.version, intento, idioma,
      seguridad: seguridad(), explicacion: caja.value, dictada, eleccion: eligeOpcion ? eleccion() : undefined };
    boton.disabled = true;
    boton.textContent = t("tutor_leyendo");
    try {
      const r = await api("/api/explicar", envio);
      feedbackExplicacion(p, envio, r, previa?.primero);
    } catch (error) {
      boton.disabled = false;
      boton.textContent = t("probar_de_nuevo");
      form.insertAdjacentHTML("beforeend", `<div class="aviso" style="margin-top:14px">${esc(error.message)}</div>`);
    }
  });
}

// Graba con el micrófono y manda el audio al servidor, que lo transcribe con Whisper en esta máquina.
// Si el servidor no tiene Whisper, transcribe el navegador.
function conectarDictado(form, alTranscribir) {
  const boton = form.querySelector("#grabar");
  if (!boton) return;
  const aviso = form.querySelector("#estado-dictado");
  const etiqueta = boton.querySelector("span");
  if (!estado.servidor.dictado) return dictadoDelNavegador(boton, etiqueta, aviso, alTranscribir);
  let grabador = null;
  boton.addEventListener("click", async () => {
    if (grabador?.state === "recording") return grabador.stop();
    let microfono;
    try {
      microfono = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      aviso.textContent = t("mic_error");
      return;
    }
    const partes = [];
    const inicio = Date.now();
    grabador = new MediaRecorder(microfono);
    grabador.addEventListener("dataavailable", (e) => { if (e.data.size) partes.push(e.data); });
    const reloj = setInterval(() => {
      aviso.textContent = t("grabando_seg", Math.round((Date.now() - inicio) / 1000));
    }, 500);
    grabador.addEventListener("stop", async () => {
      clearInterval(reloj);
      microfono.getTracks().forEach((t) => t.stop());
      boton.classList.remove("grabando");
      etiqueta.textContent = t("dictar");
      boton.disabled = true;
      aviso.textContent = t("transcribiendo");
      try {
        const tipo = grabador.mimeType || "audio/webm";
        const res = await fetch(`/api/transcribir?materia=${estado.materia.id}&idioma=${idioma}`, {
          method: "POST", headers: { "content-type": tipo, "x-idioma": idioma }, body: new Blob(partes, { type: tipo }),
        });
        const datos = await res.json();
        if (!res.ok) throw new Error(datos.error || t("no_transcribio"));
        if (datos.texto) alTranscribir(datos.texto);
        aviso.textContent = datos.texto ? t("dictado_listo") : t("no_se_escucho");
      } catch (error) {
        aviso.textContent = error.message;
      }
      boton.disabled = false;
    });
    grabador.start();
    boton.classList.add("grabando");
    etiqueta.textContent = t("terminar");
    aviso.textContent = t("grabando");
  });
}

// El navegador transcribe mientras el alumno habla (Chrome manda el audio a Google; Safari, a Apple).
const ERRORES_DICTADO = {
  "not-allowed": "mic_error",
  "service-not-allowed": "dictado_service",
  "audio-capture": "dictado_audio",
  network: "dictado_red",
  "language-not-supported": "dictado_idioma",
};
// Estos cortes son normales (silencio largo, otra pestaña): si el alumno no tocó Terminar, se sigue escuchando.
const CORTES_DICTADO = ["no-speech", "aborted"];

function dictadoDelNavegador(boton, etiqueta, aviso, alTranscribir) {
  // En Android, el modo continuo repite frases ya dichas; ahí se escucha frase por frase y se reanuda solo.
  const continuo = !/Android/i.test(navigator.userAgent);
  let rec = null;
  let escuchando = false;
  let huboTexto = false;
  let error = null;

  const terminar = () => {
    escuchando = false;
    boton.classList.remove("grabando");
    etiqueta.textContent = t("dictar");
    aviso.textContent = error && !CORTES_DICTADO.includes(error)
      ? t(ERRORES_DICTADO[error] || "dictado_fallo")
      : huboTexto ? t("dictado_listo") : t("no_se_escucho");
  };

  const escuchar = () => {
    rec = new (reconocedor())();
    rec.lang = t("idioma_dictado");
    rec.continuous = continuo;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let parcial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const texto = e.results[i][0].transcript.trim();
        if (!e.results[i].isFinal) parcial += ` ${texto}`;
        else if (texto) {
          alTranscribir(texto);
          huboTexto = true;
        }
      }
      aviso.textContent = parcial.trim() ? t("escuchando_parcial", parcial.trim()) : t("escuchando");
    };
    rec.onerror = (e) => { error = e.error; };
    rec.onend = () => {
      if (escuchando && (!error || CORTES_DICTADO.includes(error))) {
        error = null;
        try { return escuchar(); } catch { /* si no puede reanudar, termina */ }
      }
      terminar();
    };
    rec.start();
  };

  boton.addEventListener("click", () => {
    if (escuchando) {
      escuchando = false;
      return rec.stop();
    }
    escuchando = true;
    huboTexto = false;
    error = null;
    boton.classList.add("grabando");
    etiqueta.textContent = t("terminar");
    aviso.textContent = t("escuchando");
    try {
      escuchar();
    } catch {
      error = "service-not-allowed";
      terminar();
    }
  });
}

// redibujo: se vuelve a mostrar por el cambio de idioma; el mapa ya se actualizó.
// El feedback del tutor queda en el idioma en que se pidió.
function feedbackExplicacion(p, envio, r, primeroPrevio, redibujo = false) {
  const ev = r.evaluacion;
  const pv = vista(p);
  const extra = loc(r);
  const puntos = CLARIDAD.filter((k) => ev.claridad[k]).length;
  const bienExplicada = puntos >= 3;
  // El mapa se actualiza con el primer intento: es lo que pasaría en el examen.
  const primero = primeroPrevio || { correcta: r.correcta, seguridad: envio.seguridad, bienExplicada,
    error: ev.error_tipo !== "ninguno" ? ev.error_tipo : null };
  const nuevo = estadoDe(primero.correcta, primero.seguridad, primero.bienExplicada);
  if (!primeroPrevio && !redibujo) {
    registrar(p.ficha.id, nuevo, primero.error);
    estado.sesion.resultados.push({ p, correcta: primero.correcta });
  }

  const inferida = r.respuesta_inferida;
  const juicios = Object.fromEntries((ev.juicios || [])
    .filter((j) => j.juicio !== "no_dice").map((j) => [j.letra, j.juicio === "verdadera" ? "V" : "F"]));
  const porAfirmacion = ["vf_items", "multiple"].includes(p.tipo);
  let titulo;
  if (p.tipo === "completar") {
    const bien = r.huecos.filter((c, i) => (ev.huecos[i] || "").toLowerCase() === c.toLowerCase()).length;
    titulo = t("completabas", bien, r.huecos.length);
  } else if (porAfirmacion) {
    const verdaderas = verdaderasDe(p, r.clave);
    const letras = letrasAJuzgar(p);
    const bien = letras.filter((l) => juicios[l] === (verdaderas.includes(l) ? "V" : "F")).length;
    titulo = bien === letras.length ? t("acertabas_todas") : t("acertabas", bien, letras.length);
  } else {
    titulo = !inferida ? t("no_se_sabe")
      : r.correcta ? t("marcaste_bien", Boolean(envio.eleccion), inferida)
        : t("marcaste_mal", Boolean(envio.eleccion), inferida, r.clave);
  }
  let examen;
  if (p.tipo === "completar") {
    examen = completarHtml(pv, { elegidas: ev.huecos.map((h, n) => huecoAlIdioma(p, n, h)),
      correctas: r.huecos.map((h, n) => huecoAlIdioma(p, n, h)) });
  } else if (porAfirmacion) examen = afirmacionesHtml(pv, juicios, { verdaderas: verdaderasDe(p, r.clave) });
  else if (p.tipo === "combinada" || tieneGrilla(p)) {
    examen = `${afirmacionesHtml(pv, juicios, { verdaderas: verdaderasDe(p, r.clave) })}${grillaHtml(pv, inferida, { clave: r.clave })}`;
  } else examen = opcionesHtml(pv, { bloqueadas: true, clave: r.clave, elegida: inferida });
  const recurso = r.recurso_ubaxxi && r.recurso_ubaxxi !== "pendiente" ? esc(r.recurso_ubaxxi) : t("recurso_pendiente");

  app.innerHTML = `
    ${progresoHtml("explainer")}
    <div class="tarjeta">
      <div class="veredicto"><span class="punto" style="background:${r.correcta ? "var(--dominado)" : "var(--naranja)"}"></span>${titulo}</div>
      <p class="chico">${esc(ev.por_que_esa_respuesta)}</p>
      <div class="claridad">
        <p class="titulo">${t("claridad", puntos)}</p>
        <ul>${CLARIDAD.map((k) => `<li class="${ev.claridad[k] ? "si" : "no"}">${ev.claridad[k] ? "✓" : "✗"} ${t(`claridad_${k}`)}</li>`).join("")}</ul>
      </div>
      <blockquote class="tu-explicacion"><span class="eyebrow">${t("lo_que_explicaste", envio.dictada)}</span>${esc(envio.explicacion)}</blockquote>
    </div>
    <div class="tarjeta">
      <div class="fb"><div class="titulo">${t("explicaste_bien")}</div><p>${esc(ev.lo_que_explicaste_bien)}</p></div>
      ${ev.que_te_falto ? `<div class="fb"><div class="titulo">${t("que_te_falto")}${textoError(ev.error_tipo) ? ` · ${textoError(ev.error_tipo)}` : ""}</div><p>${esc(ev.que_te_falto)}</p></div>` : ""}
      <div class="fb"><div class="titulo">${t("razonamiento")}</div><p>${esc(ev.razonamiento_correcto)}</p></div>
      <div class="fb version-clara"><div class="titulo">${t("mas_claro")}</div><p>${esc(ev.version_mas_clara)}</p></div>
      <div class="fb"><div class="titulo">${t("para_reforzar")}</div><p>${esc(extra.pregunta_guia)}</p><p class="chico">${recurso}</p></div>
      <p class="chico">${primeroPrevio ? t("cuenta_primero") : t("ahora_figura")}<span class="estado" style="--c:${COLORES[nuevo]}">${nombreEstado(nuevo)}</span></p>
    </div>
    <div class="tarjeta">
      <p class="eyebrow">${t("asi_estaba")}</p>
      ${p.tipo === "completar" ? "" : `<p class="enunciado">${esc(pv.enunciado)}</p>`}
      ${examen}
      ${extra.explicacion_examen ? `<p class="chico">${esc(extra.explicacion_examen)}</p>` : ""}
    </div>
    <div class="acciones">
      ${envio.intento < MAX_INTENTOS ? `<button class="btn secundario" data-accion="reexplicar">${t("explicalo_de_nuevo")}</button>` : ""}
      <button class="btn" data-accion="siguiente">${botonSiguiente()}</button>
    </div>`;
  estado.reexplicar = { intento: envio.intento, seguridad: envio.seguridad, borrador: envio.explicacion,
    eleccion: envio.eleccion, primero };
  estado.redibujar = () => feedbackExplicacion(p, envio, r, primeroPrevio, true);
}

function siguiente() {
  const { sesion } = estado;
  sesion.i += 1;
  if (sesion.i >= sesion.preguntas.length) return resultado();
  sesion.modo === "practica" ? explicar() : pregunta();
}

function resultado() {
  const { sesion } = estado;
  const mapa = leerMapa();
  const filas = sesion.resultados.map((r) => ({ ...r, ficha: vista(r.p).ficha, estado: mapa[r.p.ficha.id]?.estado, error: mapa[r.p.ficha.id]?.error }));
  const conteo = filas.reduce((n, r) => ({ ...n, [r.estado]: (n[r.estado] || 0) + 1 }), {});
  const correctas = filas.filter((r) => r.correcta);
  const nota = filas.reduce((s, r) => s + (r.correcta ? r.p.puntos : 0), 0);
  const total = filas.reduce((s, r) => s + r.p.puntos, 0);
  const errores = filas.filter((r) => !r.correcta && r.error).reduce((n, r) => ({ ...n, [r.error]: (n[r.error] || 0) + 1 }), {});
  const masComun = Object.entries(errores).sort((a, b) => b[1] - a[1])[0];
  const orden = ["ciego", "laguna", "fragil", "dominado"];

  app.innerHTML = `
    <p class="eyebrow">${esc(loc(estado.materia).etiqueta)} · ${t(`resultado_${sesion.modo}`)}</p>
    <h1>${t("tu_mapa_de_hoy")}</h1>
    <p class="sub">${t("acertaste", correctas.length, filas.length)}${sesion.modo === "diagnostico" && filas.every((r) => r.p.puntos) ? t("puntaje", t("decimal", nota, 1), t("decimal", total, 0)) : ""}.
    ${masComun ? t("error_mas_repetido", esc(textoError(masComun[0]))) : ""}</p>
    ${resumenHtml(conteo)}
    <div class="tarjeta">
      <ul class="lista-fichas">
        ${[...filas].sort((a, b) => orden.indexOf(a.estado) - orden.indexOf(b.estado)).map((r) => `
          <li><span><span class="tema">${esc(r.ficha.tema)}</span><span class="autor">${esc(r.ficha.autor)}${!r.correcta && r.error ? ` · ${esc(textoError(r.error))}` : ""}</span></span>
          <span class="estado" style="--c:${COLORES[r.estado]}">${nombreEstado(r.estado)}</span></li>`).join("")}
      </ul>
    </div>
    <div class="acciones">
      <button class="btn" data-accion="practica" ${estado.servidor.ia ? "" : "disabled"}>${t("explicar_ciegos")}</button>
      ${sesion.modo === "demo" ? `<button class="btn secundario" data-accion="diagnostico">${t("diagnostico_completo")}</button>` : ""}
      <a class="btn secundario" href="#/${estado.carrera.id}/${estado.materia.id}">${t("ver_mapa")}</a>
    </div>
    ${estado.servidor.ia ? "" : `<div class="aviso" style="margin-top:16px">${t("falta_tutor_practica")}</div>`}`;
  estado.redibujar = resultado;
}

// ---------- navegación ----------
// #/ landing · #/carreras · #/<carrera> materias · #/<carrera>/<materia> mapa y diagnóstico.
// El diagnóstico y la práctica corren dentro de la página de la materia, sin cambiar la dirección.

async function mostrar() {
  const [carreraId, materiaId] = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  estado.sesion = null;
  window.scrollTo(0, 0);
  app.classList.toggle("ancho", !carreraId);
  if (!carreraId) return landing();
  if (carreraId === "mcp") return verMcp();
  if (carreraId === "carreras") return verCarreras();
  const carrera = estado.catalogo.find((c) => c.id === carreraId);
  if (!carrera) return verCarreras();
  if (!materiaId) return verMaterias(carrera);
  const materia = carrera.materias.find((m) => m.id === materiaId && m.disponible);
  if (!materia) return verMaterias(carrera);
  if (estado.materia?.id !== materia.id) {
    app.innerHTML = `<div class="tarjeta"><div class="cargando">${t("cargando_materia")}</div></div>`;
    estado.fichas = await api(`/api/fichas?materia=${materia.id}`);
  }
  estado.carrera = carrera;
  estado.materia = materia;
  verMateria();
}

window.addEventListener("hashchange", () => {
  // Los links internos de la Home (#como-funciona) no son rutas.
  if (location.hash && !location.hash.startsWith("#/")) return;
  mostrar().catch(mostrarError);
});

function mostrarError(error) {
  app.innerHTML = `<div class="aviso">${esc(error.message)}</div>`;
  estado.redibujar = null;
}

// Los textos fijos de index.html (barra, pie, título) y el selector de idioma.
function textosFijos() {
  document.documentElement.lang = t("html_lang");
  document.title = t("titulo_pagina");
  document.querySelector('meta[name="description"]')?.setAttribute("content", t("descripcion_pagina"));
  document.querySelectorAll("[data-t]").forEach((el) => { el.textContent = t(el.dataset.t); });
  document.querySelector(".idiomas")?.setAttribute("aria-label", t("cambiar_idioma"));
  document.querySelectorAll("[data-idioma]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.idioma === idioma));
}

function cambiarIdioma(nuevo) {
  if (nuevo === idioma || !IDIOMAS.includes(nuevo)) return;
  idioma = nuevo;
  try { localStorage.setItem("preptest.idioma", idioma); } catch { /* sin almacenamiento */ }
  textosFijos();
  estado.redibujar?.();
}

document.addEventListener("click", async (e) => {
  const boton = e.target.closest("[data-idioma]");
  if (boton) return cambiarIdioma(boton.dataset.idioma);
  const copiar = e.target.closest("[data-copiar]");
  if (copiar) return copiarTexto(copiar);
  const ancla = e.target.closest("[data-ancla]");
  if (ancla) {
    // Links internos de la landing: no cambian la ruta.
    e.preventDefault();
    return document.querySelector(ancla.getAttribute("href"))?.scrollIntoView({ behavior: "smooth" });
  }
  const accion = e.target.closest("[data-accion]");
  if (!accion) return;
  const a = accion.dataset.accion;
  try {
    if (a === "diagnostico" || a === "demo" || a === "practica") await empezar(a);
    else if (a === "siguiente") siguiente();
    else if (a === "reexplicar") explicar({ previa: estado.reexplicar });
    else if (a === "salir") verMateria();
    else if (a === "borrar" && confirm(t("confirmar_borrar"))) { guardarMapa({}); verMateria(); }
  } catch (error) {
    mostrarError(error);
  }
});

(async () => {
  migrarMapaViejo();
  textosFijos();
  try {
    [estado.servidor, estado.catalogo] = await Promise.all([api("/api/estado"), api("/api/catalogo")]);
    await mostrar();
  } catch (error) {
    mostrarError(new Error(t("sin_conexion", error.message)));
  }
})();
