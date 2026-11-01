(function () {
  "use strict";

  function leerNumero(card, campo) {
    const el = card.querySelector(`[data-campo="${campo}"]`);
    if (!el) return NaN;
    let texto = String(el.value || "").trim().replace(/\s/g, "");
    if (!texto) return NaN;
    if (texto.includes(",") && texto.includes(".")) {
      texto = texto.replace(/\./g, "").replace(",", ".");
    } else {
      texto = texto.replace(",", ".");
    }
    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : NaN;
  }

  function requerido(card, campo, etiqueta) {
    const valor = leerNumero(card, campo);
    if (!Number.isFinite(valor)) {
      throw new Error(`Escribe un valor válido para ${etiqueta}.`);
    }
    return valor;
  }

  function formatear(valor, decimales) {
    if (!Number.isFinite(valor)) return "—";
    if (valor !== 0 && Math.abs(valor) < 0.000001) {
      return valor.toExponential(3).replace(".", ",");
    }
    return new Intl.NumberFormat("es-MX", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimales,
    }).format(valor);
  }

  function caja(card) {
    return card.querySelector("[data-resultado]");
  }

  function mostrarError(card, mensaje) {
    const box = caja(card);
    if (!box) return;
    box.innerHTML = "";
    const p = document.createElement("p");
    p.className = "calc-error";
    p.textContent = mensaje;
    box.append(p);
    box.hidden = false;
  }

  function mostrarFilas(card, filas, nota) {
    const box = caja(card);
    if (!box) return;
    box.innerHTML = "";
    const dl = document.createElement("dl");
    dl.className = "lista-resultados";

    filas.forEach((fila) => {
      const dt = document.createElement("dt");
      dt.textContent = fila.etiqueta;
      const dd = document.createElement("dd");
      if (fila.principal) dd.className = "principal";
      dd.textContent = `${fila.valor}${fila.unidad ? ` ${fila.unidad}` : ""}`;
      dl.append(dt, dd);
    });
    box.append(dl);

    if (nota) {
      const p = document.createElement("p");
      p.className = "calc-nota";
      p.textContent = nota;
      box.append(p);
    }
    box.hidden = false;
  }

  const CALCULOS = {
    densidad(card) {
      const mc = requerido(card, "mc", "la masa del molde lleno");
      const mm = requerido(card, "mm", "la masa del molde vacío");
      const vmL = requerido(card, "vm", "el volumen del molde");
      if (vmL <= 0) throw new Error("El volumen del molde debe ser mayor que cero.");
      if (mc <= mm) {
        throw new Error("La masa del molde lleno debe ser mayor que la del molde vacío.");
      }

      const masa = mc - mm;
      const volumen = vmL / 1000;
      const densidad = masa / volumen;

      mostrarFilas(
        card,
        [
          { etiqueta: "Masa neta de concreto", valor: formatear(masa, 2), unidad: "kg" },
          { etiqueta: "Volumen del molde", valor: formatear(volumen, 5), unidad: "m³" },
          { etiqueta: "Densidad del concreto", valor: formatear(densidad, 1), unidad: "kg/m³", principal: true },
          { etiqueta: "Equivalente", valor: formatear(densidad * 0.06242796, 1), unidad: "lb/ft³" },
        ],
        "Reporta la densidad al 1 kg/m³ más cercano, salvo que el proyecto indique otra precisión."
      );
    },

    rendimiento(card) {
      const masa = requerido(card, "masa", "la masa total de la amasada");
      const densidad = requerido(card, "densidad", "la densidad medida");
      const yd = requerido(card, "yd", "el volumen diseñado");
      if (densidad <= 0) throw new Error("La densidad debe ser mayor que cero.");
      if (yd <= 0) throw new Error("El volumen diseñado debe ser mayor que cero.");

      const rendimiento = masa / densidad;
      const relativo = rendimiento / yd;
      const filas = [
        { etiqueta: "Rendimiento de la amasada", valor: formatear(rendimiento, 3), unidad: "m³", principal: true },
        { etiqueta: "Rendimiento relativo", valor: formatear(relativo, 3), unidad: "" },
        { etiqueta: "Equivalente", valor: formatear(rendimiento / 0.764554857984, 2), unidad: "yd³" },
      ];

      const cemento = leerNumero(card, "cemento");
      if (Number.isFinite(cemento) && cemento > 0) {
        filas.push({
          etiqueta: "Contenido de cemento",
          valor: formatear(cemento / rendimiento, 1),
          unidad: "kg/m³",
        });
      }

      const teorica = leerNumero(card, "teorica");
      let nota =
        relativo < 0.98
          ? "El rendimiento relativo es bajo: la amasada produjo menos volumen del diseñado. Revisa dosificación, aire y pesadas."
          : relativo > 1.02
            ? "El rendimiento relativo es alto: se produjo más volumen del diseñado. Revisa dosificación, aire y contenido de agregado."
            : "El rendimiento relativo está cerca de 1.00. Confirma con el histórico del productor y la especificación.";

      if (Number.isFinite(teorica) && teorica > 0) {
        const aire = ((teorica - densidad) / teorica) * 100;
        filas.push({
          etiqueta: "Aire gravimétrico",
          valor: formatear(aire, 2),
          unidad: "%",
        });
        if (aire < 0) {
          nota += " El aire gravimétrico resultó negativo: la densidad medida supera la teórica, así que revisa ambos datos.";
        }
      }

      mostrarFilas(card, filas, nota);
    },

    "aire-presion"(card) {
      const a1 = requerido(card, "a1", "el contenido aparente A1");
      const g = requerido(card, "g", "el factor de corrección G");
      if (a1 < 0 || g < 0) throw new Error("Los contenidos de aire y el factor G no pueden ser negativos.");

      const as = a1 - g;
      const filas = [
        { etiqueta: "Contenido aparente, A1", valor: formatear(a1, 2), unidad: "%" },
        { etiqueta: "Factor por agregado, G", valor: formatear(g, 2), unidad: "%" },
        { etiqueta: "Contenido real, As", valor: formatear(as, 2), unidad: "%", principal: true },
      ];

      const vc = leerNumero(card, "vc");
      const vt = leerNumero(card, "vt");
      const va = leerNumero(card, "va");
      let nota = "Reporta el contenido de aire al 0.1 % más cercano después de restar G.";

      if (Number.isFinite(vc) && Number.isFinite(vt) && Number.isFinite(va)) {
        if (vt <= 0) throw new Error("El volumen absoluto total Vt debe ser mayor que cero.");
        const denominador = 100 * vt - as * va;
        if (denominador <= 0) {
          nota += " No se pudo calcular At: el denominador de la fórmula es menor o igual que cero.";
        } else {
          const at = (100 * as * vc) / denominador;
          filas.push({
            etiqueta: "Aire de la mezcla completa, At",
            valor: formatear(at, 2),
            unidad: "%",
          });
        }
      }

      if (as < 0) {
        nota += " El contenido real resultó negativo: revisa la lectura y el factor G.";
      }

      mostrarFilas(card, filas, nota);
    },

    "aire-volumetrico"(card) {
      const ar = requerido(card, "ar", "la lectura final AR");
      const c = requerido(card, "c", "la corrección por alcohol C");
      let w = leerNumero(card, "w");
      if (!Number.isFinite(w)) w = 0;
      if (w < 0) throw new Error("El número de copas W no puede ser negativo.");

      const aire = ar - c + w;
      mostrarFilas(
        card,
        [
          { etiqueta: "Lectura final, AR", valor: formatear(ar, 2), unidad: "%" },
          { etiqueta: "Corrección por alcohol, C", valor: formatear(c, 2), unidad: "%" },
          { etiqueta: "Copas calibradas, W", valor: formatear(w, 0), unidad: "" },
          { etiqueta: "Contenido de aire, A", valor: formatear(aire, 2), unidad: "%", principal: true },
        ],
        "Reporta al 0.25 % más cercano. Si el resultado es negativo, revisa la lectura y la corrección."
      );
    },

    resistencia(card) {
      const carga = requerido(card, "carga", "la carga máxima");
      const diametro = requerido(card, "diametro", "el diámetro del cilindro");
      if (carga <= 0) throw new Error("La carga debe ser mayor que cero.");
      if (diametro <= 0) throw new Error("El diámetro debe ser mayor que cero.");

      const area = (Math.PI * diametro * diametro) / 4;
      const esfuerzo = (10 * carga) / area;
      const filas = [
        { etiqueta: "Área de la sección", valor: formatear(area, 2), unidad: "cm²" },
        { etiqueta: "Esfuerzo a compresión", valor: formatear(esfuerzo, 2), unidad: "MPa", principal: true },
        { etiqueta: "Equivalente", valor: formatear(esfuerzo * 145.0377377, 1), unidad: "psi" },
      ];

      const altura = leerNumero(card, "altura");
      if (Number.isFinite(altura) && altura > 0) {
        filas.push({
          etiqueta: "Volumen del cilindro",
          valor: formatear((area * altura) / 1000, 2),
          unidad: "L",
        });
      }

      mostrarFilas(
        card,
        filas,
        "Cálculo geométrico de apoyo. No corrige por cabeceo, relación longitud/diámetro, humedad ni velocidad de carga."
      );
    },

    temperatura(card) {
      const lectura = requerido(card, "temp", "la lectura del instrumento");
      const unidadEl = card.querySelector('[data-campo="unidad"]');
      const unidad = unidadEl ? unidadEl.value : "C";
      let correccion = leerNumero(card, "correccion");
      if (!Number.isFinite(correccion)) correccion = 0;

      let celsius = unidad === "F" ? (lectura - 32) / 1.8 : lectura;
      const correccionC = unidad === "F" ? correccion / 1.8 : correccion;
      celsius += correccionC;
      const fahrenheit = celsius * 1.8 + 32;

      mostrarFilas(
        card,
        [
          { etiqueta: "Temperatura corregida", valor: formatear(celsius, 2), unidad: "°C", principal: true },
          { etiqueta: "Equivalente", valor: formatear(fahrenheit, 2), unidad: "°F" },
          { etiqueta: "Lectura original", valor: formatear(lectura, 2), unidad: `°${unidad}` },
        ],
        "Reporta al 0.5 °C (1 °F) más cercano. La corrección debe provenir del certificado o de la verificación del instrumento."
      );
    },

    conversiones(card) {
      const valor = requerido(card, "valor", "el valor a convertir");
      const categoriaEl = card.querySelector('[data-campo="categoria"]');
      const deEl = card.querySelector('[data-campo="de"]');
      const aEl = card.querySelector('[data-campo="a"]');
      if (!categoriaEl || !deEl || !aEl) return;

      const categoria = categoriaEl.value;
      const grupo = UNIDADES[categoria];
      if (!grupo) throw new Error("Selecciona una categoría válida.");
      const factorDe = grupo.unidades[deEl.value];
      const factorA = grupo.unidades[aEl.value];
      if (!factorDe || !factorA) throw new Error("Selecciona las unidades de origen y destino.");

      const convertido = (valor * factorDe) / factorA;
      mostrarFilas(
        card,
        [
          {
            etiqueta: `${formatear(valor, 6)} ${deEl.value}`,
            valor: formatear(convertido, 6),
            unidad: aEl.value,
            principal: true,
          },
          {
            etiqueta: "Equivalencia inversa",
            valor: formatear((convertido * factorA) / factorDe, 6),
            unidad: deEl.value,
          },
        ],
        "Los factores son los del apéndice del manual. Para decisiones de aceptación, usa siempre la norma y las unidades del proyecto."
      );
    },
  };

  const UNIDADES = {
    longitud: {
      unidades: { mm: 0.001, cm: 0.01, m: 1, in: 0.0254, ft: 0.3048 },
    },
    masa: {
      unidades: { g: 0.001, kg: 1, t: 1000, lb: 0.45359237 },
    },
    volumen: {
      unidades: { L: 0.001, "m³": 1, "ft³": 0.028316846592, "yd³": 0.764554857984, gal: 0.003785411784 },
    },
    esfuerzo: {
      unidades: { kPa: 0.001, MPa: 1, "kg/cm²": 0.0980665, psi: 0.00689475729 },
    },
  };

  function llenarUnidades(card, categoria) {
    const deEl = card.querySelector('[data-campo="de"]');
    const aEl = card.querySelector('[data-campo="a"]');
    if (!deEl || !aEl) return;
    const grupo = UNIDADES[categoria];
    if (!grupo) return;
    const claves = Object.keys(grupo.unidades);

    deEl.innerHTML = "";
    aEl.innerHTML = "";
    claves.forEach((clave) => {
      const opcionDe = document.createElement("option");
      opcionDe.value = clave;
      opcionDe.textContent = clave;
      deEl.append(opcionDe);

      const opcionA = document.createElement("option");
      opcionA.value = clave;
      opcionA.textContent = clave;
      aEl.append(opcionA);
    });
    deEl.value = claves[0];
    aEl.value = claves[1] || claves[0];
  }

  document.querySelectorAll("[data-calc]").forEach((card) => {
    const boton = card.querySelector("[data-calcular]");
    if (!boton) return;

    if (card.dataset.calc === "conversiones") {
      const categoriaEl = card.querySelector('[data-campo="categoria"]');
      if (categoriaEl) {
        llenarUnidades(card, categoriaEl.value);
        categoriaEl.addEventListener("change", () => llenarUnidades(card, categoriaEl.value));
      }
    }

    boton.addEventListener("click", () => {
      const calculo = CALCULOS[card.dataset.calc];
      if (!calculo) return;
      try {
        calculo(card);
      } catch (error) {
        mostrarError(card, error.message || "Revisa los datos e inténtalo de nuevo.");
      }
    });

    card.querySelectorAll("input").forEach((input) => {
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          boton.click();
        }
      });
    });
  });
})();
