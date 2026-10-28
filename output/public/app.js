// PrepTest UBA XXI: diagnóstico, práctica con explicación y mapa del alumno.
// Las reglas pedagógicas están en rules/00_modelo_de_aprendizaje.md.

const app = document.getElementById("app");

const ESTADOS = {
  ciego: { nombre: "Punto ciego", color: "var(--ciego)", ayuda: "Creías que sabías y no" },
  laguna: { nombre: "Laguna", color: "var(--laguna)", ayuda: "Sabés que no sabés" },
  fragil: { nombre: "Frágil", color: "var(--fragil)", ayuda: "Lo sabés, pero no lo sostenés" },
  dominado: { nombre: "Dominado", color: "var(--dominado)", ayuda: "Lo sabés y lo explicás" },
};
const ORDEN_PRACTICA = ["ciego", "laguna", "fragil", undefined, "dominado"];

const ERRORES = {
  concepto_vecino: "Confundís conceptos parecidos",
  cambio_de_palabra: "Se te pasó una palabra cambiada",
  anacronismo: "Ubicaste algo en otra época",
  hecho_equivocado: "Atribuiste un hecho que no corresponde",
  dato_inventado: "Aceptaste un dato que el texto no dice",
  absoluto_falso: "Te convenció un \"siempre\" o un \"nunca\"",
  motivo_equivocado: "Veredicto bien, motivo mal",
  media_verdad: "Te quedaste con la mitad cierta",
  verdad_general: "Respondiste con sentido común y no con el autor",
};

const SEGURIDAD = [["seguro", "Seguro"], ["dudo", "Dudo"], ["adivine", "Adiviné"]];

// servidor: cómo llega a Claude · catalogo: carreras y materias · carrera/materia: lo que eligió el alumno
const estado = { servidor: null, catalogo: [], carrera: null, materia: null, fichas: [], sesion: null };

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
  const res = await fetch(ruta, cuerpo ? {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo),
  } : undefined);
  const datos = await res.json();
  if (!res.ok) throw new Error(datos.error || "Error del servidor.");
  return datos;
}

function opcionesHtml(p, { bloqueadas = false, clave = null, elegida = null } = {}) {
  return `<fieldset class="opciones${bloqueadas ? " bloqueadas" : ""}">
    <legend class="eyebrow" style="padding:0">Opciones</legend>
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

function combina(texto) {
  const m = String(texto).match(/^Las opciones correctas son (.*)/);
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
    <p class="eyebrow">${verdaderas ? "Tus marcas" : p.tipo === "multiple"
      ? "Marcá cada opción como correcta (V) o incorrecta (F): puede haber más de una correcta"
      : "Marcá cada afirmación como verdadera o falsa"}</p>
    ${letrasAJuzgar(p).map((l) => {
      const real = verdaderas && (verdaderas.includes(l) ? "V" : "F");
      const bien = real && marcas[l] === real;
      return `<div class="afirmacion${real ? (bien ? " correcta" : " incorrecta") : ""}">
        <span class="letra">${l}</span>
        <span class="texto">${esc(p.opciones[l])}${real ? `<small>${bien ? "Bien" : `Era ${real === "V" ? "verdadera" : "falsa"}`}</small>` : ""}</span>
        <span class="vf" role="group" aria-label="Afirmación ${l}">
          ${[["V", "Verdadera"], ["F", "Falsa"]].map(([v, nombre]) => `<button type="button" data-marca="${l}" data-valor="${v}"
            aria-pressed="${marcas[l] === v}" aria-label="${nombre}" title="${nombre}" ${real ? "disabled" : ""}>${v}</button>`).join("")}
        </span>
      </div>`;
    }).join("")}
  </div>`;
}

