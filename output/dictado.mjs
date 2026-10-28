// Dictado: transcribe en esta máquina el audio que graba el navegador, con whisper.cpp.
// El audio no sale de la computadora. Necesita ffmpeg (para pasar el audio a WAV de 16 kHz),
// whisper-cli y un modelo de whisper.cpp.

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const ejecutar = promisify(execFile);

const ffmpeg = () => process.env.FFMPEG || "ffmpeg";
const whisper = () => process.env.WHISPER_CLI || "whisper-cli";
const modelo = () => process.env.WHISPER_MODEL || join(homedir(), "models", "ggml-large-v3-turbo-q5_0.bin");

export class DictadoError extends Error {
  constructor(mensaje, status = 502) {
    super(mensaje);
    this.status = status;
  }
}

let disponible = null;
export async function dictadoDisponible() {
  if (disponible === null) {
    try {
      await ejecutar(ffmpeg(), ["-version"], { timeout: 10000 });
      await ejecutar(whisper(), ["-h"], { timeout: 10000 }).catch((e) => {
        if (e.code === "ENOENT") throw e; // -h sale con código distinto de 0 en algunas versiones
      });
      disponible = existsSync(modelo());
    } catch {
      disponible = false;
    }
  }
  return disponible;
}

// glosario: nombres propios de la materia (autores, actores) para que Whisper los escriba bien.
// idioma: "es" o "en", según en qué idioma usa la app el alumno.
export async function transcribir(audio, glosario = "", idioma = "es") {
  if (!(await dictadoDisponible())) {
    throw new DictadoError("El dictado no está disponible: falta whisper-cli, ffmpeg o el modelo de Whisper.", 503);
  }
  if (!audio?.length) throw new DictadoError("No llegó audio.", 400);
  const carpeta = await mkdtemp(join(tmpdir(), "preptest-dictado-"));
  try {
    const entrada = join(carpeta, "entrada");
    const wav = join(carpeta, "audio.wav");
    await writeFile(entrada, audio);
    try {
      await ejecutar(ffmpeg(), ["-loglevel", "error", "-y", "-i", entrada, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wav],
        { timeout: 60000 });
    } catch {
      throw new DictadoError("No se pudo leer el audio. Probá grabar de nuevo.", 400);
    }
    const args = ["-m", modelo(), "-l", idioma === "en" ? "en" : "es", "-nt", "-np", "-f", wav];
    if (glosario) args.push("--prompt", glosario);
    const { stdout } = await ejecutar(whisper(), args, { timeout: 180000, maxBuffer: 4 * 1024 * 1024 });
    return stdout.replace(/\s+/g, " ").trim();
  } catch (error) {
    if (error instanceof DictadoError) throw error;
    throw new DictadoError(`Whisper no pudo transcribir el audio: ${error.message.slice(0, 200)}`);
  } finally {
    await rm(carpeta, { recursive: true, force: true });
  }
}
