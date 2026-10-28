# Arma el banco de preguntas únicas de una cátedra a partir de sus exámenes en input/.
#
# Los temas de un mismo examen son las mismas consignas mezcladas, y muchas se repiten entre
# cuatrimestres: se agrupan por enunciado y cada grupo queda como una sola pregunta, con todas
# sus apariciones. El id sale del enunciado normalizado, así que no cambia al sumar exámenes.
#
# De dónde salen las consignas, carpeta por carpeta:
#   - si la carpeta tiene transcripciones .json (rules/03_formato_extraccion.md), se usan solo esas;
#   - si no, se extraen los PDF con el formato de Arrimo (scripts/extraer_examen.py).
#
# Uso: python3 scripts/armar_banco.py <carpeta de la materia> <salida.yaml> <prefijo de carpeta>...
#   python3 scripts/armar_banco.py input/Abogacia/ICSE rules/ICSE/Pedrosa/banco_preguntas.yaml "Catedra Pedrosa"
#   python3 scripts/armar_banco.py input/Abogacia/Sociologia rules/Sociologia/Bustos/banco_preguntas.yaml "Catedra A Bustos" "Catedra unica"

import difflib, hashlib, json, re, sys, unicodedata
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).parent))
from extraer_examen import extraer

SIMILITUD = 0.75
# Las transcripciones se agrupan por el núcleo de la pregunta (sin la instrucción "Marque con una
# cruz…") y con un umbral alto: hay preguntas que cambian en una sola palabra clave
# ("acción con arreglo a fines" / "a valores") y son preguntas distintas.
SIMILITUD_TRANSCRIPCION = 0.96
# Palabras de las instrucciones de examen. Una oración hecha solo de esto (más dos palabras como
# mucho) es instrucción y no cuenta para comparar: "Marque con una cruz (X) la opción correcta.",
# "Seleccione una opción y escriba el número en la grilla de resolución."
PALABRAS_DE_INSTRUCCION = set("""
marque marca marcá seleccione seleccioná seleccionar indique indicá establezca establecé complete completá elija elegí señale
escriba escribí escribir lea leé con una un la las el los lo de del en y o a al que cual cuál cuales cuáles opcion opción
opciones respuesta respuestas afirmacion afirmación afirmaciones correcta correctas correcto corresponda correspondan
cruz x siguiente siguientes frase oracion oración verdaderas verdadera falsas falsa son es numero número grilla resolucion
resolución casillero talon talón dos sus su se para
""".split())


def es_instruccion(oracion):
    palabras = norm(oracion).split()
    sobran = [p for p in palabras if p not in {norm(w) for w in PALABRAS_DE_INSTRUCCION}]
    return bool(palabras) and (len(sobran) <= 2 or bool(re.search(r"grilla|tal[oó]n|casillero", oracion, re.I)))


def sin_instruccion(enunciado):
    oraciones = re.split(r"(?<=[.:?])\s+", enunciado.replace("(X)", "").replace("…", " ").strip())
    contenido = [o for o in oraciones if not es_instruccion(o)]
    return " ".join(contenido) if contenido else enunciado


def nucleo(enunciado):
    return norm(sin_instruccion(enunciado))


def pedido(enunciado):
    # La primera oración: lo que se pregunta ("Identifique la hipótesis auxiliar…"). Si dos consignas
    # comparten un caso largo pero piden otra cosa, esto las separa.
    return norm(re.split(r"[.?:\n]", sin_instruccion(enunciado).strip(), maxsplit=1)[0])
LETRAS = "ABCDEFGHIJKLMNOP"


def norm(s):
    s = unicodedata.normalize("NFKD", s.lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9 ]", "", re.sub(r"\s+", " ", s)).strip()


def parecido(a, b):
    return difflib.SequenceMatcher(None, a, b).ratio()


def tipo_arrimo(c):
    return "combinada" if len(c["opciones"]) == 8 else "vf_justificada" if \
        all(re.match(r"Es (verdadero|falso)", v, re.I) for v in c["opciones"].values()) else "simple"


def correctas(c):
    # Textos que el examen da por correctos, según el tipo de consigna.
    t = c["tipo"]
    if t == "completar":
        return [h["clave"] for h in c["huecos"]]
    if t == "multiple":
        return [c["opciones"][l] for l in c["clave"]]
    if t == "vf_items":
        return [c["opciones"][l] for l, v in c["clave"].items() if v == "V"]
    texto = c["opciones"][c["clave"]]
    m = re.match(r"Las opciones correctas son (.*)", texto)
    if not m:
        return [texto]
    return [c["opciones"][l] for l in re.findall(r"\b([A-D])\b", m.group(1))]


