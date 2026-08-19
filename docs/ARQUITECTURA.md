# Arquitectura — AdVibe AI Photo Editor

## La decisión que define todo lo demás

100 archivos `.ARW` de una Sony son ~2,5 GB. Subir eso desde un teléfono, por
datos móviles, no es un producto: es una factura y una espera.

Pero **no hace falta subirlos**. Un `.ARW` es un contenedor TIFF que ya lleva
dentro una previsualización JPEG revelada por la cámara y todo el EXIF. Para
decidir los ajustes y escribir el `.xmp` no se necesita ni un solo píxel del
sensor: se necesita saber *cómo está* la fotografía, y eso está en la
previsualización.

Así que la aplicación:

1. Abre el `.ARW` y lee **solo los bytes que necesita** (`Blob.slice()` es
   perezoso: los 25 MB nunca entran en memoria).
2. Recorre la estructura TIFF, saca el EXIF y localiza la previsualización.
3. Analiza esa previsualización y genera los ajustes.
4. Escribe un `.xmp` al lado del RAW.

El archivo original se lee una vez y nunca se modifica, ni se copia, ni se sube.

### El presupuesto de memoria

La previsualización embebida de una ZV-E10 es de 6000×4000: comprimida ocupa
poco, pero **descomprimida son ~96 MB**. Ahí es donde se gasta la memoria de la
aplicación, no en los 25 MB del archivo. Por eso:

- Se decodifica **una vez por fotografía**, no una vez por salida. De ese único
  bitmap salen el proxy, la miniatura y el buffer de análisis.
- Se le pide al decodificador el tamaño final (`resizeWidth`/`resizeHeight` en
  `createImageBitmap`), así que nunca llega a existir el bitmap de 96 MB: el
  pico queda en ~7 MB.
- El bitmap se cierra (`close()`) en cuanto salen los píxeles, sin esperar al
  recolector.
- La cola limita cuántas fotografías se procesan a la vez, de modo que el pico
  es el de unas pocas y no el del lote entero.

Medido en `tests/e2e/memoria.mjs`: importar tres `.ARW` (uno de 25 MB con
previsualización de 24 MP) mueve el montón de JS de 7 MB a 8 MB.

```
  DSC08487.ARW  (25 MB, en el dispositivo, intacto)
       │
       │  se leen ~1,5 MB: cabecera TIFF + IFDs + EXIF + preview JPEG
       ▼
  ┌─────────────────────────────────────────────────────────┐
  │  Worker de análisis                                      │
  │  preview → proxy 512 px → histograma, clipping, piel,    │
  │  escena, nitidez, ruido, huellas perceptuales            │
  └─────────────────────────────────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────────────────────────────────┐
  │  Motor de edición                                        │
  │  medición + estrategia de escena → ajustes + explicación │
  └─────────────────────────────────────────────────────────┘
       │
       ├──► IndexedDB: miniatura (25 KB) + proxy (300 KB) + JSON
       ├──► WebGL2: antes/después y exportación JPG
       └──► DSC08487.xmp  →  Lightroom Classic revela el RAW completo
```

## Capas

| Capa | Ubicación | Responsabilidad |
|---|---|---|
| Lectura RAW | `lib/photo/raw/` | Fuentes de bytes perezosas, parser TIFF/IFD, EXIF, extracción de previsualización, decodificación a proxy |
| Análisis | `lib/photo/analysis/` | Estadística tonal y de color, nitidez, ruido, piel, rostros, escena, exposición, huellas perceptuales |
| Edición | `lib/photo/editing/` | Modelo de ajustes, estrategias por escena, motor, guardián de piel, perfiles de estilo |
| XMP | `lib/photo/xmp/` | Mapeo al esquema `crs` de Camera Raw, escritura y lectura de sidecars |
| Render | `lib/photo/render/` | Matemática compartida del revelado, renderizador WebGL2, renderizador Canvas 2D y la fábrica que elige |
| Agrupación | `lib/photo/grouping/` | Detección de duplicados y ranking de la mejor toma |
| Persistencia | `lib/photo/storage/` | IndexedDB: proyectos, fotos, blobs, grupos, estilos |
| Trabajos | `lib/photo/jobs/` | Cola con concurrencia, pool de workers, tarea de análisis |
| Orquestación | `lib/photo/pipeline.ts`, `export.ts` | Importar, regenerar, exportar ZIP |
| Interfaz | `app/studio/`, `components/studio/` | Páginas y componentes |

Todo lo que no toca APIs del navegador es **puro y con pruebas unitarias**: el
parser TIFF, la estadística, el motor, el XMP y el ZIP se ejecutan en Node.

## Dos motores de revelado, una sola matemática

El preview se revela por GPU cuando el dispositivo da un contexto WebGL2, y por
CPU con Canvas 2D cuando no. Eso segundo no es un caso raro: un teléfono de
gama media puede negar un contexto GL simplemente por falta de memoria, y el
producto entero existe para funcionar en el teléfono que ya tienes.

