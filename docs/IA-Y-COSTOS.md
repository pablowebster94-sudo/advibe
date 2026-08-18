# Qué hace la «IA», qué es local y cuánto cuesta

## Resumen en una línea

**Hoy el sistema no llama a ninguna API externa. Cero. El costo por 1.000
fotografías es $0,00.**

Todo el análisis y toda la decisión de edición se ejecutan en el dispositivo.
Lo que sigue explica qué se calcula, por qué es suficiente, y qué costaría
añadir un modelo de visión si en algún momento aporta valor real.

## Qué es exactamente «la IA» aquí

No es un modelo generativo, y llamarlo así sería engañoso. Es un sistema de
medición y decisión: se miden propiedades reales de cada fotografía y se aplican
reglas que dependen de esas mediciones. La diferencia con un preset es que **un
preset produce el mismo número para todas las fotos y esto no**.

El principio que gobierna el motor: cada corrección tiene una **banda de
tolerancia**, no un valor objetivo. Si la medición cae dentro de la banda, la
corrección es exactamente cero. Si cae fuera, se corrige **solo hasta el borde
más cercano**, nunca hasta el centro.

## Procesamiento local (100 %)

| Qué | Cómo | Referencia |
|---|---|---|
| Estructura RAW, EXIF, previsualización | Parser TIFF/IFD propio | — |
| Histograma, percentiles, recorte | Recuento directo sobre el proxy | — |
| Recorte recuperable vs. irrecuperable | Un canal saturado se reconstruye; los tres, no | — |
| Balance de blancos | Mundo gris sobre píxeles no recortados | Buchsbaum (1980) |
| Contraste | Desviación típica de la luminancia | — |
| Neblina | Canal oscuro por parches | He, Sun & Tang (2009) |
| Nitidez / foco | Varianza del laplaciano | Pech-Pacheco et al. (2000) |
| Ruido | Estimador rápido + ISO del EXIF | Immerkær (1996) |
| Piel | Clasificación en YCbCr + comprobación RGB, normalizada por balance | Chai & Ngan (1999), Kovac et al. (2003) |
| Regiones / rostros | Etiquetado de componentes conexas + geometría | — |
| Escena | Evidencia ponderada sobre EXIF + mediciones | — |
| Duplicados | dHash + aHash de 64 bits, distancia de Hamming, proximidad temporal | — |
| Mejor toma | Nitidez, foco del rostro, exposición, encuadre | — |

Costo: **0**. Latencia: ~50 ms por fotografía en un núcleo. En el lote de
verificación (40 archivos, 4 núcleos) el ritmo medido fue **~20 fotografías por
segundo**.

## Detección de rostros: qué es y qué no es

Hay dos backends, y el sistema **dice cuál usó** en cada fotografía:

1. **`native-shape-detection`** — la Shape Detection API del navegador
   (`window.FaceDetector`). Detección real, cero bytes descargados. Hoy está
   tras un flag en Chrome Android y no existe en Safari iOS, así que no puede
   ser el único backend.
2. **`skin-region-heuristic`** — el detector clásico de
   `lib/photo/analysis/skin.ts`. Siempre disponible, funciona sin conexión.

El segundo detecta **regiones de piel con geometría compatible con un rostro**,
no rostros verificados. Es honesto llamarlo así: sirve perfectamente para lo que
el motor necesita (dónde hay piel, cómo de brillante está, hacia dónde deriva su
tono), pero no cuenta caras con fiabilidad en una foto de grupo.

Para cambiarlo: implementa `FaceDetectorBackend` en `lib/photo/analysis/faces.ts`
y regístralo. Nada más cambia. Un modelo tipo BlazeFace añade ~400 KB de pesos y
una dependencia de red en el primer uso; se descartó para el MVP porque el
objetivo es un teléfono de gama media trabajando sin conexión.

## Lo que el sistema NO afirma

Esto es tan importante como lo que sí hace:

- **Ojos abiertos y expresión.** No se miden. La recomendación de mejor toma
  habla de nitidez, foco del rostro, exposición y encuadre, y nada más.
- **Neblina vs. escena de tono alto.** Con estadística global no se distinguen
  de forma fiable. Por eso `Dehaze` exige tres condiciones simultáneas (canal
  oscuro alto, contraste colapsado y escena de exterior) y aun así se aplica una
  cantidad conservadora.
- **Temperatura de color de origen.** El Kelvin que muestra la interfaz es una
  estimación a partir del `LightSource` del EXIF y está etiquetado como tal.
- **Tono de piel.** El brillo de la piel **no** se normaliza. Un tono oscuro
  correctamente expuesto no es un error de exposición y no se «corrige»; solo se
  actúa en extremos inutilizables o cuando la piel está claramente peor iluminada
  que la escena (relación de luz, no brillo absoluto).

## Si algún día se añade un modelo de visión

Precios de la API de Claude, junio 2026 (entrada / salida por millón de tokens):

| Modelo | Entrada | Salida |
|---|---|---|
| Claude Haiku 4.5 | $1,00 | $5,00 |
| Claude Sonnet 5 | $3,00 | $15,00 |
| Claude Opus 5 | $5,00 | $25,00 |

Una imagen cuesta aproximadamente `(ancho × alto) / 750` tokens. Enviando el
proxy de análisis (512 × 341 ≈ **233 tokens**) más un prompt corto (~200
tokens) y recibiendo ~150 tokens de respuesta:

| Modelo | 100 fotografías | 1.000 fotografías |
|---|---|---|
| Haiku 4.5 | ~$0,12 | ~$1,18 |
| Sonnet 5 | ~$0,36 | ~$3,55 |
| Opus 5 | ~$0,59 | ~$5,92 |

Se puede bajar bastante más: el *prompt caching* abarata el prompt de sistema
repetido, y la **Batch API** cuesta la mitad para trabajo no interactivo (una
boda se procesa perfectamente en diferido).

### Dónde aportaría valor de verdad

No en exposición, contraste ni balance: eso ya se mide bien y un modelo de
lenguaje sería más caro, más lento y menos preciso. Sí en lo semántico, que es
justo lo que la estadística no ve:

1. **Momento de la boda** — distinguir «primer baile» de «brindis» de «corte de
   la tarta». Hoy se infiere de hora, ISO y flash, y se equivoca.
2. **Calidad de la expresión** — sonrisa genuina, ojos abiertos, alguien mirando
   fuera de cuadro. Es la pieza que falta en la selección de la mejor toma.
3. **Fotos a descartar** — alguien caminando delante de la cámara, un plato a
   medio comer, el fotógrafo reflejado.

Diseño recomendado si se implementa: **una sola llamada por grupo de duplicados**
(no por fotografía), enviando la miniatura de cada miembro. Eso reduce el costo
en un factor de 4 a 10 en una sesión típica, y es donde el juicio semántico
realmente decide.

## Servicios externos necesarios hoy

Ninguno. Sin claves de API, sin cuentas, sin red. La aplicación funciona con el
avión encendido.