def origen_arrimo(pdf):
    # "Recuperatorio_1er_Parcial_-_2do_C._2025_-_Tema_1.pdf" -> instancia, cuatrimestre y año
    n = pdf.stem
    m = re.search(r"(\d)(?:er|do)_C\._(\d{4})", n)
    return {
        "archivo": pdf.name,
        "instancia": ("Recuperatorio " if n.startswith("Recuperatorio") else "") + n.split("_-_")[0].split("Recuperatorio_")[-1].replace("_", " "),
        "cuatrimestre": f"{m.group(1)}C {m.group(2)}" if m else None,
    }


def consignas_de_json(examen):
    # Normaliza una transcripción: cada par de "relacionar" pasa a ser una pregunta propia,
    # y se descartan las consignas sin clave (no se pueden corregir).
    salida, descartadas = [], []
    for c in examen["consignas"]:
        t = c["tipo"]
        base = {"n": c.get("n"), "puntos": c.get("puntos"), "explicacion": c.get("explicacion")}
        if t == "relacionar":
            autores = c.get("autores") or sorted({p["autor"] for p in c["pares"] if p.get("autor")})
            opciones = {LETRAS[i]: a for i, a in enumerate(autores)}
            # Algunas piden el concepto que corresponde a cada definición: mismo formato, otra pregunta.
            definiciones = re.search(r"concepto\w* junto a la\w* definici", c.get("enunciado", ""), re.I)
            for p in c["pares"]:
                if not p.get("autor") or p["autor"] not in autores:
                    descartadas.append(f"consigna {c.get('n')}: «{p['concepto']}» sin autor")
                    continue
                pregunta = (f"¿Qué concepto corresponde a esta definición: «{p['concepto']}»?" if definiciones
                            else f"¿Qué autor corresponde a este concepto: «{p['concepto']}»?")
                salida.append({**base, "tipo": "simple", "relacionar": True, "opciones": opciones,
                               "enunciado": pregunta, "clave": LETRAS[autores.index(p["autor"])],
                               "_exacta": ("definicion " if definiciones else "concepto ") + norm(p["concepto"])})
        elif t == "completar":
            if all(h.get("clave") for h in c.get("huecos", [])):
                salida.append({**base, "tipo": t, "enunciado": c["enunciado"], "huecos": c["huecos"], "opciones": {}})
            else:
                descartadas.append(f"consigna {c.get('n')}: huecos sin clave")
        elif t in ("simple", "vf_justificada", "multiple", "vf_items"):
            if c.get("clave"):
                salida.append({**base, "tipo": t, "enunciado": c["enunciado"], "opciones": c["opciones"], "clave": c["clave"],
                               "_con_opciones": True})
            else:
                descartadas.append(f"consigna {c.get('n')}: sin clave")
        else:
            descartadas.append(f"consigna {c.get('n')}: tipo {t}, no se corrige")
    return salida, descartadas


def examenes(carpeta):
    # Devuelve (meta, consignas) por examen de la carpeta.
    jsons = sorted(carpeta.glob("*.json"))
    if jsons:
        for j in jsons:
            examen = json.load(open(j, encoding="utf-8"))
            consignas, descartadas = consignas_de_json(examen)
            for d in descartadas:
                print(f"  {j.name}: {d}")
            meta = {"archivo": examen.get("archivo") or j.with_suffix(".pdf").name,
                    "instancia": examen.get("instancia"), "cuatrimestre": examen.get("periodo"),
                    "fuente_clave": examen.get("fuente_clave")}
            yield meta, examen.get("tema"), consignas
    else:
        for pdf in sorted(carpeta.glob("*.pdf")):
            examen = extraer(str(pdf))
            for c in examen["consignas"]:
                c["tipo"] = tipo_arrimo(c)
            yield origen_arrimo(pdf), examen["tema"], examen["consignas"]


def clave_de_grupo(c):
    # Las de Arrimo se agrupan por enunciado, como siempre. Las transcripciones traen enunciados
    # genéricos ("Marque con una cruz…", "Indique cuáles son verdaderas…"): ahí cuenta también el
    # contenido de las opciones. Cada par de relacionar se agrupa solo con el mismo concepto.
    if c.get("_exacta"):
        return c["_exacta"]
    if c.get("_con_opciones"):
        return nucleo(c["enunciado"])
    e = norm(c["enunciado"])
    if c["tipo"] == "completar":
        e += " " + " ".join(norm(h["clave"]) for h in c["huecos"])
    return e


def mismo_grupo(g, c, e, examen):
    if g["tipo"] != c["tipo"] or bool(g.get("_exacta")) != bool(c.get("_exacta")):
        return False
    # Dos consignas del mismo examen no son la misma pregunta (ej.: partes "9P" y "9C" de un ejercicio),
    # salvo en relacionar, donde un concepto puede repetirse en dos tablas del mismo examen.
    if examen in g["_examenes"] and not c.get("_exacta"):
        return False
    if c.get("_exacta"):
        return g["_norm"] == e
    if c.get("_con_opciones"):
        # El término entre comillas es la pregunta: “acción con arreglo a fines” ≠ “a valores”.
        if g.get("_comillas") and comillas(c["enunciado"]) and g["_comillas"] != comillas(c["enunciado"]):
            return False
        if parecido(g["_pedido"], pedido(c["enunciado"])) < 0.9:
            return False
        return parecido(g["_norm"], e) > SIMILITUD_TRANSCRIPCION
    return parecido(g["_norm"], e) > SIMILITUD


