from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

import markdown
from flask import (
    Flask,
    abort,
    jsonify,
    render_template,
    request,
    send_from_directory,
    url_for,
)

ROOT = Path(__file__).resolve().parent
CONTENT = ROOT / "content"
SECCIONES_DIR = CONTENT / "secciones"

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["TEMPLATES_AUTO_RELOAD"] = True

MD = markdown.Markdown(extensions=["extra", "nl2br", "sane_lists", "tables"])


def cargar_catalogo() -> dict:
    return json.loads((CONTENT / "catalogo.json").read_text(encoding="utf-8"))


def cargar_seccion(seccion_id: str) -> dict:
    carpeta = SECCIONES_DIR / seccion_id
    info_path = carpeta / "info.json"
    if not info_path.is_file():
        abort(404)
    info = json.loads(info_path.read_text(encoding="utf-8"))
    info["carpeta"] = carpeta
    return info


def seccion_publica(info: dict) -> dict:
    return {k: v for k, v in info.items() if k != "carpeta"}


def todas_las_secciones() -> list[dict]:
    catalogo = cargar_catalogo()
    ids: list[str] = []
    for grupo in catalogo["grupos"]:
        ids.extend(grupo["secciones"])
    return [seccion_publica(cargar_seccion(sid)) for sid in ids]


def render_markdown(texto: str, base_media: str | None = None) -> str:
    MD.reset()
    html = MD.convert(texto)

    def _img(match: re.Match[str]) -> str:
        src = match.group(1)
        if src.startswith(("http://", "https://", "/")):
            return match.group(0)
        if base_media:
            nuevo = f"{base_media}/{src.lstrip('./')}"
            return match.group(0).replace(src, nuevo)
        return match.group(0)

    html = re.sub(r'<img[^>]*src="([^"]+)"', _img, html)
    return html


def leer_md(ruta: Path, base_media: str | None = None) -> str:
    if not ruta.is_file():
        return (
            "<div class='aviso'>"
            "<strong>Aún no hay contenido.</strong> "
            f"Crea el archivo <code>{ruta.relative_to(ROOT)}</code> "
            "y recarga la página."
            "</div>"
        )
    return render_markdown(ruta.read_text(encoding="utf-8"), base_media)


# ---------------------------------------------------------------------------
# Búsqueda
# ---------------------------------------------------------------------------

def _normalizar(texto: str) -> str:
    """Minúsculas, sin acentos y con espacios simples."""
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", texto).strip().lower()


def _texto_plano(markdown_texto: str) -> str:
    """Quita la sintaxis Markdown para indexar solo el contenido legible."""
    texto = re.sub(r"```.*?```", " ", markdown_texto, flags=re.S)
    texto = re.sub(r"!\[[^\]]*\]\([^)]+\)", " ", texto)
    texto = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", texto)
    texto = re.sub(r"<[^>]+>", " ", texto)
    texto = re.sub(r"[#>*_`|~]+", " ", texto)
    texto = re.sub(r"^\s*[-+]?\s*\d+[.)]\s+", " ", texto, flags=re.M)
    return re.sub(r"\s+", " ", texto).strip()


def _firma_contenido() -> tuple:
    archivos = [
        p for p in CONTENT.rglob("*")
        if p.is_file() and p.suffix.lower() in {".md", ".json"}
    ]
    return tuple(sorted((str(p), p.stat().st_mtime_ns) for p in archivos))


_INDICE: dict = {"firma": None, "datos": []}


def _construir_indice() -> list[dict]:
    catalogo = cargar_catalogo()
    datos: list[dict] = []

    for pagina in catalogo["paginas"]:
        archivo = pagina.get("archivo")
        if not archivo:
            continue
        ruta = CONTENT / archivo
        if not ruta.is_file():
            continue
        texto = _texto_plano(ruta.read_text(encoding="utf-8"))
        datos.append(
            {
                "titulo": pagina["titulo"],
                "contexto": "Recursos" if pagina.get("menu") == "recursos" else "Página",
                "url": url_for("pagina", page_id=pagina["id"]),
                "texto": texto,
                "clave": _normalizar(f"{pagina['titulo']} {texto}"),
            }
        )

    for grupo in catalogo["grupos"]:
        for seccion_id in grupo["secciones"]:
            try:
                info = cargar_seccion(seccion_id)
            except Exception:
                continue
            base = " ".join(
                [
                    str(info.get("titulo", "")),
                    str(info.get("resumen", "")),
                    str(info.get("norma_principal", "")),
                    " ".join(
                        f"{e.get('label', '')} {e.get('valor', '')}"
                        for e in info.get("especificaciones", [])
                    ),
                    " ".join(info.get("checklist", [])),
                ]
            )
            datos.append(
                {
                    "titulo": f"Sección {info.get('numero')} · {info.get('titulo')}",
                    "contexto": "Ficha de la práctica",
                    "url": url_for("seccion", seccion_id=seccion_id),
                    "texto": base,
                    "clave": _normalizar(base),
                    "_ficha": True,
                }
            )
            for vista in catalogo["vistas_seccion"]:
                ruta = info["carpeta"] / vista["archivo"]
                if not ruta.is_file():
                    continue
                texto = _texto_plano(ruta.read_text(encoding="utf-8"))
                datos.append(
                    {
                        "titulo": (
                            f"Sección {info.get('numero')} · {info.get('titulo')}"
                            f" — {vista['titulo']}"
                        ),
                        "contexto": info.get("norma_principal", "Sección"),
                        "url": url_for(
                            "seccion", seccion_id=seccion_id, vista=vista["id"]
                        ),
                        "texto": texto,
                        "clave": _normalizar(
                            f"{info.get('titulo', '')} {vista['titulo']} {texto}"
                        ),
                    }
                )
    return datos


