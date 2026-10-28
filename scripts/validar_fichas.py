# Cruza las fichas de afirmación con el banco de preguntas de una cátedra y arma cobertura.md.
#
# Falla si una pregunta del banco no tiene ficha, si una ficha apunta a una pregunta que no
# existe, si dos fichas reclaman la misma pregunta o si falta algún campo obligatorio.
#
# Uso: python3 scripts/validar_fichas.py rules/ICSE/Pedrosa

import sys
from collections import Counter
from pathlib import Path

import yaml

OBLIGATORIOS = ["id", "eje", "autor", "fuente", "tema", "afirmacion", "puntos", "trampas",
                "pregunta_guia", "explicacion_modelo", "recurso_ubaxxi", "preguntas", "estado"]
ERRORES = {"concepto_vecino", "cambio_de_palabra", "anacronismo", "hecho_equivocado", "dato_inventado",
           "absoluto_falso", "motivo_equivocado", "media_verdad", "verdad_general"}
EJES = {"conceptos": "Conceptos", "historia": "Historia argentina (Romero)", "videos": "Videos de la cátedra"}


def main():
    carpeta = Path(sys.argv[1])
    banco = {q["id"]: q for q in yaml.safe_load(open(carpeta / "banco_preguntas.yaml", encoding="utf-8"))}
    fichas = yaml.safe_load(open(carpeta / "fichas_afirmacion.yaml", encoding="utf-8"))

    problemas = []
    ids = Counter(f.get("id") for f in fichas)
    problemas += [f"id repetido: {i}" for i, n in ids.items() if n > 1]
    duenio = {}
    for f in fichas:
        faltan = [c for c in OBLIGATORIOS if not f.get(c)]
        if faltan:
            problemas.append(f"{f.get('id')}: faltan {faltan}")
        if f.get("eje") not in EJES:
            problemas.append(f"{f.get('id')}: eje desconocido {f.get('eje')}")
        for t in f.get("trampas") or []:
            if t.get("error") not in ERRORES:
                problemas.append(f"{f['id']}: tipo de error desconocido {t.get('error')}")
        for q in f.get("preguntas") or []:
            if q not in banco:
                problemas.append(f"{f['id']}: la pregunta {q} no está en el banco")
            elif q in duenio:
                problemas.append(f"{q} está en {duenio[q]} y en {f['id']}")
            else:
                duenio[q] = f["id"]
    problemas += [f"{q} no tiene ficha" for q in banco if q not in duenio]

    if problemas:
        print("\n".join(problemas))
        raise SystemExit(f"{len(problemas)} problemas")

    filas = []
    for f in fichas:
        qs = [banco[q] for q in f["preguntas"]]
        filas.append({
            "ficha": f,
            "veces": sum(q["veces_tomada"] for q in qs),
            "cuatrimestres": sorted({c for q in qs for c in q["cuatrimestres"]}),
            "puntos": max(q["puntos"] or 0 for q in qs),
        })
    filas.sort(key=lambda r: (-len(r["cuatrimestres"]), -r["veces"], r["ficha"]["eje"], r["ficha"]["id"]))

    cuatris = sorted({c for q in banco.values() for c in q["cuatrimestres"]})
    tomas = sum(q["veces_tomada"] for q in banco.values())
    lineas = [
        f"# Cobertura de las fichas — generado por scripts/validar_fichas.py",
        "",
        f"{len(fichas)} fichas · {len(banco)} preguntas únicas · {tomas} consignas tomadas · "
        f"cuatrimestres relevados: {', '.join(cuatris)}.",
        "",
        "Ordenadas por cuántos cuatrimestres distintos aparecieron y cuántas veces se tomaron.",
        "",
        "| Ficha | Eje | Tema | Cuatrimestres | Veces | Estado | Recurso UBA XXI |",
        "|---|---|---|---|---|---|---|",
    ]
    for r in filas:
        f = r["ficha"]
        recurso = "pendiente" if f["recurso_ubaxxi"] == "pendiente" else "✓"
        lineas.append(f"| `{f['id']}` | {EJES[f['eje']]} | {f['tema']} | {', '.join(r['cuatrimestres'])} "
                      f"| {r['veces']} | {f['estado']} | {recurso} |")
    por_eje = Counter(f["eje"] for f in fichas)
    errores = Counter(t["error"] for f in fichas for t in f["trampas"])
    lineas += ["", "## Por eje", ""] + [f"- {EJES[e]}: {n} fichas" for e, n in por_eje.most_common()]
    lineas += ["", "## Tipos de error en las trampas", ""] + [f"- `{e}`: {n}" for e, n in errores.most_common()]
    (carpeta / "cobertura.md").write_text("\n".join(lineas) + "\n", encoding="utf-8")
    print(f"OK: {len(fichas)} fichas cubren las {len(banco)} preguntas -> {carpeta / 'cobertura.md'}")


if __name__ == "__main__":
    main()
