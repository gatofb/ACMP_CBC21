# Ordena en input/<carrera>/<materia>/ los PDFs de exámenes bajados a mano.
#
# Cruza cada PDF de la carpeta de descargas con los examenes_arrimo.csv de input/:
# primero por el hash de 32 caracteres que Arrimo agrega al nombre, y si el navegador
# lo sacó, por el nombre limpio (solo cuando ese nombre es único en todo el listado).
# Copia, no mueve: Descargas queda como estaba. Lo que no está en el listado pero tiene
# nombre de examen va a input/_sin_clasificar/; el resto de Descargas ni se toca.
#
# Uso: python3 scripts/ordenar_descargas.py [carpeta_descargas] [--dry-run]

import csv, re, shutil, sys
from collections import defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
INPUT = REPO / "input"
HASH = re.compile(r"-([0-9a-f]{32})(?=\.pdf$)", re.I)
COPIA_NAVEGADOR = re.compile(r"\s*\(\d+\)(?=\.pdf$)", re.I)  # "archivo (1).pdf"
PARECE_EXAMEN = re.compile(r"parcial|recuperatorio|integrador|^(finale?s?|intensivos?)[_ -]|examen|ubaxxi|uba[_ ]xxi", re.I)


def limpiar(nombre):
    return COPIA_NAVEGADOR.sub("", HASH.sub("", nombre)).lower()


def cargar_listado():
    por_hash, por_nombre = {}, defaultdict(list)
    for csv_path in INPUT.glob("*/*/examenes_arrimo.csv"):
        carrera = csv_path.parent.parent.name
        for row in csv.DictReader(open(csv_path, encoding="utf-8")):
            row["carrera"] = carrera
            h = HASH.search(row["url"])
            if h:
                por_hash[h.group(1).lower()] = row
            por_nombre[row["archivo"].lower()].append(row)
    return por_hash, por_nombre


def destino(row):
    subcarpeta = " - ".join(x for x in (row["catedra"], row["seccion"]) if x)
    return INPUT / row["carrera"] / row["materia"] / subcarpeta / row["archivo"]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv
    descargas = Path(args[0]).expanduser() if args else Path.home() / "Downloads"
    por_hash, por_nombre = cargar_listado()

    copiados = ya_estaban = sin_clasificar = ignorados = 0
    for pdf in sorted(descargas.glob("*.pdf")):
        h = HASH.search(COPIA_NAVEGADOR.sub("", pdf.name))
        row = por_hash.get(h.group(1).lower()) if h else None
        if not row:
            candidatos = por_nombre.get(limpiar(pdf.name), [])
            row = candidatos[0] if len(candidatos) == 1 else None
        if not row and not PARECE_EXAMEN.search(pdf.name):
            ignorados += 1
            continue
        dest = destino(row) if row else INPUT / "_sin_clasificar" / pdf.name

        if dest.exists():
            ya_estaban += 1
            continue
        if row:
            copiados += 1
            print(f"OK   {pdf.name} -> {dest.relative_to(INPUT)}")
        else:
            sin_clasificar += 1
            print(f"???  {pdf.name} -> _sin_clasificar/")
        if not dry:
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(pdf, dest)

    total = sum(len(v) for v in por_nombre.values())
    en_input = sum(1 for _ in INPUT.glob("*/*/*/*.pdf"))
    print(f"\nCopiados: {copiados} · Ya estaban: {ya_estaban} · Sin clasificar: {sin_clasificar}"
          f" · Ignorados (no son exámenes): {ignorados}")
    print(f"En input: {en_input} de {total} del listado de Arrimo")


if __name__ == "__main__":
    main()