Los dos aplican **todos** los ajustes, no un subconjunto, porque la matemática
vive una sola vez en `render/pipeline.ts` y la comparten el shader y el bucle de
píxeles. `tests/e2e/render-parity.mjs` los enfrenta en un navegador real y exige
que produzcan la misma imagen: fue precisamente esa comparación la que destapó
que el camino WebGL2 llevaba tiempo mostrando la foto **boca abajo**, algo que
ninguna prueba anterior podía ver porque todas comparaban un backend consigo
mismo.

Puedes forzar cualquiera de los dos con `?render=canvas2d` o `?render=webgl2`
en la URL. No es un truco de pruebas: es la única forma de revisar el camino de
CPU en un teléfono que sí tiene WebGL2.

El Canvas 2D revela al tamaño que se muestra, no a la resolución del proxy, y
salta el paso de color entero cuando ningún control de color está tocado.

## Local primero, y por qué eso también resuelve la privacidad

No hay servidor. Las fotografías no salen del dispositivo, así que no hay nada
que proteger en tránsito ni en reposo en la nube, ni cuentas que puedan
filtrarse, ni almacenamiento indefinido: borrar el proyecto borra los datos.

Eso también significa que **no hay autenticación**, porque no hay nada
multiusuario que autenticar. Es una decisión, no un olvido. Si en el futuro se
añade sincronización en la nube, entonces sí harán falta cuentas, autorización
por proyecto, almacenamiento privado y URLs temporales; la arquitectura ya está
separada para ello (ver «Puertos» abajo), pero nada de eso está implementado
hoy y la interfaz no lo insinúa.

### Presupuesto de almacenamiento

Por fotografía se guarda: miniatura (~25 KB) + proxy (~300 KB a 1600 px) + JSON
del análisis (~4 KB). Una boda de 800 fotos ocupa unos **260 MB**. El tamaño del
proxy es configurable por proyecto (1200 / 1600 / 2560 px) y determina también
la resolución máxima del JPG exportado. Los `.xmp` no dependen del proxy:
Lightroom siempre revela el RAW completo.

La aplicación pide `navigator.storage.persist()` al importar para que el
navegador no desaloje un proyecto a medio revisar.

## Procesamiento por lotes

`lib/photo/jobs/queue.ts` es una cola con límite de concurrencia (por defecto
`hardwareConcurrency - 1`, máximo 4), progreso, velocidad en ventana móvil, ETA,
pausa y cancelación. `workerPool.ts` reparte el trabajo entre Web Workers de
módulo; si el navegador no permite crearlos, el mismo código corre en el hilo
principal y la interfaz **lo dice** en vez de disimularlo.

Cada fotografía se persiste en cuanto termina, no al final del lote: cerrar la
pestaña a mitad de importación solo pierde las que estaban en vuelo.

## Puertos preparados para un backend

Estas fronteras existen para poder mover trabajo a un servidor sin reescribir
nada. Ninguna está implementada contra un servidor hoy.

| Puerto | Interfaz actual | Qué añadiría un backend |
|---|---|---|
| Análisis | `AnalysisPool.analyze()` | Cola de servidor para revelado RAW real (`libraw`/`dcraw`) cuando el archivo no traiga previsualización |
| Almacenamiento | `lib/photo/storage/db.ts` | Sincronización entre dispositivos, respaldo, almacenamiento privado con URLs firmadas |
| Detección de rostros | `FaceDetectorBackend` | Modelo real (BlazeFace/MediaPipe) en lugar de la heurística de regiones de piel |
| Estilo | `learnStyleProfile()` | Entrenamiento sobre el historial completo del fotógrafo, no solo los ejemplos subidos |
| Exportación | `exportZip()` | Revelado a resolución completa desde el RAW, imposible en el navegador |

## Lo que hoy NO se puede hacer en el navegador

Dicho sin rodeos, porque condiciona qué esperar del producto:

- **Revelar el RAW de verdad.** No hay demosaicing ni interpretación del sensor.
  Los JPG exportados salen de la previsualización embebida. La ruta de calidad
  total es el `.xmp` abierto en Lightroom.
- **Algunos TIFF.** `raw/tiffImage.ts` decodifica los que salen de Photoshop,
  Lightroom y los escáneres: sin comprimir, LZW, PackBits y Deflate; 8 y 16
  bits; gris, RGB y paleta; en bandas. Lo que queda fuera se nombra en vez de
  fallar de forma opaca: mosaicos (tiles), disposición planar, CMYK/YCbCr y
  muestras en coma flotante.
- **Reducción de ruido en la vista previa.** El proxy ya viene procesado y
  reducido; simular ahí la reducción de ruido enseñaría algo que el RAW no va a
  hacer. El valor sí viaja en el XMP y Lightroom lo aplica sobre el sensor.
- **Detección de rostros de grado ML.** Ver `docs/IA-Y-COSTOS.md`.
- **Los píxeles del sensor de un `.ARW`.** Sony los guarda en una compresión
  propia (TIFF 7) que ningún navegador decodifica. Mientras el archivo lleve su
  previsualización embebida —lo normal en una ZV-E10— eso no se nota. Cuando no
  la lleva, la fotografía **no se descarta**: pasa al estado `unreadable`,
  conserva y muestra todo su EXIF, dice qué no se pudo obtener y por qué, y
  queda fuera de la exportación diciéndolo. Sin píxeles no hay análisis,
  previsualización ni JPG, y la aplicación lo dice en lugar de rellenarlo.
