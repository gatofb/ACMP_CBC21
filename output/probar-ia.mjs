// Prueba de punta a punta del Explainer Mode: dos explicaciones reales evaluadas por Claude.
// Uso: npm run probar-ia   (lee output/.env; cada corrida hace dos pedidos a Claude)

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { evaluarExplicacion, modelo, proveedor } from "./tutor.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
try { process.loadEnvFile(join(AQUI, ".env")); } catch { /* sin .env */ }
if (!proveedor()) {
  console.error("No hay forma de llegar a Claude: falta ANTHROPIC_API_KEY en output/.env o el CLI `claude`.");
  process.exit(1);
}

const REGLAS = join(AQUI, "..", "rules", "ICSE", "Pedrosa");
const banco = yaml.load(readFileSync(join(REGLAS, "banco_preguntas.yaml"), "utf8"));
const fichas = yaml.load(readFileSync(join(REGLAS, "fichas_afirmacion.yaml"), "utf8"));
const materia = "Introducción al Conocimiento de la Sociedad y el Estado (ICSE · Cátedra Pedrosa · 1er parcial)";
const caso = (fichaId, n = 0) => {
  const ficha = fichas.find((f) => f.id === fichaId);
  const pregunta = banco.find((q) => q.id === ficha.preguntas[n]);
  return { ficha, version: pregunta.versiones[0], tipo: pregunta.tipo };
};

console.log(`Modelo: ${modelo()} · vía: ${proveedor()}\n`);

// Verdadero/falso explicada de forma vaga.
const vf = caso("povse.gobierno-vs-regimen");
const a = await evaluarExplicacion({ materia, ...vf, seguridad: "dudo", intento: 1, dictada: true,
  explicacion: "Eh, yo creo que es falso porque no es lo mismo, o sea el gobierno cambia y el régimen no siempre, depende." });
console.log(`V/F (clave ${vf.version.clave}):`, JSON.stringify(a, null, 2), "\n");

// Combinada explicada sin ver la grilla.
const comb = caso("gomez-talavera.estado-vs-gobierno", 1);
const b = await evaluarExplicacion({ materia, ...comb, seguridad: "seguro", intento: 1, dictada: false,
  explicacion: "El Estado es lo permanente y el gobierno son los que lo administran por un tiempo. Así que son correctas la C y la D; la A y la B dan vuelta los conceptos." });
console.log(`Combinada (clave ${comb.version.clave}):`, JSON.stringify(b, null, 2));
