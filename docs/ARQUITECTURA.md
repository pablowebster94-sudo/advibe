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
| Render | `lib/photo/render/` | Shaders GLSL, renderizador WebGL2, mapeo de uniformes |
| Agrupación | `lib/photo/grouping/` | Detección de duplicados y ranking de la mejor toma |
| Persistencia | `lib/photo/storage/` | IndexedDB: proyectos, fotos, blobs, grupos, estilos |
| Trabajos | `lib/photo/jobs/` | Cola con concurrencia, pool de workers, tarea de análisis |
| Orquestación | `lib/photo/pipeline.ts`, `export.ts` | Importar, regenerar, exportar ZIP |
| Interfaz | `app/studio/`, `components/studio/` | Páginas y componentes |

Todo lo que no toca APIs del navegador es **puro y con pruebas unitarias**: el
parser TIFF, la estadística, el motor, el XMP y el ZIP se ejecutan en Node.

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
- **TIFF sin previsualización JPEG.** Si un `.tif` no trae una previsualización
  decodificable, se rechaza con un mensaje claro en vez de fingir.
- **Reducción de ruido en la vista previa.** El proxy ya viene procesado y
  reducido; simular ahí la reducción de ruido enseñaría algo que el RAW no va a
  hacer. El valor sí viaja en el XMP y Lightroom lo aplica sobre el sensor.
- **Detección de rostros de grado ML.** Ver `docs/IA-Y-COSTOS.md`.
