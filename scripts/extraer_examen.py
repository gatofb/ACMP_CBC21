# Extrae consignas, opciones y la clave de un PDF de examen de UBA XXI (formato Arrimo).
#
# La clave sale de dos lugares, según el año del examen:
#   - la grilla de resolución completada (2025 en adelante);
#   - la opción resaltada en amarillo (2024 y anteriores).
# Si el PDF trae las dos, se cruzan y cualquier diferencia corta la extracción.
#
# Uso: python3 scripts/extraer_examen.py examen.pdf [otro.pdf ...] > salida.json
# Necesita pdftotext y pdftoppm (poppler) y Pillow.

import html, json, re, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image

DPI = 100
RUIDO = re.compile(
    r"^\s*(https://arrimo\.com\.ar|INTRODUCCI[ÓO]N AL|(RECUPERATORIO )?\d\s*[°º] PARCIAL|TEMA:? \d+|"
    r"(P[áa]gina|Hoja) \d+ de \d+|\d{2}/\d{2}/\d{2,4}|APELLIDO|​)\s*", re.I)
CONSIGNA = re.compile(r"^(?:Consigna|Pregunta) (\d+)\)\s*\(([\d.,]+)\s*(?:pts?\.?|puntos?)\)", re.I)
OPCION = re.compile(r"^([A-H])\.(?:\s+(.*))?$")  # a veces la letra queda sola en su línea
FIN = re.compile(r"^(TAL[ÓO]N PARA EL ALUMNO|…{5,})")


def lineas_con_resaltado(pdf):
    # Devuelve (texto, resaltada) por línea, en orden de lectura, página por página.
    xml = subprocess.run(["pdftotext", "-bbox-layout", pdf, "-"],
                         capture_output=True, text=True, check=True).stdout
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["pdftoppm", "-r", str(DPI), "-png", pdf, f"{tmp}/p"], check=True)
        paginas = sorted(Path(tmp).glob("p-*.png"), key=lambda p: int(p.stem.split("-")[1]))
        imagenes = [Image.open(p).convert("RGB") for p in paginas]

    escala = DPI / 72
    salida = []
    for n, pagina in enumerate(re.findall(r"<page .*?</page>", xml, re.S)):
        img = imagenes[n]
        for m in re.finditer(r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</line>',
                             pagina, re.S):
            x0, y0, x1, y1 = (float(v) * escala for v in m.groups()[:4])
            palabras = re.findall(r"<word[^>]*>(.*?)</word>", m.group(5))
            texto = html.unescape(" ".join(palabras)).strip()
            caja = img.crop((int(x0), int(y0), max(int(x1), int(x0) + 1), max(int(y1), int(y0) + 1)))
            pixeles = list(caja.getdata())
            amarillos = sum(1 for r, g, b in pixeles if r > 200 and g > 200 and b < 130)
            salida.append((texto, amarillos / max(len(pixeles), 1) > 0.15))
    return salida


def clave_de_grilla(pdf):
    # La grilla se lee del texto con -layout: ahí las filas de letras quedan en una sola línea.
    lineas = subprocess.run(["pdftotext", "-layout", pdf, "-"],
                            capture_output=True, text=True, check=True).stdout.splitlines()
    lineas = [l.strip() for l in lineas]
    inicio = next((i for i, l in enumerate(lineas) if re.search(r"grilla de resoluci", l, re.I)), None)
    if inicio is None:
        return {}
    bloque = []
    for l in lineas[inicio + 1:]:
        if CONSIGNA.match(l):
            break
        bloque.append(l)
    # Formato "Pregunta 1 D Pregunta 2 C ..."
    en_linea = [par for l in bloque for par in re.findall(r"(?:Pregunta|Consigna)\s+(\d+)\s+([A-H])\b", l)]
    if en_linea:
        return {int(n): letra for n, letra in en_linea}
    # Formato de filas de letras sueltas arriba de filas "Consigna n"
    letras = []
    for l in bloque:
        tokens = l.split()
        if tokens and all(re.fullmatch(r"[A-H]", t) for t in tokens):
            letras += tokens
    return {i + 1: letra for i, letra in enumerate(letras)}


def consignas(lineas):
    preguntas, actual, destino = [], None, None
    for l, resaltada in lineas:
        if FIN.match(l):
            break
        if not l or RUIDO.match(l):
            continue
        m = CONSIGNA.match(l)
        if m:
            actual = {"n": int(m.group(1)), "puntos": float(m.group(2).replace(",", ".")),
                      "enunciado": "", "opciones": {}, "resaltadas": []}
            preguntas.append(actual)
            destino = "enunciado"
            continue
        if actual is None:
            continue
        o = OPCION.match(l)
        if o:
            destino = o.group(1)
            actual["opciones"][destino] = o.group(2) or ""
        elif destino == "enunciado":
            actual["enunciado"] = (actual["enunciado"] + " " + l).strip()
        else:
            # Si las letras vinieron todas juntas y los textos después, cada texto va a la
            # primera letra que quedó vacía; si no, la línea continúa la opción actual.
            vacia = next((k for k, v in actual["opciones"].items() if not v), None)
            destino = vacia or destino
            actual["opciones"][destino] = (actual["opciones"][destino] + " " + l).strip()
        if resaltada and destino != "enunciado" and destino not in actual["resaltadas"]:
            actual["resaltadas"].append(destino)
    return preguntas


def extraer(pdf):
    lineas = lineas_con_resaltado(pdf)
    todo = "\n".join(l for l, _ in lineas)
    tema = re.search(r"TEMA:? (\d+)", todo)
    preguntas = consignas(lineas)
    grilla = clave_de_grilla(pdf)
    for p in preguntas:
        por_grilla = grilla.get(p["n"])
        por_resaltado = p["resaltadas"][0] if len(p["resaltadas"]) == 1 else None
        if por_grilla and por_resaltado and por_grilla != por_resaltado:
            raise SystemExit(f"{pdf}: consigna {p['n']}: grilla {por_grilla} y resaltado {por_resaltado}")
        p["clave"] = por_grilla or por_resaltado
        p["origen_clave"] = "grilla" if por_grilla else "resaltado" if por_resaltado else None
        if not p["clave"]:
            raise SystemExit(f"{pdf}: consigna {p['n']} sin clave (resaltadas: {p['resaltadas']})")
        if p["clave"] not in p["opciones"]:
            raise SystemExit(f"{pdf}: consigna {p['n']} tiene clave {p['clave']} y esa opción no existe")
        del p["resaltadas"]
    numeros = [p["n"] for p in preguntas]
    if numeros != list(range(1, len(preguntas) + 1)):
        raise SystemExit(f"{pdf}: consignas fuera de orden o faltantes: {numeros}")
    return {"archivo": Path(pdf).name, "tema": int(tema.group(1)) if tema else None, "consignas": preguntas}


if __name__ == "__main__":
    json.dump([extraer(p) for p in sys.argv[1:]], sys.stdout, ensure_ascii=False, indent=1)
