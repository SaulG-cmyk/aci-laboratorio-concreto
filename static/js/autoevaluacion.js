(function () {
  "use strict";

  const form = document.getElementById("quiz");
  const resultado = document.getElementById("quiz-resultado");
  const mejorEl = document.getElementById("quiz-mejor");
  const limpiar = document.getElementById("limpiar-quiz");
  const modoExamen = document.getElementById("modo-examen");
  const iniciarExamenBtn = document.getElementById("iniciar-examen");
  const tiempoEl = document.getElementById("tiempo-examen");
  const descargarBtn = document.getElementById("descargar-resultado");
  if (!form || !resultado) return;

  const KEY = "civil-lab-quiz-v1";
  const aprobado = Number(form.dataset.aprobado) || 80;
  const tiempoTotal = 30 * 60;
  let tiempoRestante = tiempoTotal;
  let temporizador = null;
  let ultimoResultado = [];
  const ordenOriginal = Array.from(form.querySelectorAll(".pregunta"));

  function obtenerPreguntas() {
    return Array.from(form.querySelectorAll(".pregunta"));
  }

  function leerHistorial() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}") || {};
    } catch {
      return {};
    }
  }

  function guardarHistorial(datos) {
    try {
      localStorage.setItem(KEY, JSON.stringify(datos));
    } catch {
      /* almacenamiento bloqueado: el quiz sigue funcionando en memoria */
    }
  }

  function mostrarMejor() {
    if (!mejorEl) return;
    const historial = leerHistorial();
    if (!historial.mejor) {
      mejorEl.hidden = true;
      return;
    }
    const intentos = Number(historial.intentos) || 1;
    mejorEl.hidden = false;
    mejorEl.textContent = `Tu mejor resultado: ${historial.mejor} % en ${intentos} ${
      intentos === 1 ? "intento" : "intentos"
    }.`;
  }

  function detenerTemporizador() {
    if (temporizador) {
      window.clearInterval(temporizador);
      temporizador = null;
    }
  }

  function formatearTiempo(segundos) {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
  }

  function actualizarTiempo() {
    if (!tiempoEl) return;
    tiempoEl.textContent = formatearTiempo(tiempoRestante);
    tiempoEl.hidden = false;
    if (tiempoRestante <= 60) {
      tiempoEl.classList.add("tiempo-critico");
    } else {
      tiempoEl.classList.remove("tiempo-critico");
    }
  }

  function limpiarMarcas() {
    obtenerPreguntas().forEach((pregunta) => {
      pregunta.classList.remove("correcta", "incorrecta", "sin-responder");
      pregunta.querySelectorAll(".opciones label").forEach((label) => {
        label.classList.remove("opcion-correcta", "opcion-elegida");
      });
      const explicacion = pregunta.querySelector(".explicacion");
      if (explicacion) explicacion.hidden = true;
    });
    resultado.hidden = true;
    resultado.innerHTML = "";
    if (descargarBtn) descargarBtn.hidden = true;
  }

  function mezclarPreguntas() {
    const preguntas = obtenerPreguntas();
    for (let i = preguntas.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      form.insertBefore(preguntas[j], preguntas[i]);
    }
  }

  function restaurarOrden() {
    ordenOriginal.forEach((pregunta) => form.appendChild(pregunta));
  }

  function iniciarExamen() {
    detenerTemporizador();
    limpiarMarcas();
    tiempoRestante = tiempoTotal;
    if (modoExamen && modoExamen.checked) {
      mezclarPreguntas();
      actualizarTiempo();
      temporizador = window.setInterval(() => {
        tiempoRestante -= 1;
        actualizarTiempo();
        if (tiempoRestante <= 0) {
          detenerTemporizador();
          if (tiempoEl) tiempoEl.textContent = "00:00";
          calificar(true);
        }
      }, 1000);
    } else {
      restaurarOrden();
      if (tiempoEl) tiempoEl.hidden = true;
    }
    const primera = form.querySelector(".pregunta");
    if (primera) primera.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function crearResumen(aciertos, total, sinResponder, pct, porTiempo) {
    resultado.innerHTML = "";

    const titulo = document.createElement("h2");
    titulo.textContent =
      porTiempo
        ? "Tiempo agotado"
        : pct >= aprobado
          ? "¡Aprobaste la autoevaluación!"
          : "Sigue repasando";
    resultado.append(titulo);

    const puntaje = document.createElement("p");
    puntaje.className = "quiz-puntaje";
    puntaje.textContent = `${pct} %`;
    resultado.append(puntaje);

    const detalle = document.createElement("p");
    detalle.textContent = `${aciertos} de ${total} respuestas correctas. ${
      pct >= aprobado
        ? `Superaste el mínimo de ${aprobado} %.`
        : `Necesitas al menos ${aprobado} % para aprobar.`
    }`;
    resultado.append(detalle);

    if (sinResponder > 0) {
      const aviso = document.createElement("p");
      aviso.className = "muted";
      aviso.textContent = `Dejaste ${sinResponder} ${
        sinResponder === 1 ? "pregunta sin responder" : "preguntas sin responder"
      }; se contaron como incorrectas.`;
      resultado.append(aviso);
    }

    const recomendacion = document.createElement("p");
    recomendacion.className = "quiz-recomendacion";
    recomendacion.textContent =
      pct >= aprobado
        ? "Repasa las explicaciones de las preguntas falladas y practica la secuencia con equipo real antes del examen de desempeño."
        : "Vuelve a las pestañas de Normativa y Procedimientos de los temas con error, y repite la autoevaluación.";
    resultado.append(recomendacion);

    resultado.hidden = false;
    if (descargarBtn) descargarBtn.hidden = false;
  }

  function calificar(porTiempo) {
    detenerTemporizador();
    const preguntas = obtenerPreguntas();
    let aciertos = 0;
    let sinResponder = 0;
    ultimoResultado = [];

    preguntas.forEach((pregunta, indice) => {
      const correcta = Number(pregunta.dataset.correcta);
      const seleccionada = pregunta.querySelector('input[type="radio"]:checked');
      const explicacion = pregunta.querySelector(".explicacion");
      const tema = pregunta.dataset.tema || "";
      const enunciado = (pregunta.querySelector("legend") || {}).textContent || "";

      pregunta.classList.remove("correcta", "incorrecta", "sin-responder");
      pregunta.querySelectorAll(".opciones label").forEach((label) => {
        const radio = label.querySelector("input");
        label.classList.remove("opcion-correcta", "opcion-elegida");
        if (Number(radio.value) === correcta) {
          label.classList.add("opcion-correcta");
        }
        if (seleccionada === radio && Number(radio.value) !== correcta) {
          label.classList.add("opcion-elegida");
        }
      });

      let elegidaTexto = "Sin responder";
      if (seleccionada) {
        const label = seleccionada.closest("label");
        elegidaTexto = label ? label.textContent.trim() : seleccionada.value;
      }
      const correctaTexto = (pregunta.querySelector(".respuesta-correcta") || {}).textContent || "";

      if (!seleccionada) {
        sinResponder += 1;
        pregunta.classList.add("sin-responder");
      } else if (Number(seleccionada.value) === correcta) {
        aciertos += 1;
        pregunta.classList.add("correcta");
      } else {
        pregunta.classList.add("incorrecta");
      }

      if (explicacion) explicacion.hidden = false;

      ultimoResultado.push({
        numero: indice + 1,
        tema,
        pregunta: enunciado.replace(/\s+/g, " ").trim(),
        elegida: elegidaTexto.replace(/\s+/g, " ").trim(),
        correcta: correctaTexto.replace(/\s+/g, " ").trim(),
        resultado:
          !seleccionada ? "Sin responder" : Number(seleccionada.value) === correcta ? "Correcta" : "Incorrecta",
      });
    });

    const total = preguntas.length;
    const pct = total ? Math.round((aciertos / total) * 100) : 0;
    crearResumen(aciertos, total, sinResponder, pct, porTiempo);

    const historial = leerHistorial();
    historial.intentos = (Number(historial.intentos) || 0) + 1;
    historial.ultimo = pct;
    historial.mejor = Math.max(Number(historial.mejor) || 0, pct);
    guardarHistorial(historial);
    mostrarMejor();

    resultado.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calificar(false);
  });

  if (limpiar) {
    limpiar.addEventListener("click", () => {
      detenerTemporizador();
      form.reset();
      limpiarMarcas();
      restaurarOrden();
      if (tiempoEl) tiempoEl.hidden = true;
      tiempoRestante = tiempoTotal;
      const primera = form.querySelector(".pregunta");
      if (primera) primera.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (iniciarExamenBtn) {
    iniciarExamenBtn.addEventListener("click", iniciarExamen);
  }

  if (descargarBtn) {
    descargarBtn.addEventListener("click", () => {
      if (!ultimoResultado.length) return;
      const encabezado = ["No.", "Tema", "Pregunta", "Respuesta elegida", "Respuesta correcta", "Resultado"];
      const filas = [encabezado.join(",")];
      ultimoResultado.forEach((r) => {
        const valores = [r.numero, r.tema, r.pregunta, r.elegida, r.correcta, r.resultado].map((v) => {
          const texto = String(v).replace(/"/g, '""');
          return `"${texto}"`;
        });
        filas.push(valores.join(","));
      });
      const blob = new Blob(["\ufeff" + filas.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = "autoevaluacion-resultado.csv";
      document.body.append(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    });
  }

  mostrarMejor();
})();
