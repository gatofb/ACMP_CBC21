# Arma el banco de preguntas únicas de una cátedra a partir de sus exámenes en input/.
#
# Los temas de un mismo examen son las mismas consignas mezcladas, y muchas se repiten entre
# cuatrimestres: se agrupan por enunciado y cada grupo queda como una sola pregunta, con todas
# sus apariciones. El id sale del enunciado normalizado, así que no cambia al sumar exámenes.
#
# Uso: python3 scripts/armar_banco.py input/Abogacia/ICSE "Catedra Pedrosa" rules/ICSE/Pedrosa/banco_preguntas.yaml

import difflib, hashlib, re, sys, unicodedata
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).parent))
from extraer_examen import extraer

SIMILITUD = 0.75


def norm(s):
    s = unicodedata.normalize("NFKD", s.lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9 ]", "", re.sub(r"\s+", " ", s)).strip()


def parecido(a, b):
    return difflib.SequenceMatcher(None, a, b).ratio()


def tipo(c):
    return "combinada" if len(c["opciones"]) == 8 else "vf_justificada" if \
        all(re.match(r"Es (verdadero|falso)", v, re.I) for v in c["opciones"].values()) else "simple"


def correctas(c):
    # Textos que el examen da por correctos: la opción clave, o las afirmaciones que combina.
    texto = c["opciones"][c["clave"]]
    m = re.match(r"Las opciones correctas son (.*)", texto)
    if not m:
        return [texto]
    return [c["opciones"][l] for l in re.findall(r"\b([A-D])\b", m.group(1))]


def origen(pdf):
    # "Recuperatorio_1er_Parcial_-_2do_C._2025_-_Tema_1.pdf" -> instancia, cuatrimestre y año
    n = pdf.stem
    m = re.search(r"(\d)(?:er|do)_C\._(\d{4})", n)
    return {
        "archivo": pdf.name,
        "instancia": ("Recuperatorio " if n.startswith("Recuperatorio") else "") + n.split("_-_")[0].split("Recuperatorio_")[-1].replace("_", " "),
        "cuatrimestre": f"{m.group(1)}C {m.group(2)}" if m else None,
    }


def main():
    materia_dir, catedra, salida = Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3])
    pdfs = sorted(p for d in materia_dir.iterdir() if d.is_dir() and d.name.startswith(catedra)
                  for p in d.glob("*.pdf"))
    grupos = []
    for pdf in pdfs:
        examen = extraer(str(pdf))
        meta = origen(pdf)
        for c in examen["consignas"]:
            aparicion = {**meta, "tema": examen["tema"], "consigna": c["n"]}
            e = norm(c["enunciado"])
            g = next((g for g in grupos if parecido(g["_norm"], e) > SIMILITUD), None)
            if g is None:
                g = {"_norm": e, "puntos": c["puntos"], "versiones": []}
                grupos.append(g)
            # Una versión nueva solo si cambian las opciones (los temas mezclan el orden).
            firma = sorted(norm(v) for v in c["opciones"].values() if not v.startswith("Las opciones"))
            v = next((v for v in g["versiones"] if v["_firma"] == firma), None)
            if v is None:
                v = {"_firma": firma, "enunciado": c["enunciado"], "opciones": c["opciones"],
                     "clave": c["clave"], "correctas": correctas(c), "apariciones": []}
                g["versiones"].append(v)
            v["apariciones"].append(aparicion)

    banco = []
    for g in grupos:
        primera = g["versiones"][0]
        c = {"opciones": primera["opciones"], "clave": primera["clave"]}
        banco.append({
            "id": "q-" + hashlib.sha1(g["_norm"].encode()).hexdigest()[:8],
            "tipo": tipo(c),
            "puntos": g["puntos"],
            "veces_tomada": sum(len(v["apariciones"]) for v in g["versiones"]),
            "cuatrimestres": sorted({a["cuatrimestre"] for v in g["versiones"] for a in v["apariciones"]}),
            "versiones": [{k: v[k] for k in ("enunciado", "opciones", "clave", "correctas", "apariciones")}
                          for v in g["versiones"]],
        })
    salida.parent.mkdir(parents=True, exist_ok=True)
    with open(salida, "w", encoding="utf-8") as f:
        f.write(f"# Banco de preguntas únicas — generado por scripts/armar_banco.py. No editar a mano.\n"
                f"# {len(banco)} preguntas a partir de {len(pdfs)} exámenes.\n")
        yaml.safe_dump(banco, f, allow_unicode=True, sort_keys=False, width=110)
    print(f"{len(banco)} preguntas únicas de {len(pdfs)} exámenes -> {salida}")


if __name__ == "__main__":
    main()