function grillaHtml(p, letra, { clave = null } = {}) {
  const combinaciones = Object.entries(p.opciones).filter(([, t]) => combina(t));
  let mensaje;
  if (clave) mensaje = `Respuesta correcta en la grilla: <b>${clave}</b>${letra && letra !== clave ? ` · tus marcas daban la ${letra}` : ""}`;
  else if (letra === null) mensaje = "Cuando marques las cuatro, te muestro qué letra iría en la grilla.";
  else if (letra === "") mensaje = "Ninguna opción del examen coincide con tus marcas: revisalas.";
  else mensaje = `Tu respuesta en la grilla: <b>${letra}</b>`;
  return `<div class="grilla">
    <p class="titulo">${mensaje}</p>
    <ul>${combinaciones.map(([l, t]) => `<li class="${l === (clave || letra) ? "activa" : ""}"><span class="letra">${l}</span>${esc(t.replace(/^Las opciones correctas son /, "").replace(/\.$/, ""))}</li>`).join("")}</ul>
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
      return `${texto}<select data-hueco="${n}" aria-label="Hueco ${n + 1}"><option value="">elegí…</option>${
        p.huecos[n].opciones.map((o) => `<option${elegidas[n] === o ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
    }
    const bien = elegidas[n] && elegidas[n].toLowerCase() === String(correctas[n]).toLowerCase();
    return `${texto}<span class="hueco ${bien ? "bien" : "mal"}">${esc(correctas[n])}${!bien ? `<small>${elegidas[n] ? `pusiste «${esc(elegidas[n])}»` : "no lo completaste"}</small>` : ""}</span>`;
  }).join("")}</p>`;
}

// ---------- vistas ----------

const PASOS = [
  ["Mapeo", "Respondés preguntas de exámenes reales y marcás qué tan seguro estás. Así aparecen tus puntos ciegos: lo que creés que sabés y no sabés."],
  ["Preparar", "Te decimos qué estudiar primero, según lo que más se toma y lo que menos dominás, y te llevamos al video o la guía del campus de UBA XXI."],
  ["Explicar", "En el Explainer Mode no hay opciones para elegir: explicás la pregunta con tus palabras, escrita o dictada."],
  ["Feedback", "Un tutor de IA lee tu explicación contra lo que dice el autor, te dice qué habrías marcado en el examen y qué tan claro fuiste."],
];

function avisoIa() {
  const { ia } = estado.servidor;
  if (!ia) return `<div class="aviso">Falta conectar el tutor de IA (los pasos están en <code>output/README.md</code>). El diagnóstico funciona igual; la práctica necesita al tutor.</div>`;
  if (ia === "sesion") return `<div class="aviso info">Modo local: el tutor usa la sesión de IA de esta computadora.</div>`;
  return "";
}

function landing() {
  const disponibles = estado.catalogo.flatMap((c) => c.materias.filter((m) => m.disponible));
  const preguntas = disponibles.reduce((n, m) => n + m.preguntas, 0);
  const cuatris = [...new Set(disponibles.flatMap((m) => m.cuatrimestres))].sort();
  const anios = cuatris.map((c) => c.slice(-4));
  app.innerHTML = `
    <section class="hero">
      <p class="eyebrow">UBA XXI · CBC</p>
      <h1>Prepará tu parcial con un tutor que detecta lo que todavía no <span class="kw">entendés</span></h1>
      <p class="sub">PrepTest no es otra plataforma de clases. Es el entrenamiento que va arriba del campus de UBA XXI: te muestra qué entendiste de verdad, qué tenés que practicar y qué tan preparado llegás al examen.</p>
      <div class="acciones">
        <a class="btn" href="#/carreras">Elegí tu carrera</a>
        <a class="btn secundario" href="#como-funciona" data-ancla>Cómo funciona</a>
      </div>
    </section>

    <section id="como-funciona" class="seccion">
      <p class="eyebrow">Cómo funciona</p>
      <h2>Cuatro pasos, del diagnóstico al <span class="kw">examen</span></h2>
      <ol class="pasos">
        ${PASOS.map(([titulo, texto], i) => `<li class="tarjeta"><span class="numero">${i + 1}</span><h3>${titulo}</h3><p>${texto}</p></li>`).join("")}
      </ol>
    </section>

    <section class="banda">
      <p class="eyebrow">El principio</p>
      <p class="cita">Si lo podés explicar, lo <span class="kw">entendés</span>.</p>
      <p>El parcial pregunta el "porque": hay opciones con el veredicto correcto y el motivo equivocado. Por eso acá no alcanza con elegir la letra: practicás explicando, que es lo que te evalúan.</p>
    </section>

    <section class="seccion">
      <p class="eyebrow">Qué tiene de distinto</p>
      <h2>Entrenás con lo que se <span class="kw">toma</span></h2>
      <div class="rasgos">
        <div><h3>Preguntas de exámenes reales</h3><p>${preguntas} preguntas tomadas entre ${anios[0]} y ${anios.at(-1)}, ordenadas por cuántas veces se repiten.</p></div>
        <div><h3>Tu mapa, idea por idea</h3><p>Cada idea que puede caer queda marcada como dominada, frágil, laguna o punto ciego.</p></div>
        <div><h3>El campus de UBA XXI</h3><p>Para estudiar te mandamos a los videos y guías oficiales: no repetimos contenidos que ya existen.</p></div>
      </div>
      <div class="acciones"><a class="btn" href="#/carreras">Elegí tu carrera</a></div>
    </section>`;
}

function verCarreras() {
  app.innerHTML = `
    <p class="eyebrow">Paso 1 de 2</p>
    <h1>Elegí tu <span class="kw">carrera</span></h1>
    <p class="sub">Te mostramos las materias del CBC que se cursan por UBA XXI.</p>
    <div class="grilla-tarjetas">
      ${estado.catalogo.map((c) => {
        const listas = c.materias.filter((m) => m.disponible).length;
        return `<a class="tarjeta eleccion" href="#/${c.id}">
          <h2>${esc(c.nombre)}</h2><p>${esc(c.descripcion)}</p>
          <span class="chico">${c.materias.length} materias · ${listas} ${listas === 1 ? "disponible" : "disponibles"}</span>
        </a>`;
      }).join("")}
      <div class="tarjeta eleccion apagada"><h2>Otras carreras</h2><p>Las sumamos de a una, empezando por las materias que comparten.</p><span class="chico">Próximamente</span></div>
    </div>`;
}

function verMaterias(carrera) {
  app.innerHTML = `
    <p class="eyebrow"><a href="#/carreras">Carreras</a> · ${esc(carrera.nombre)} · Paso 2 de 2</p>
    <h1>Elegí la <span class="kw">materia</span></h1>
    <p class="sub">Empezamos por una cátedra por materia. Las demás van llegando.</p>
    <div class="grilla-tarjetas">
      ${carrera.materias.map((m) => {
        const mapa = m.disponible ? leerMapa(m.id) : {};
        const vistas = Object.keys(mapa).length;
        const contenido = `<p class="eyebrow">${esc(m.sigla)} (${m.codigo})</p><h3>${esc(m.nombre)}</h3>`;
        return m.disponible
          ? `<a class="tarjeta eleccion" href="#/${carrera.id}/${m.id}">${contenido}
              <p>Cátedra ${esc(m.catedra)} · ${esc(m.instancia)}</p>
              <span class="chico">${m.fichas} ideas · ${vistas ? `trabajaste ${vistas}` : "sin empezar"}</span></a>`
          : `<div class="tarjeta eleccion apagada">${contenido}<span class="chico">Próximamente</span></div>`;
      }).join("")}
    </div>`;
}

function resumenHtml(conteo) {
  return `<div class="resumen">${Object.entries(ESTADOS).map(([k, e]) =>
    `<div style="--c:${e.color}"><b>${conteo[k] || 0}</b><small>${e.nombre}</small></div>`).join("")}</div>`;
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
  const { carrera, materia, fichas, servidor } = estado;
  const mapa = leerMapa();
  const vistas = Object.keys(mapa).length;
  const conteo = Object.values(mapa).reduce((n, m) => ({ ...n, [m.estado]: (n[m.estado] || 0) + 1 }), {});
  const ejes = { conceptos: "Conceptos", videos: "Videos de la cátedra", historia: "Historia argentina (Romero)" };
  app.innerHTML = `
    <p class="eyebrow"><a href="#/carreras">Carreras</a> · <a href="#/${carrera.id}">${esc(carrera.nombre)}</a> · ${esc(materia.etiqueta)}</p>
    <h1>${esc(materia.nombre)}: tu <span class="kw">mapa</span></h1>
    ${avisoIa()}
    <div class="tarjeta destacada">
      ${vistas
        ? `<h2>${vistas} de ${fichas.length} ideas trabajadas</h2>
           <p>En el Explainer Mode no hay opciones: explicás cada pregunta, escrita o dictada, y el tutor te dice qué habrías marcado y qué tan claro fuiste. Empieza siempre por tus puntos ciegos.</p>`
        : `<h2>Empezá por el diagnóstico</h2>
           <p>18 preguntas de ${/final/i.test(materia.instancia) ? (/parcial/i.test(materia.instancia) ? "exámenes" : "finales") : "parciales"} reales, sin reloj y sin correcciones en el medio. Al final ves tu mapa: qué dominás y dónde están tus puntos ciegos. Si querés probar cómo funciona, el Quick Demo son 4.</p>`}
      <div class="acciones">
        <button class="btn${vistas ? " secundario" : ""}" data-accion="diagnostico">${vistas ? "Repetir el diagnóstico" : "Hacer el diagnóstico"}</button>
        <button class="btn secundario" data-accion="demo">Quick Demo · 4 preguntas</button>
        <button class="btn${vistas ? "" : " secundario"}" data-accion="practica" ${servidor.ia ? "" : "disabled"}>Practicar en Explainer Mode</button>
      </div>
    </div>
    ${resumenHtml(conteo)}
    <div class="leyenda">${Object.values(ESTADOS).map((e) => `<span style="--c:${e.color}">${e.nombre}: ${e.ayuda.toLowerCase()}</span>`).join("")}<span>Sin ver todavía</span></div>
    ${gruposDelMapa(fichas, ejes).map(([nombre, lista]) => `
      <div class="tarjeta">
        <h3>${esc(nombre)}</h3>
        <ul class="lista-fichas">
          ${lista.sort((a, b) => b.veces - a.veces).map((f) => {
            const m = mapa[f.id];
            return `<li><span><span class="tema">${esc(f.tema)}</span><span class="autor">${esc(f.autor)} · tomada ${f.veces} ${f.veces === 1 ? "vez" : "veces"}${m?.error && m.estado !== "dominado" ? ` · ${esc(ERRORES[m.error] || "")}` : ""}</span></span>
              <span class="estado" style="--c:${m ? ESTADOS[m.estado].color : "var(--sin-ver)"}">${m ? ESTADOS[m.estado].nombre : "Sin ver"}</span></li>`;
          }).join("")}
        </ul>
      </div>`).join("")}
    ${vistas ? `<div class="acciones"><button class="btn secundario" data-accion="borrar">Borrar mi mapa de esta materia</button></div>` : ""}`;
}

async function empezar(modo) {
  app.innerHTML = `<div class="tarjeta"><div class="cargando">Armando tus preguntas…</div></div>`;
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
    <span class="chico">${sesion.i + 1} de ${sesion.preguntas.length}</span>
    <div class="barra-p"><i style="width:${(sesion.i / sesion.preguntas.length) * 100}%"></i></div>
    <span class="chico">${modo}</span>
  </div>`;
}

function cabeceraHtml(p, { sinEnunciado = false } = {}) {
  const puntos = p.puntos ? ` · ${String(p.puntos).replace(".", ",")} ${p.puntos === 1 ? "punto" : "puntos"}` : "";
  // En las de relacionar el autor es la respuesta: la etiqueta no lo puede mostrar.
  const etiqueta = p.relacionar ? "Relacionar" : esc(p.ficha.autor);
  return `<span class="etiqueta">${etiqueta}${puntos}</span>
    ${sinEnunciado ? "" : `<p class="enunciado">${esc(p.enunciado)}</p>`}`;
}

// Qué ve y qué tiene que explicar el alumno en el Explainer Mode, según el tipo.
function consignaExplicar(p) {
  if (p.tipo === "vf_justificada") return "¿Es verdadero o falso? Explicá por qué, según el autor.";
  if (p.tipo === "combinada" || tieneGrilla(p)) return "¿Cuáles de estas afirmaciones son correctas? Explicá por qué, según el autor.";
  if (p.pide_opciones) return "Elegí una opción y explicá por qué es la correcta.";
  if (p.tipo === "vf_items") return "¿Cuáles de estas afirmaciones son verdaderas y cuáles falsas? Explicá por qué.";
  if (p.tipo === "multiple") return "¿Cuáles de estas opciones son correctas? Puede haber más de una. Explicá por qué.";
  if (p.tipo === "completar") return "¿Con qué completarías cada hueco? Decilo y explicá por qué.";
  if (p.relacionar && /^¿Qué concepto/.test(p.enunciado)) return "¿Qué concepto es? Nombralo y explicá por qué le corresponde esa definición, y de qué autor es.";
  if (p.relacionar) return "¿Qué autor es? Nombralo y explicá por qué ese concepto es suyo.";
  return "Respondé con tus palabras y explicá por qué.";
}

function seguridadHtml() {
  return `<div class="bloque">
    <p class="titulo">¿Qué tan seguro estás?</p>
    <div class="seguridad" role="group" aria-label="Seguridad">
      ${SEGURIDAD.map(([v, t]) => `<button type="button" data-seguridad="${v}" aria-pressed="false">${t}</button>`).join("")}
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
  return estado.sesion.i + 1 < estado.sesion.preguntas.length ? "Siguiente pregunta" : "Ver cómo me fue";
}

// ---------- diagnóstico: formato del examen, sin correcciones en el medio ----------

function pregunta() {
  const { sesion } = estado;
  const p = sesion.preguntas[sesion.i];
  const combinada = p.tipo === "combinada";
  const porAfirmacion = ["combinada", "vf_items", "multiple"].includes(p.tipo);
  const cuerpo = p.tipo === "completar" ? completarHtml(p)
    : combinada ? `${afirmacionesHtml(p)}<div id="grilla">${grillaHtml(p, null)}</div>`
      : porAfirmacion ? afirmacionesHtml(p) : opcionesHtml(p);
  app.innerHTML = `
    ${progresoHtml(estado.sesion.modo === "demo" ? "Quick Demo" : "Diagnóstico")}
    <form class="tarjeta" id="form-pregunta">
      ${cabeceraHtml(p, { sinEnunciado: p.tipo === "completar" })}
      ${cuerpo}
      ${seguridadHtml()}
      <div class="acciones">
        <button class="btn" type="submit" disabled>Siguiente</button>
        <button class="btn secundario" type="button" data-accion="salir">Salir</button>
      </div>
    </form>`;

  const form = document.getElementById("form-pregunta");
  const boton = form.querySelector("[type=submit]");
  const marcas = {};
  const todasMarcadas = () => letrasAJuzgar(p).every((l) => marcas[l]);
  const huecos = () => [...form.querySelectorAll("[data-hueco]")].map((s) => s.value);
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
    if (combinada) document.getElementById("grilla").innerHTML = grillaHtml(p, letraDeLaGrilla(p, marcas));
    listo();
  }));
  form.addEventListener("change", listo);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const respuesta = { materia: estado.materia.id, pregunta_id: p.id, version: p.version, ...respuestaDada() };
    boton.disabled = true;
    boton.textContent = "Guardando…";
    try {
      const r = await api("/api/responder", respuesta);
      sesion.resultados.push({ p, ...respuesta, ...r });
      registrar(p.ficha.id, estadoDe(r.correcta, seguridad()), r.error_probable);
      siguiente();
    } catch (error) {
      boton.disabled = false;
      boton.textContent = "Probar de nuevo";
      form.insertAdjacentHTML("beforeend", `<div class="aviso" style="margin-top:14px">${esc(error.message)}</div>`);
    }
  });
}