def comillas(enunciado):
    return frozenset(norm(t) for t in re.findall(r"[“\"«]([^”\"»]{3,80})[”\"»]", enunciado))


def main():
    materia_dir, salida, prefijos = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3:]
    carpetas = sorted(d for d in materia_dir.iterdir() if d.is_dir() and any(d.name.startswith(p) for p in prefijos))
    grupos, n_examenes, conflictos = [], 0, []
    for carpeta in carpetas:
        for meta, tema, consignas in examenes(carpeta):
            n_examenes += 1
            for c in consignas:
                aparicion = {**{k: v for k, v in meta.items() if k != "fuente_clave"}, "tema": tema, "consigna": c["n"]}
                e = clave_de_grupo(c)
                examen = (meta["archivo"], tema)
                g = next((g for g in grupos if mismo_grupo(g, c, e, examen)), None)
                if g is None:
                    g = {"_norm": e, "_exacta": c.get("_exacta"), "_comillas": comillas(c["enunciado"]),
                         "_pedido": pedido(c["enunciado"]),
                         "tipo": c["tipo"], "puntos": c["puntos"],
                         "relacionar": c.get("relacionar", False), "versiones": [], "_examenes": set()}
                    grupos.append(g)
                g["_examenes"].add(examen)
                # Una versión nueva solo si cambian las opciones (los temas mezclan el orden).
                firma = sorted(norm(v) for v in c["opciones"].values() if not v.startswith("Las opciones")) \
                    or [norm(o) for h in c.get("huecos", []) for o in h["opciones"]]
                v = next((v for v in g["versiones"] if v["_firma"] == firma), None)
                if v is None:
                    v = {"_firma": firma, "enunciado": c["enunciado"], "opciones": c["opciones"],
                         "clave": c.get("clave"), "correctas": correctas(c), "apariciones": []}
                    if c.get("huecos"):
                        v["huecos"] = c["huecos"]
                    if c.get("explicacion"):
                        v["explicacion"] = c["explicacion"]
                    if meta.get("fuente_clave"):
                        v["fuente_clave"] = meta["fuente_clave"]
                    g["versiones"].append(v)
                elif sorted(map(norm, correctas(c))) != sorted(map(norm, v["correctas"])):
                    # Mismas opciones y otra respuesta: gana la clave del campus sobre las marcas de un alumno.
                    if meta.get("fuente_clave") == "campus" and v.get("fuente_clave") != "campus":
                        v.update(clave=c.get("clave"), correctas=correctas(c), fuente_clave="campus")
                    conflictos.append(f"{meta['archivo']} #{c['n']}: «{c['enunciado'][:60]}» no coincide con la clave de "
                                      f"{v['apariciones'][0]['archivo']}; queda la de {v.get('fuente_clave')}")
                    v["clave_dudosa"] = True
                v["apariciones"].append(aparicion)

    banco, usados = [], set()
    for g in grupos:
        # Dos grupos pueden compartir el núcleo del enunciado y ser preguntas distintas (otras
        # opciones, otro término entre comillas): ahí el id suma las opciones de la primera versión.
        semilla = g["_norm"]
        if "q-" + hashlib.sha1(semilla.encode()).hexdigest()[:8] in usados:
            semilla += " " + " ".join(g["versiones"][0]["_firma"])
        qid = "q-" + hashlib.sha1(semilla.encode()).hexdigest()[:8]
        usados.add(qid)
        q = {
            "id": qid,
            "tipo": g["tipo"],
            "puntos": g["puntos"],
            "veces_tomada": sum(len(v["apariciones"]) for v in g["versiones"]),
            "cuatrimestres": sorted({a["cuatrimestre"] for v in g["versiones"] for a in v["apariciones"]} - {None}),
            "versiones": [{k: v[k] for k in ("enunciado", "opciones", "huecos", "clave", "correctas", "explicacion",
                                             "fuente_clave", "clave_dudosa", "apariciones") if k in v}
                          for v in g["versiones"]],
        }
        if g["relacionar"]:
            q["relacionar"] = True
        banco.append(q)
    salida.parent.mkdir(parents=True, exist_ok=True)
    with open(salida, "w", encoding="utf-8") as f:
        f.write(f"# Banco de preguntas únicas — generado por scripts/armar_banco.py. No editar a mano.\n"
                f"# {len(banco)} preguntas a partir de {n_examenes} exámenes.\n")
        yaml.safe_dump(banco, f, allow_unicode=True, sort_keys=False, width=110)
    print(f"{len(banco)} preguntas únicas de {n_examenes} exámenes -> {salida}")
    for c in conflictos:
        print(f"  clave en conflicto: {c}")


if __name__ == "__main__":
    main()
