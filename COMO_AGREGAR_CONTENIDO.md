# Cómo agregar contenido sin dañar la aplicación

El contenido didáctico vive en la carpeta `content/`. Para cambios de texto, imágenes o preguntas no necesitas tocar el código. Solo se editan `app.py`, `templates/` o `static/` cuando se agrega una función nueva.

## Dónde va cada cosa

| Qué quieres cambiar | Archivo |
| --- | --- |
| Introducción | `content/introduccion.md` |
| Objetivos | `content/objetivos.md` |
| Apéndice | `content/apendice.md` |
| Glosario | `content/recursos/glosario.md` |
| Seguridad | `content/recursos/seguridad.md` |
| Formatos imprimibles | `content/recursos/formatos.md` |
| Equipo y calibración | `content/recursos/equipo-calibracion.md` |
| Preguntas de la autoevaluación | `content/recursos/autoevaluacion.json` |
| Título, resumen, normas, especificaciones y checklist de una sección | `content/secciones/XX-nombre/info.json` |
| Texto de Normativa | `content/secciones/XX-nombre/normativa.md` |
| Texto de Procedimientos | `content/secciones/XX-nombre/procedimientos.md` |
| Texto de Ensayos | `content/secciones/XX-nombre/ensayos.md` |
| Fotos de una sección | `content/secciones/XX-nombre/imagenes/` |
| Fotos de intro / recursos / apéndice | `content/imagenes/` |

`XX-nombre` es, por ejemplo, `01-muestreo` o `03-asentamiento`.

## Texto (Markdown)

Abre el `.md` con el Bloc de notas, VS Code o cualquier editor que guarde UTF-8. Puedes usar:

```md
# Título
Párrafo normal.

1. Paso uno
2. Paso dos

- Viñeta

**Negrita** e *itálica*

| Columna A | Columna B |
| --- | --- |
| Dato | Dato |
```

Para separar formatos al imprimir, coloca esta línea entre secciones:

```html
<div class="salto-impresion"></div>
```

Guarda en **UTF-8** y recarga el navegador (F5). El servidor no necesita reiniciarse para cambios de contenido.

## Imágenes

1. Copia el archivo (`.jpg`, `.png`, `.webp`) a la carpeta `imagenes` de esa sección o a `content/imagenes/`.
2. En el Markdown pon el **mismo nombre de archivo**:

```md
![Cono de Abrams en obra](imagenes/cono-obra.jpg)
```

Si la imagen no existe, la app muestra un recuadro “Imagen pendiente” y no se rompe. Usa nombres en minúsculas y sin espacios (`muestreo-01.jpg`).

## Especificaciones y checklist (`info.json`)

Es un archivo JSON: respeta comas y comillas.

```json
{
  "id": "01-muestreo",
  "numero": 1,
  "titulo": "Muestreo de concreto fresco",
  "resumen": "Una frase corta.",
  "norma_principal": "ASTM C172 / NMX-C-161",
  "especificaciones": [
    { "label": "Muestra mínima", "valor": "El texto que quieran." }
  ],
  "checklist": [
    "Primer paso",
    "Segundo paso"
  ]
}
```

- No borres `id` ni `numero`.
- No dejes una coma extra al final de las listas.
- Si el JSON queda mal formado, la sección no abrirá. Valídalo con `python -m json.tool archivo.json` o en [jsonlint.com](https://jsonlint.com).

## Páginas y menú (`catalogo.json`)

Cada entrada de `paginas` genera una ruta `/pagina/<id>` y un enlace en el menú. El campo `menu` decide dónde aparece:

| Valor de `menu` | Ubicación en el menú |
| --- | --- |
| `inicio` | Debajo de Inicio, antes de las prácticas |
| `recursos` | Dentro del grupo **Recursos** |
| `cierre` | Después de Recursos (por ejemplo, Apéndice) |

Ejemplo de página Markdown:

```json
{
  "id": "mi-pagina",
  "titulo": "Mi página",
  "resumen": "Texto para el menú, la portada y la búsqueda.",
  "archivo": "recursos/mi-pagina.md",
  "menu": "recursos"
}
```

Para una página con plantilla interactiva se usa `plantilla` en lugar de `archivo`:

```json
{
  "id": "autoevaluacion",
  "titulo": "Autoevaluación",
  "resumen": "21 preguntas con retroalimentación.",
  "menu": "recursos",
  "plantilla": "autoevaluacion.html",
  "banco": "recursos/autoevaluacion.json"
}
```

## Preguntas de la autoevaluación

Edita `content/recursos/autoevaluacion.json`. Cada pregunta tiene tema, enunciado, cuatro opciones, el índice de la respuesta correcta (**empieza en 0**) y una explicación.

```json
{
  "tema": "Muestreo",
  "pregunta": "¿Cuál es el tiempo máximo de composición?",
  "opciones": ["5 min", "10 min", "15 min", "30 min"],
  "correcta": 2,
  "explicacion": "La ASTM C172 limita la composición a 15 minutos."
}
```

- `correcta: 2` significa que la respuesta es la **tercera** opción.
- Mantén cuatro opciones por pregunta para que la plantilla se vea uniforme.
- El campo `aprobado` de la raíz define el porcentaje mínimo (por defecto 80).
- Después de editar, recarga `/pagina/autoevaluacion` y prueba una pregunta.

## Búsqueda

La búsqueda se genera automáticamente a partir de los archivos `.md` y de los metadatos de cada sección. No hay que mantener un índice aparte. Si agregas una página o sección, aparecerá al recargar.

## Impresión

Los botones **Imprimir / PDF** están en cada sección y página. Los estilos de impresión ocultan el menú, el buscador y los botones, y conservan tablas, diagramas, checklists y formatos. En el diálogo del navegador elige la impresora o “Guardar como PDF”.

## Qué no tocar sin necesidad

- `app.py` — rutas, búsqueda y carga de contenido.
- `templates/` — estructura HTML.
- `static/` — estilos y JavaScript.
- `content/catalogo.json` — salvo que agregues o reordenes páginas o secciones.

Si necesitas una calculadora o una interacción nueva, es una función de código: pide apoyo antes de editar `static/js/calculadoras.js` o las plantillas.

## Añadir una sección nueva (opcional)

1. Crea `content/secciones/08-nueva/` con `info.json`, `normativa.md`, `procedimientos.md`, `ensayos.md` e `imagenes/`.
2. Agrega `"08-nueva"` al arreglo `secciones` del grupo correspondiente en `content/catalogo.json`.
3. Agrega el checklist completo en `info.json`; el avance y la felicitación final se calculan con ese arreglo.
4. Recarga y revisa que aparezca en el menú, en la portada y en la búsqueda.

## Validación rápida antes de publicar

```bat
python -m json.tool content\catalogo.json > nul
python -m json.tool content\recursos\autoevaluacion.json > nul
python app.py
```

Luego revisa:

- Que la página nueva aparezca en el menú y en la portada.
- Que las imágenes carguen y que no haya enlaces rotos.
- Que la búsqueda encuentre una palabra del texto nuevo.
- Que la impresión no corte tablas ni formularios.
- Que el checklist guarde y reinicie el avance.

## Copyright

No copies páginas completas del manual ACI ni de otras publicaciones protegidas. Usa redacción propia, tablas y diagramas originales, y fotos de tu laboratorio.