// ---------- Explainer Mode: el alumno explica sin opciones y Claude deduce qué habría marcado ----------

const CLARIDAD = [
  ["dice_la_respuesta", "Dice qué respondés"],
  ["da_el_motivo_del_autor", "Da el motivo del autor"],
  ["usa_bien_los_conceptos", "Usa bien los conceptos"],
  ["se_entiende_sin_ambiguedad", "Se entiende sin ambigüedad"],
];
const MAX_INTENTOS = 3;

const MICROFONO = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>`;
// Dictado del navegador (Chrome, Edge, Safari): se usa cuando el servidor no tiene Whisper, como en la nube.
const reconocedor = () => window.SpeechRecognition || window.webkitSpeechRecognition;

function listaAfirmacionesHtml(p) {
  return `<ul class="lista-afirmaciones">${letrasAJuzgar(p).map((l) =>
    `<li><span class="letra">${l}</span><span>${esc(p.opciones[l])}</span></li>`).join("")}</ul>`;
}

function explicar({ previa = null } = {}) {
  const { sesion, servidor } = estado;
  const p = sesion.preguntas[sesion.i];
  const intento = previa ? previa.intento + 1 : 1;
  // Se muestran solo las afirmaciones a juzgar; las opciones para elegir quedan ocultas, salvo que
  // la pregunta no se pueda contestar sin verlas ("¿Cuál de las siguientes…?").
  const muestraItems = ["combinada", "vf_items", "multiple"].includes(p.tipo) || tieneGrilla(p);
  const eligeOpcion = p.pide_opciones && !muestraItems;
  app.innerHTML = `
    ${progresoHtml("Explainer Mode")}
    <form class="tarjeta" id="form-explicar">
      ${cabeceraHtml(p)}
      ${muestraItems ? listaAfirmacionesHtml(p) : eligeOpcion ? opcionesHtml(p, { elegida: previa?.eleccion }) : ""}
      ${previa ? `<div class="pista"><b>Explicalo de nuevo</b>Usá lo que viste en el feedback, pero con tus palabras. En el mapa cuenta tu primer intento.</div>` : ""}
      <div class="bloque">
        <label class="titulo" for="explicacion">${consignaExplicar(p)}</label>
        <textarea id="explicacion" maxlength="4000" placeholder="Explicalo como si se lo contaras a un compañero.">${esc(previa?.borrador || "")}</textarea>
        ${servidor.dictado || reconocedor()
          ? `<div class="dictado"><button type="button" class="btn secundario" id="grabar">${MICROFONO}<span>Dictar</span></button>
             <span class="chico" id="estado-dictado">Hablá con tus palabras; después podés corregir el texto.</span></div>`
          : `<p class="chico">El dictado no está disponible: escribí tu explicación.</p>`}
      </div>
      ${intento === 1 ? seguridadHtml() : ""}
      <div class="acciones">
        <button class="btn" type="submit" disabled>Enviar mi explicación</button>
        <button class="btn secundario" type="button" data-accion="salir">Salir</button>
      </div>
    </form>`;

  const form = document.getElementById("form-explicar");
  const boton = form.querySelector("[type=submit]");
  const caja = form.querySelector("#explicacion");
  let dictada = false;
  const eleccion = () => form.querySelector("input[name=opcion]:checked")?.value;
  const listo = () => {
    boton.disabled = !(caja.value.trim().length >= 10 && (!eligeOpcion || eleccion()) && (intento > 1 || seguridad()));
  };
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
    const envio = { materia: estado.materia.id, pregunta_id: p.id, version: p.version, intento,
      seguridad: seguridad(), explicacion: caja.value, dictada, eleccion: eligeOpcion ? eleccion() : undefined };
    boton.disabled = true;
    boton.textContent = "El tutor está leyendo tu explicación…";
    try {
      const r = await api("/api/explicar", envio);
      feedbackExplicacion(p, envio, r, previa?.primero);
    } catch (error) {
      boton.disabled = false;
      boton.textContent = "Probar de nuevo";
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
      aviso.textContent = "No pude usar el micrófono: revisá el permiso del navegador.";
      return;
    }
    const partes = [];
    const inicio = Date.now();
    grabador = new MediaRecorder(microfono);
    grabador.addEventListener("dataavailable", (e) => { if (e.data.size) partes.push(e.data); });
    const reloj = setInterval(() => {
      aviso.textContent = `Grabando… ${Math.round((Date.now() - inicio) / 1000)} s. Tocá Terminar cuando acabes.`;
    }, 500);
    grabador.addEventListener("stop", async () => {
      clearInterval(reloj);
      microfono.getTracks().forEach((t) => t.stop());
      boton.classList.remove("grabando");
      etiqueta.textContent = "Dictar";
      boton.disabled = true;
      aviso.textContent = "Transcribiendo con Whisper…";
      try {
        const tipo = grabador.mimeType || "audio/webm";
        const res = await fetch(`/api/transcribir?materia=${estado.materia.id}`, {
          method: "POST", headers: { "content-type": tipo }, body: new Blob(partes, { type: tipo }),
        });
        const datos = await res.json();
        if (!res.ok) throw new Error(datos.error || "No se pudo transcribir.");
        if (datos.texto) alTranscribir(datos.texto);
        aviso.textContent = datos.texto ? "Listo: revisá el texto y corregí lo que haga falta." : "No se escuchó nada. Probá de nuevo.";
      } catch (error) {
        aviso.textContent = error.message;
      }
      boton.disabled = false;
    });
    grabador.start();
    boton.classList.add("grabando");
    etiqueta.textContent = "Terminar";
    aviso.textContent = "Grabando… Tocá Terminar cuando acabes.";
  });
}

// El navegador transcribe mientras el alumno habla (Chrome manda el audio a Google; Safari, a Apple).
const ERRORES_DICTADO = {
  "not-allowed": "No pude usar el micrófono: revisá el permiso del navegador.",
  "service-not-allowed": "Este navegador no deja dictar: probá con Chrome o escribí tu explicación.",
  "audio-capture": "No encontré un micrófono.",
  network: "El dictado necesita internet: revisá la conexión o escribí tu explicación.",
  "language-not-supported": "Este navegador no dicta en español: probá con Chrome o escribí tu explicación.",
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
    etiqueta.textContent = "Dictar";
    aviso.textContent = error && !CORTES_DICTADO.includes(error)
      ? ERRORES_DICTADO[error] || "No se pudo dictar. Probá de nuevo o escribí tu explicación."
      : huboTexto ? "Listo: revisá el texto y corregí lo que haga falta." : "No se escuchó nada. Probá de nuevo.";
  };

  const escuchar = () => {
    rec = new (reconocedor())();
    rec.lang = "es-AR";
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
      aviso.textContent = parcial.trim() ? `Escuchando: «${parcial.trim()}»` : "Escuchando… Tocá Terminar cuando acabes.";
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
    etiqueta.textContent = "Terminar";
    aviso.textContent = "Escuchando… Tocá Terminar cuando acabes.";
    try {
      escuchar();
    } catch {
      error = "service-not-allowed";
      terminar();
    }
  });
}

function feedbackExplicacion(p, envio, r, primeroPrevio) {
  const ev = r.evaluacion;
  const puntos = CLARIDAD.filter(([k]) => ev.claridad[k]).length;
  const bienExplicada = puntos >= 3;
  // El mapa se actualiza con el primer intento: es lo que pasaría en el examen.
  const primero = primeroPrevio || { correcta: r.correcta, seguridad: envio.seguridad, bienExplicada,
    error: ev.error_tipo !== "ninguno" ? ev.error_tipo : null };
  const nuevo = estadoDe(primero.correcta, primero.seguridad, primero.bienExplicada);
  if (!primeroPrevio) {
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
    titulo = `Con tu explicación completabas bien ${bien} de ${r.huecos.length} ${r.huecos.length === 1 ? "hueco" : "huecos"}`;
  } else if (porAfirmacion) {
    const verdaderas = verdaderasDe(p, r.clave);
    const letras = letrasAJuzgar(p);
    const bien = letras.filter((l) => juicios[l] === (verdaderas.includes(l) ? "V" : "F")).length;
    titulo = bien === letras.length ? "Con tu explicación acertabas todas las afirmaciones"
      : `Con tu explicación acertabas ${bien} de ${letras.length} afirmaciones`;
  } else {
    const marcabas = envio.eleccion ? "Elegiste" : "Con tu explicación marcabas";
    titulo = !inferida ? "Con tu explicación no se puede saber qué marcarías"
      : r.correcta ? `${marcabas} la ${inferida}: es la correcta`
        : `${marcabas} la ${inferida}; la correcta es la ${r.clave}`;
  }
  let examen;
  if (p.tipo === "completar") examen = completarHtml(p, { elegidas: ev.huecos, correctas: r.huecos });
  else if (porAfirmacion) examen = afirmacionesHtml(p, juicios, { verdaderas: verdaderasDe(p, r.clave) });
  else if (p.tipo === "combinada" || tieneGrilla(p)) {
    examen = `${afirmacionesHtml(p, juicios, { verdaderas: verdaderasDe(p, r.clave) })}${grillaHtml(p, inferida, { clave: r.clave })}`;
  } else examen = opcionesHtml(p, { bloqueadas: true, clave: r.clave, elegida: inferida });
  const recurso = r.recurso_ubaxxi && r.recurso_ubaxxi !== "pendiente" ? esc(r.recurso_ubaxxi)
    : "El video o la guía del campus de UBA XXI para esta idea todavía no está asignado.";

  app.innerHTML = `
    ${progresoHtml("Explainer Mode")}
    <div class="tarjeta">
      <div class="veredicto"><span class="punto" style="background:${r.correcta ? "var(--dominado)" : "var(--naranja)"}"></span>${titulo}</div>
      <p class="chico">${esc(ev.por_que_esa_respuesta)}</p>
      <div class="claridad">
        <p class="titulo">Claridad: <b>${puntos} de 4</b></p>
        <ul>${CLARIDAD.map(([k, nombre]) => `<li class="${ev.claridad[k] ? "si" : "no"}">${ev.claridad[k] ? "✓" : "✗"} ${nombre}</li>`).join("")}</ul>
      </div>
      <blockquote class="tu-explicacion"><span class="eyebrow">Lo que explicaste${envio.dictada ? " (dictado)" : ""}</span>${esc(envio.explicacion)}</blockquote>
    </div>
    <div class="tarjeta">
      <div class="fb"><div class="titulo">Lo que explicaste bien</div><p>${esc(ev.lo_que_explicaste_bien)}</p></div>
      ${ev.que_te_falto ? `<div class="fb"><div class="titulo">Qué te faltó${ERRORES[ev.error_tipo] ? ` · ${ERRORES[ev.error_tipo]}` : ""}</div><p>${esc(ev.que_te_falto)}</p></div>` : ""}
      <div class="fb"><div class="titulo">El razonamiento correcto</div><p>${esc(ev.razonamiento_correcto)}</p></div>
      <div class="fb version-clara"><div class="titulo">Así lo explicarías más claro</div><p>${esc(ev.version_mas_clara)}</p></div>
      <div class="fb"><div class="titulo">Para reforzar</div><p>${esc(r.pregunta_guia)}</p><p class="chico">${recurso}</p></div>
      <p class="chico">${primeroPrevio ? "En el mapa cuenta tu primer intento: " : "Ahora esta idea figura en tu mapa como "}<span class="estado" style="--c:${ESTADOS[nuevo].color}">${ESTADOS[nuevo].nombre}</span></p>
    </div>
    <div class="tarjeta">
      <p class="eyebrow">Así estaba en el examen</p>
      ${p.tipo === "completar" ? "" : `<p class="enunciado">${esc(p.enunciado)}</p>`}
      ${examen}
      ${r.explicacion_examen ? `<p class="chico">${esc(r.explicacion_examen)}</p>` : ""}
    </div>
    <div class="acciones">
      ${envio.intento < MAX_INTENTOS ? `<button class="btn secundario" data-accion="reexplicar">Explicalo de nuevo</button>` : ""}
      <button class="btn" data-accion="siguiente">${botonSiguiente()}</button>
    </div>`;
  estado.reexplicar = { intento: envio.intento, seguridad: envio.seguridad, borrador: envio.explicacion,
    eleccion: envio.eleccion, primero };
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
  const filas = sesion.resultados.map((r) => ({ ...r, estado: mapa[r.p.ficha.id]?.estado, error: mapa[r.p.ficha.id]?.error }));
  const conteo = filas.reduce((n, r) => ({ ...n, [r.estado]: (n[r.estado] || 0) + 1 }), {});
  const correctas = filas.filter((r) => r.correcta);
  const nota = filas.reduce((s, r) => s + (r.correcta ? r.p.puntos : 0), 0);
  const total = filas.reduce((s, r) => s + r.p.puntos, 0);
  const errores = filas.filter((r) => !r.correcta && r.error).reduce((n, r) => ({ ...n, [r.error]: (n[r.error] || 0) + 1 }), {});
  const masComun = Object.entries(errores).sort((a, b) => b[1] - a[1])[0];
  const orden = ["ciego", "laguna", "fragil", "dominado"];

  app.innerHTML = `
    <p class="eyebrow">${esc(estado.materia.etiqueta)} · ${{ diagnostico: "Resultado del diagnóstico", demo: "Resultado del Quick Demo" }[sesion.modo] || "Resultado de la práctica"}</p>
    <h1>Tu <span class="kw">mapa</span> de hoy</h1>
    <p class="sub">Acertaste ${correctas.length} de ${filas.length}${sesion.modo === "diagnostico" && filas.every((r) => r.p.puntos) ? `: con el puntaje del examen serían ${nota.toFixed(1).replace(".", ",")} de ${total.toFixed(0)} puntos` : ""}.
    ${masComun ? ` Tu error más repetido: <b>${esc(ERRORES[masComun[0]])}</b>.` : ""}</p>
    ${resumenHtml(conteo)}
    <div class="tarjeta">
      <ul class="lista-fichas">
        ${[...filas].sort((a, b) => orden.indexOf(a.estado) - orden.indexOf(b.estado)).map((r) => `
          <li><span><span class="tema">${esc(r.p.ficha.tema)}</span><span class="autor">${esc(r.p.ficha.autor)}${!r.correcta && r.error ? ` · ${esc(ERRORES[r.error])}` : ""}</span></span>
          <span class="estado" style="--c:${ESTADOS[r.estado].color}">${ESTADOS[r.estado].nombre}</span></li>`).join("")}
      </ul>
    </div>
    <div class="acciones">
      <button class="btn" data-accion="practica" ${estado.servidor.ia ? "" : "disabled"}>Explicar mis puntos ciegos</button>
      ${sesion.modo === "demo" ? `<button class="btn secundario" data-accion="diagnostico">Hacer el diagnóstico completo</button>` : ""}
      <a class="btn secundario" href="#/${estado.carrera.id}/${estado.materia.id}">Ver el mapa de la materia</a>
    </div>
    ${estado.servidor.ia ? "" : `<div class="aviso" style="margin-top:16px">Para practicar con feedback falta conectar el tutor de IA (los pasos están en <code>output/README.md</code>).</div>`}`;
}

// ---------- navegación ----------
// #/ landing · #/carreras · #/<carrera> materias · #/<carrera>/<materia> mapa y diagnóstico.
// El diagnóstico y la práctica corren dentro de la página de la materia, sin cambiar la dirección.

async function mostrar() {
  const [carreraId, materiaId] = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  estado.sesion = null;
  window.scrollTo(0, 0);
  if (!carreraId) return landing();
  if (carreraId === "carreras") return verCarreras();
  const carrera = estado.catalogo.find((c) => c.id === carreraId);
  if (!carrera) return verCarreras();
  if (!materiaId) return verMaterias(carrera);
  const materia = carrera.materias.find((m) => m.id === materiaId && m.disponible);
  if (!materia) return verMaterias(carrera);
  if (estado.materia?.id !== materia.id) {
    app.innerHTML = `<div class="tarjeta"><div class="cargando">Cargando la materia…</div></div>`;
    estado.fichas = await api(`/api/fichas?materia=${materia.id}`);
  }
  estado.carrera = carrera;
  estado.materia = materia;
  verMateria();
}

window.addEventListener("hashchange", () => mostrar().catch(mostrarError));

function mostrarError(error) {
  app.innerHTML = `<div class="aviso">${esc(error.message)}</div>`;
}

document.addEventListener("click", async (e) => {
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
    else if (a === "borrar" && confirm("¿Borrar tu mapa de esta materia? Vas a empezar de cero.")) { guardarMapa({}); verMateria(); }
  } catch (error) {
    mostrarError(error);
  }
});

(async () => {
  migrarMapaViejo();
  try {
    [estado.servidor, estado.catalogo] = await Promise.all([api("/api/estado"), api("/api/catalogo")]);
    await mostrar();
  } catch (error) {
    mostrarError(new Error(`No se pudo conectar con el servidor: ${error.message}`));
  }
})();