def _indice_actual() -> list[dict]:
    firma = _firma_contenido()
    if _INDICE["firma"] != firma:
        _INDICE["datos"] = _construir_indice()
        _INDICE["firma"] = firma
    return _INDICE["datos"]


def _fragmento(texto: str, clave: str, termino: str, limite: int = 150) -> str:
    posicion = clave.find(termino)
    if posicion < 0:
        return texto[:limite] + ("…" if len(texto) > limite else "")
    inicio = max(0, posicion - 55)
    fin = min(len(texto), inicio + limite)
    recorte = texto[inicio:fin].strip()
    if inicio > 0:
        recorte = "… " + recorte
    if fin < len(texto):
        recorte += " …"
    return recorte


@app.context_processor
def inject_nav():
    catalogo = cargar_catalogo()
    secciones = todas_las_secciones()
    grupos = []
    by_id = {s["id"]: s for s in secciones}
    for grupo in catalogo["grupos"]:
        grupos.append(
            {
                **grupo,
                "secciones_nav": [by_id[sid] for sid in grupo["secciones"] if sid in by_id],
            }
        )
    return {
        "catalogo": catalogo,
        "nav_secciones": secciones,
        "nav_grupos": grupos,
        "nav_paginas": catalogo["paginas"],
    }


@app.route("/")
def inicio():
    return render_template("inicio.html")


@app.route("/pagina/<page_id>")
def pagina(page_id: str):
    catalogo = cargar_catalogo()
    meta = next((p for p in catalogo["paginas"] if p["id"] == page_id), None)
    if not meta:
        abort(404)

    if meta.get("plantilla"):
        contexto = {"meta": meta}
        if meta.get("banco"):
            ruta_banco = CONTENT / meta["banco"]
            if not ruta_banco.is_file():
                abort(404)
            contexto["banco"] = json.loads(ruta_banco.read_text(encoding="utf-8"))
        return render_template(meta["plantilla"], **contexto)

    archivo = meta.get("archivo")
    if not archivo:
        abort(404)
    html = leer_md(CONTENT / archivo, "/media")
    return render_template("pagina.html", meta=meta, html=html)


@app.route("/seccion/<seccion_id>/")
@app.route("/seccion/<seccion_id>/<vista>")
def seccion(seccion_id: str, vista: str | None = None):
    catalogo = cargar_catalogo()
    info = cargar_seccion(seccion_id)
    vistas = catalogo["vistas_seccion"]
    if vista is None:
        vista = vistas[0]["id"]
    actual = next((v for v in vistas if v["id"] == vista), None)
    if not actual:
        abort(404)

    secciones = todas_las_secciones()
    idx = next(i for i, s in enumerate(secciones) if s["id"] == seccion_id)
    anterior = secciones[idx - 1] if idx > 0 else None
    siguiente = secciones[idx + 1] if idx + 1 < len(secciones) else None
    es_ultima = siguiente is None

    html = leer_md(info["carpeta"] / actual["archivo"], f"/media/seccion/{seccion_id}")

    return render_template(
        "seccion.html",
        info=info,
        vistas=vistas,
        vista=vista,
        html=html,
        anterior=anterior,
        siguiente=siguiente,
        es_ultima=es_ultima,
        total=len(secciones),
        indice=idx + 1,
    )


@app.route("/api/buscar")
def api_buscar():
    consulta = _normalizar(request.args.get("q", ""))
    if len(consulta) < 2:
        return jsonify({"resultados": []})

    terminos = consulta.split()
    encontrados = []
    for item in _indice_actual():
        clave = item["clave"]
        if not all(t in clave for t in terminos):
            continue
        titulo = _normalizar(item["titulo"])
        puntaje = 0
        for termino in terminos:
            if termino in titulo:
                puntaje += 8
            puntaje += min(clave.count(termino), 5)
        if item.get("_ficha"):
            puntaje -= 2
        encontrados.append(
            (
                puntaje,
                {
                    "titulo": item["titulo"],
                    "contexto": item["contexto"],
                    "url": item["url"],
                    "fragmento": _fragmento(item["texto"], clave, terminos[0]),
                },
            )
        )

    encontrados.sort(key=lambda par: (-par[0], par[1]["titulo"]))
    return jsonify({"resultados": [r for _, r in encontrados[:12]]})


@app.route("/media/<path:filename>")
def media_raiz(filename: str):
    return send_from_directory(CONTENT, filename)


@app.route("/media/seccion/<seccion_id>/<path:filename>")
def media_seccion(seccion_id: str, filename: str):
    carpeta = SECCIONES_DIR / seccion_id
    if not carpeta.is_dir():
        abort(404)
    return send_from_directory(carpeta, filename)


@app.route("/favicon.ico")
def favicon_ico():
    return send_from_directory(ROOT / "static", "favicon.svg", mimetype="image/svg+xml")


@app.errorhandler(404)
def no_encontrado(_error):
    return render_template("404.html"), 404


@app.route("/healthz")
def healthz():
    return {"status": "ok"}, 200


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5001)
