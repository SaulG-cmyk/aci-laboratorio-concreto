(function () {
  "use strict";

  const KEY = "civil-lab-checklist-v1";
  const SECCIONES = Array.isArray(window.CIVIL_LAB_SECCIONES)
    ? window.CIVIL_LAB_SECCIONES
    : [];

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}") || {};
    } catch {
      return {};
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* El navegador puede bloquear el almacenamiento; la app sigue funcionando. */
    }
  }

  function seccionInfo(id) {
    return SECCIONES.find((s) => s.id === id) || null;
  }

  function totalPasos(id) {
    const info = seccionInfo(id);
    return info && Array.isArray(info.checklist) ? info.checklist.length : 0;
  }

  function pasosHechos(data, id) {
    const arr = Array.isArray(data[id]) ? data[id] : [];
    return arr.filter(Boolean).length;
  }

  function updateSectionCounter(data, id) {
    const el = document.querySelector(`[data-contador="${id}"]`);
    if (!el) return;
    el.textContent = `${pasosHechos(data, id)} de ${totalPasos(id)}`;
  }

  function updateProgress(data) {
    const box = document.getElementById("progreso");
    const texto = document.getElementById("progreso-texto");
    const barra = document.getElementById("progreso-barra");
    const reiniciar = document.getElementById("reiniciar-progreso");
    if (!box || !texto || !barra) return;

    let total = 0;
    let hechos = 0;
    SECCIONES.forEach((s) => {
      const n = Array.isArray(s.checklist) ? s.checklist.length : 0;
      total += n;
      hechos += Math.min(pasosHechos(data, s.id), n);
    });

    if (total === 0) {
      box.hidden = true;
      return;
    }

    const pct = Math.round((hechos / total) * 100);
    box.hidden = false;
    texto.textContent = `Avance ${hechos}/${total} · ${pct} %`;
    barra.style.width = `${pct}%`;
    if (reiniciar) reiniciar.hidden = hechos === 0;
  }

  function maybeCongratulate(data) {
    const el = document.getElementById("felicitacion");
    if (!el) return;
    const completo =
      SECCIONES.length > 0 &&
      SECCIONES.every((s) => {
        const n = Array.isArray(s.checklist) ? s.checklist.length : 0;
        return n > 0 && pasosHechos(data, s.id) >= n;
      });
    el.hidden = !completo;
  }

  function refrescar(data) {
    updateProgress(data);
    document.querySelectorAll(".checklist").forEach((list) => {
      updateSectionCounter(data, list.dataset.seccion);
    });
    maybeCongratulate(data);
  }

  // ---------------------------------------------------------------- checklist
  const dataInicial = load();
  document.querySelectorAll(".checklist").forEach((list) => {
    const seccion = list.dataset.seccion;
    const done = Array.isArray(dataInicial[seccion]) ? dataInicial[seccion] : [];
    list.querySelectorAll("input[type=checkbox]").forEach((box) => {
      const idx = Number(box.dataset.idx);
      box.checked = Boolean(done[idx]);
      box.addEventListener("change", () => {
        const current = load();
        const arr = Array.isArray(current[seccion]) ? current[seccion] : [];
        arr[idx] = box.checked;
        current[seccion] = arr;
        save(current);
        refrescar(current);
      });
    });
  });
  refrescar(dataInicial);

  // ------------------------------------------------------- reinicio de avance
  function reiniciarSeccion(id) {
    const current = load();
    delete current[id];
    save(current);
    const list = document.querySelector(`.checklist[data-seccion="${id}"]`);
    if (list) {
      list.querySelectorAll("input[type=checkbox]").forEach((box) => {
        box.checked = false;
      });
    }
    refrescar(current);
    mostrarAviso("Se borró el avance de esta práctica.");
  }

  document.querySelectorAll("[data-reiniciar-seccion]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.reiniciarSeccion;
      if (window.confirm("¿Borrar el avance marcado en esta práctica?")) {
        reiniciarSeccion(id);
      }
    });
  });

  const reiniciarTodo = document.getElementById("reiniciar-progreso");
  if (reiniciarTodo) {
    reiniciarTodo.addEventListener("click", () => {
      if (!window.confirm("¿Borrar todo el avance guardado en este navegador?")) return;
      try {
        localStorage.removeItem(KEY);
      } catch {
        save({});
      }
      document.querySelectorAll(".checklist input[type=checkbox]").forEach((box) => {
        box.checked = false;
      });
      const fe = document.getElementById("felicitacion");
      if (fe) fe.hidden = true;
      refrescar(load());
      mostrarAviso("Se reinició todo el avance.");
    });
  }

  // -------------------------------------------------------------------- aviso
  let avisoTimer = null;
  function mostrarAviso(mensaje) {
    const aviso = document.getElementById("aviso");
    if (!aviso) return;
    aviso.textContent = mensaje;
    aviso.hidden = false;
    if (avisoTimer) window.clearTimeout(avisoTimer);
    avisoTimer = window.setTimeout(() => {
      aviso.hidden = true;
    }, 3500);
  }

  // ------------------------------------------------------------------ imprimir
  document.querySelectorAll("[data-imprimir]").forEach((btn) => {
    btn.addEventListener("click", () => window.print());
  });

  // -------------------------------------------------------------------- images
  document.querySelectorAll(".prosa img").forEach((img) => {
    img.loading = "lazy";
    img.addEventListener("error", () => {
      const note = document.createElement("div");
      note.className = "img-faltante";
      note.textContent =
        "Imagen pendiente. Coloca el archivo en la carpeta imagenes de esta sección (el nombre debe coincidir con el Markdown).";
      img.replaceWith(note);
    });
  });

  // ------------------------------------------------------------------ buscador
  const input = document.getElementById("buscador");
  const box = document.getElementById("resultados");
  let buscarTimer = null;
  let buscarController = null;

  function cerrarResultados() {
    if (!box) return;
    box.hidden = true;
    box.innerHTML = "";
  }

  function crearResultado(item) {
    const a = document.createElement("a");
    a.href = item.url;
    a.className = "resultado";

    const titulo = document.createElement("strong");
    titulo.textContent = item.titulo;

    const contexto = document.createElement("small");
    contexto.textContent = item.contexto || "Contenido";

    const fragmento = document.createElement("p");
    fragmento.textContent = item.fragmento || "";

    a.append(titulo, contexto, fragmento);
    return a;
  }

  function mostrarResultados(items) {
    if (!box) return;
    box.innerHTML = "";
    if (!items.length) {
      const vacio = document.createElement("p");
      vacio.className = "sin-resultados";
      vacio.textContent = "No encontramos coincidencias. Prueba con otra palabra o revisa la ortografía.";
      box.append(vacio);
    } else {
      items.forEach((item) => box.append(crearResultado(item)));
    }
    box.hidden = false;
  }

  if (input && box) {
    input.addEventListener("input", () => {
      const q = input.value.trim();
      if (q.length < 2) {
        cerrarResultados();
        return;
      }
      if (buscarTimer) window.clearTimeout(buscarTimer);
      buscarTimer = window.setTimeout(async () => {
        if (buscarController) buscarController.abort();
        buscarController = new AbortController();
        try {
          const respuesta = await fetch(`/api/buscar?q=${encodeURIComponent(q)}`, {
            signal: buscarController.signal,
            headers: { Accept: "application/json" },
          });
          if (!respuesta.ok) throw new Error("Respuesta no válida");
          const datos = await respuesta.json();
          mostrarResultados(Array.isArray(datos.resultados) ? datos.resultados : []);
        } catch (error) {
          if (error.name === "AbortError") return;
          box.innerHTML = "";
          const fallo = document.createElement("p");
          fallo.className = "sin-resultados";
          fallo.textContent = "No se pudo completar la búsqueda. Revisa que el servidor siga activo.";
          box.append(fallo);
          box.hidden = false;
        }
      }, 220);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        input.value = "";
        cerrarResultados();
        input.blur();
      }
      if (event.key === "Enter") {
        const primero = box.querySelector("a.resultado");
        if (primero) {
          event.preventDefault();
          primero.click();
        }
      }
    });

    document.addEventListener("click", (event) => {
      if (!box.hidden && !box.contains(event.target) && event.target !== input) {
        cerrarResultados();
      }
    });

    document.addEventListener("keydown", (event) => {
      const activo = document.activeElement;
      const escribiendo =
        activo &&
        (activo.tagName === "INPUT" ||
          activo.tagName === "TEXTAREA" ||
          activo.tagName === "SELECT" ||
          activo.isContentEditable);
      if (event.key === "/" && !escribiendo) {
        event.preventDefault();
        input.focus();
      }
    });
  }

  // ------------------------------------------------------- continuar donde lo dejaste
  (function continuar() {
    const KEY_VISITA = "civil-lab-ultima-visita";
    const contenedor = document.getElementById("continuar");
    const enlace = document.getElementById("continuar-enlace");
    const borrar = document.getElementById("borrar-continuar");

    function guardar() {
      if (location.pathname === "/" || location.pathname === "/index.html") return;
      if (document.title.indexOf("Página no encontrada") !== -1) return;
      const titulo = (document.querySelector("main h1") || {}).textContent || document.title;
      try {
        localStorage.setItem(KEY_VISITA, JSON.stringify({
          href: location.pathname + location.search,
          titulo: titulo.replace(/\s+/g, " ").trim(),
        }));
      } catch {
        /* sin almacenamiento: se omite */
      }
    }

    if (contenedor && enlace) {
      try {
        const raw = localStorage.getItem(KEY_VISITA);
        if (raw) {
          const data = JSON.parse(raw);
          if (data && data.href && data.titulo) {
            enlace.href = data.href;
            enlace.textContent = `Continuar: ${data.titulo}`;
            contenedor.hidden = false;
          }
        }
      } catch {
        /* datos corruptos: se ignoran */
      }
    }

    if (borrar) {
      borrar.addEventListener("click", () => {
        try { localStorage.removeItem(KEY_VISITA); } catch {}
        if (contenedor) contenedor.hidden = true;
      });
    }

    guardar();
  })();
})();
