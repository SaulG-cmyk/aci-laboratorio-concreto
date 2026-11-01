# Civil Lab — Manual de pruebas al concreto (ACI Grado 1)

Aplicación web en Python para consultar el manual técnico de pruebas al concreto fresco en obra. El contenido está en español y se edita en Markdown.

## Qué incluye

- Introducción, objetivos y apéndice.
- Siete secciones: muestreo, temperatura, asentamiento, densidad, aire por presión, aire volumétrico, cilindros y vigas.
- En cada sección: **Normativa**, **Procedimientos** y **Ensayos**.
- Ficha de especificaciones y checklist por práctica, con avance guardado en el navegador.
- Navegación anterior / siguiente y mensaje de cierre al completar las siete prácticas.
- **Recursos de estudio**:
  - Autoevaluación de 21 preguntas con calificación, retroalimentación y mejor puntaje guardado.
  - Calculadoras de densidad, rendimiento, aire, resistencia, temperatura y conversiones.
  - Formatos de campo imprimibles para las siete prácticas y registro de no conformidad.
  - Glosario técnico, guía de seguridad y programa de equipo y calibración.
- **Buscador** en todo el contenido (normas, procedimientos, ensayos, glosario y recursos), insensible a acentos.
- **Impresión / PDF** desde cualquier sección o página, con estilos de impresión.
- **Reinicio de avance** por práctica o global.
- Página 404 y favicon.

El contenido didáctico se edita en Markdown e imágenes. Instrucciones: [COMO_AGREGAR_CONTENIDO.md](COMO_AGREGAR_CONTENIDO.md).

## Cómo ejecutar

En una terminal, dentro de esta carpeta:

```bat
python -m pip install -r requirements.txt
python app.py
```

Abre [http://127.0.0.1:5001](http://127.0.0.1:5001).

La aplicación usa Flask y Python-Markdown. En modo debug recarga las plantillas y el código automáticamente; los cambios de contenido se ven al refrescar el navegador.

## Estructura

```text
app.py                  Rutas, búsqueda y renderizado de Markdown
content/
  catalogo.json         Páginas, grupos, vistas y orden del menú
  imagenes/             Imágenes de portada y apéndice
  recursos/             Glosario, seguridad, formatos, equipo y banco de preguntas
  secciones/XX-nombre/  info.json + normativa.md + procedimientos.md + ensayos.md
templates/              Plantillas Jinja
static/                 CSS, JavaScript y favicon
```

## Atajos

- `/` enfoca el buscador.
- `Esc` cierra los resultados de búsqueda.
- El botón **Imprimir / PDF** usa el diálogo del navegador; elige “Guardar como PDF” para archivar.
- El avance del checklist se guarda en `localStorage`; el botón **Reiniciar** lo borra de este navegador.

## Alcance

Este manual resume las normas ASTM del programa ACI Grado I con redacción propia. No sustituye la edición vigente de las normas, la especificación del proyecto ni la práctica supervisada con equipo real.


## Publicar en un dominio (plataforma gestionada)

El repositorio ya incluye `Procfile`, `render.yaml`, `Dockerfile` y `runtime.txt` para despliegue en Render, Railway o Fly.io.

### Render (ejemplo)

1. Crea una cuenta en [render.com](https://render.com) y conecta tu cuenta de GitHub.
2. Elige **New → Web Service** y selecciona `SaulG-cmyk/aci-laboratorio-concreto`.
3. Render detectará el `render.yaml`. Si no, configura:
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
4. Elige el plan (el gratuito sirve para pruebas) y crea el servicio.
5. Render asignará una URL `https://...onrender.com`.

### Dominio propio

1. Compra el dominio en tu registrador (Namecheap, Cloudflare, GoDaddy, etc.).
2. En Render, ve a **Settings → Custom Domains** y agrega tu dominio (`tudominio.com` y `www.tudominio.com`).
3. Render te mostrará los registros DNS a crear:
   - Un registro `CNAME` para `www` apuntando a la URL de Render.
   - Un registro `A` (o `ALIAS`/`ANAME`) para el dominio raíz apuntando a la IP que indique Render.
4. Crea esos registros en el panel DNS de tu registrador.
5. Render provisionará el certificado HTTPS automáticamente (Let's Encrypt).

### Notas

- La aplicación no usa base de datos: el avance del checklist y la autoevaluación se guardan en el navegador del usuario (`localStorage`).
- `gunicorn` está incluido en `requirements.txt` para el entorno Linux de producción; en Windows sigue usándose `python app.py`.
- El endpoint `/healthz` puede usarse como health check de la plataforma.
