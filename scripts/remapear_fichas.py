# Pasa las fichas de un banco viejo a uno nuevo después de volver a correr armar_banco.py.
#
# Si cambia cómo se agrupan las preguntas, cambian algunos ids: una pregunta que estaba mal
# agrupada se separa en dos, o dos se unen en una. Cada pregunta nueva va a la ficha de la pregunta
# vieja con la que comparte una aparición (mismo archivo, tema y consigna). Las que ya no existen se
# sacan de su ficha. Después hay que correr validar_fichas.py.
#
# Uso: python3 scripts/remapear_fichas.py <banco_viejo.yaml> <banco_nuevo.yaml> <fichas_afirmacion.yaml>

import sys

import yaml


def apariciones(q):
    return {(a["archivo"], a.get("tema"), str(a["consigna"])) for v in q["versiones"] for a in v["apariciones"]}


def main():
    viejo = yaml.safe_load(open(sys.argv[1], encoding="utf-8"))
    nuevo = yaml.safe_load(open(sys.argv[2], encoding="utf-8"))
    ruta = sys.argv[3]
    texto = open(ruta, encoding="utf-8").read()
    encabezado = "".join(l for l in texto.splitlines(keepends=True) if l.startswith("#"))
    fichas = yaml.safe_load(texto)

    ficha_de = {q: f for f in fichas for q in f["preguntas"]}
    por_aparicion = {a: q["id"] for q in viejo for a in apariciones(q)}
    ids_nuevos = {q["id"] for q in nuevo}

    for q in nuevo:
        if q["id"] in ficha_de:
            continue
        viejos = {por_aparicion[a] for a in apariciones(q) if a in por_aparicion}
        destino = next((ficha_de[v] for v in viejos if v in ficha_de), None)
        if destino is None:
            print(f"SIN FICHA: {q['id']} «{q['versiones'][0]['enunciado'][:70]}»")
            continue
        destino["preguntas"].append(q["id"])
        print(f"+ {q['id']} → {destino['id']}  «{q['versiones'][0]['enunciado'][:60]}»")
    for f in fichas:
        fuera = [q for q in f["preguntas"] if q not in ids_nuevos]
        for q in fuera:
            print(f"- {q} sale de {f['id']}")
        f["preguntas"] = [q for q in f["preguntas"] if q in ids_nuevos]

    with open(ruta, "w", encoding="utf-8") as salida:
        salida.write(encabezado + "\n")
        yaml.safe_dump(fichas, salida, allow_unicode=True, sort_keys=False, width=100)


if __name__ == "__main__":
    main()
