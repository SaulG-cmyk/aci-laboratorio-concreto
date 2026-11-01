# Normativa — Contenido de aire por presión

## 1. Alcance de la norma

La **ASTM C231/C231M** determina el contenido de aire del concreto recién mezclado mediante la observación del cambio de volumen del concreto al aplicarle un cambio de presión (Ley de Boyle).

El método está previsto para concretos y morteros con **agregados relativamente densos**, para los cuales el factor de corrección por agregado puede determinarse satisfactoriamente. **No es aplicable** a:

- Concretos con agregado ligero.
- Concretos con escoria de alto horno enfriada al aire.
- Concretos con agregados de alta porosidad.
- Concreto no plástico (tuberías, mampostería).

Para esos casos debe usarse la **ASTM C173** (método volumétrico).

## 2. Tipos de medidor

| Tipo | Principio | Lectura |
| --- | --- | --- |
| **Tipo A** | Se introduce agua hasta una altura predeterminada sobre la muestra y se aplica presión de aire; se observa cuánto baja el nivel de agua | Columna de agua graduada |
| **Tipo B** | Se iguala un volumen conocido de aire a presión conocida con el volumen desconocido de aire de la muestra | Dial del manómetro calibrado en % de aire |

Presiones de trabajo habituales: **50 a 205 kPa (7.5 a 30 psi)**.

## 3. Equipo

| Elemento | Requisito |
| --- | --- |
| Cuenco de medición | Cilíndrico, acero o metal duro, diámetro 0.75–1.25 veces la altura, capacidad ≥6 L |
| Sistema de tapa | Sello hermético; expansión del sistema ≤0.1 % de aire |
| Graduaciones | Rango ≥8 %, legible al 0.1 % |
| Recipiente de calibración | Volumen conocido, igual a un porcentaje del cuenco |
| Varilla | 16 ± 2 mm, longitud ≥100 mm sobre el cuenco y ≤600 mm |
| Mazo | 600 ± 250 g para cuencos ≤14 L; 1000 ± 250 g para mayores |
| Barra de enrasado | Acero, ≥3 × 20 × 300 mm |
| Placa de enrasado | Metal ≥6 mm o vidrio/acrílico ≥13 mm |
| Bomba de mano | Integrada o accesoria |
| Embudo y tubo de rociado | Para agregar agua sin perturbar el concreto |

## 4. Calibración

1. Calibrar el recipiente de calibración determinando la masa de agua que lo llena.
2. Calibrar el volumen del cuenco con agua y una placa de vidrio.
3. Calcular el volumen efectivo del recipiente de calibración como porcentaje del cuenco.
4. Determinar el factor de expansión del sistema.
5. Realizar el ensayo de calibración final:
   - **Tipo A:** determinar la presión de funcionamiento P.
   - **Tipo B:** verificar la exactitud de las graduaciones del dial.
6. Repetir la calibración final **al menos cada 3 meses**.
7. Recalibrar el Tipo A si se cambia de elevación más de **180 m (600 ft)**.

Registrar: factor de expansión, tamaño del recipiente de calibración y lecturas en los puntos de calibración.

## 5. Factor de corrección por agregado (G)

El método de presión excluye el aire dentro de los poros del agregado, pero el agregado absorbe parte del cambio de presión. Por eso se determina G:

1. Calcular la masa de agregado fino y grueso presente en la muestra de concreto:
   - **Fs = (S / B) × Fb**
   - **Cs = (S / B) × Cb**
2. Colocar el agregado combinado en el cuenco lleno hasta un tercio con agua.
3. Agregar el agregado poco a poco, evitando atrapar aire; eliminar la espuma.
4. Golpear los costados y varillar los 25 mm superiores de 8 a 12 veces.
5. Mantener inundado el agregado durante un tiempo equivalente al transcurrido desde el mezclado.
6. Completar el ensayo como para el concreto.
7. **Tipo A:** G = h1 − h2.
   **Tipo B:** G = lectura del dial − volumen de agua removido expresado como % del cuenco.

> G varía con el agregado y solo puede determinarse por ensayo. Se recomienda un control ocasional aunque el agregado sea el mismo.

## 6. Cálculo

- Contenido aparente: **A1 = h1 − h2** (Tipo A) o lectura del dial (Tipo B).
- Contenido real: **As = A1 − G**.

Si la muestra se tamizó por 37.5 mm, el contenido de la mezcla completa se calcula con la fórmula de la sección 9.2 de la norma.

## 7. Precisión

| Condición | 1s | d2s |
| --- | --- | --- |
| Operadores distintos, medidor Tipo A | 0.28 % de aire | 0.8 % de aire |
| Medidor Tipo B | No determinada | No determinada |

La precisión de un solo operador no puede establecerse porque C172 no permite dos ensayos sobre la misma muestra dentro del tiempo disponible.

## 8. Informe

Reportar el contenido de aire al **0.1 %** más cercano después de restar G, salvo que la lectura exceda 8 %, en cuyo caso se reporta la lectura corregida a la media división más cercana. Incluir fecha, hora e identificación.
