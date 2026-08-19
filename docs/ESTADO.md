# Estado verificado del MVP

Este documento distingue tres cosas: lo que está **verificado ejecutándose**, lo
que está **implementado pero no verificado end-to-end**, y lo que **no está**.

Última verificación: build de producción + Chromium real + archivos reales.

## Verificado ejecutándose

`tests/e2e/e2e.mjs` — 35 comprobaciones, todas pasan. Cada una mira un
artefacto real (bytes, píxeles del canvas, contenido de IndexedDB), no la
existencia de un botón.

| Paso del flujo | Qué se comprobó |
|---|---|
| Crear proyecto | Se persiste y navega al workspace |
| Importar 3 `.ARW` + 1 `.jpg` | 4 registros en IndexedDB, 0 errores |
| Parseo RAW | Formato detectado como `arw`; EXIF real (modelo `ZV-E10`, ISO, objetivo, fecha); dimensiones del sensor 6000×4000 leídas del SubIFD, no del preview |
| Previsualización | Proxy JPEG y miniatura generados y almacenados para las 4 |
| Análisis | Las 4 con análisis completo y ajustes generados |
| Explicación | Cada foto trae entre 9 y 13 razones en lenguaje natural |
| Ajustes diferenciados | 4 combinaciones distintas de 4 fotos |
| «No tocar lo que está bien» | La foto correctamente expuesta recibe `exposure = 0` |
| Recorte irrecuperable | 42 % de la imagen sin información → ratio recuperable 0, y el motor lo dice |
| Ruido por ISO | ISO 6400 → NR 34; ISO 800 → NR 4 |
| Huella perceptual | El `.ARW` y el `.jpg` del mismo contenido dan el mismo dHash |
| Render WebGL2 | Canvas 94 % no vacío; antes ≠ después medido en luminancia |
| Ajuste manual | `+1.25 EV` se guarda como capa sobre el de la IA y la luminancia del canvas sube de 120,7 a 177,2 |
| XMP | Descargado como `DSC08481.xmp`; contiene `xpacket`, namespace `crs`, `crs:Exposure2012="+1.25"` (el valor manual, no el de la IA), `WhiteBalance="As Shot"`, `IncrementalTemperature`, `RawFileName` y la curva `ToneCurvePV2012` |
| ZIP | Firma y directorio central válidos; contiene los `.xmp` y los `.jpg` revelados |
| Consola | 0 errores en el navegador |

`tests/e2e/batch.mjs` — 13 comprobaciones sobre **40 `.ARW` en 10 ráfagas de 4**:

| Qué | Resultado |
|---|---|
| Importación completa | 40/40 editadas, 0 errores, **2,3 s** (~17/s, 4 núcleos) |
| Panel de progreso | Cifras medidas reales: 40 procesadas, 20,86/s, 1,4 MB leídos |
| Agrupación de duplicados | 10 grupos de 4 — exactamente las ráfagas |
| Recomendación | Los 10 grupos con puntuación y explicación por métricas |
| Almacenamiento | 34 KB por fotografía |
| Persistencia | Cerrar y reabrir el proyecto conserva las 40 |
| Exportación en lote | 40 sidecars en el ZIP, 0,1 s |

`tests/e2e/render-parity.mjs` — 21 comprobaciones en navegador real. Los dos
motores de revelado producen la misma imagen (0,22/255 de diferencia en color
medio, 5/255 por zonas), ninguno la invierte, y los **14 controles** —exposición,
contraste, altas luces, sombras, blancos, negros, temperatura, matiz, saturación,
intensidad, claridad, textura, neblina y viñeta— cambian visiblemente el preview
en el camino Canvas 2D.

`tests/e2e/workflow.mjs` — 33 comprobaciones sobre seis formatos reales
(JPG, PNG sin metadatos, JPEG de 15 MP, TIFF sin comprimir, TIFF LZW y ARW):
todos se detectan y analizan; el TIFF se decodifica de verdad y el LZW da el
mismo resultado que el plano; una imagen sin EXIF se analiza igual y su panel
muestra «—» en los 12 campos que no trae; copiar, sincronizar sobre una
selección, restaurar original, seleccionar y descartar funcionan y persisten;
tras recargar la página siguen el proyecto, las seis fotografías, el ajuste
manual y los estados de selección; el XMP descargado no es JSON renombrado y
cada parámetro corresponde al ajuste guardado; y **cero peticiones a servidores
externos** durante todo el recorrido.

`tests/e2e/mobile.mjs` — 13 comprobaciones en viewport de teléfono (360×800,
dpr 3, entrada táctil, user-agent de Galaxy A16). Todas pasan: sin scroll
horizontal en ninguna pantalla, rejilla de 2 columnas, canvas de revelado con
altura usable, antes/después funcional, ajuste de un control con el dedo,
descarga del `.xmp` desde el móvil y ningún objetivo táctil por debajo de 44 px.

Esa prueba destapó tres defectos de usabilidad táctil que la verificación de
escritorio no podía ver: los sliders medían 20 px de alto (en un editor de fotos
son *la* interacción principal), los enlaces de navegación 36 px y los botones
de estrategia 27 px. Corregidos.

`npm test` — 92 pruebas unitarias sobre la lógica pura (parser TIFF, EXIF,
estadística, exposición, piel, escena, hashes, motor, estilo, XMP, curva, ZIP,
cola).

`npm run lint` — 0 errores, 0 avisos. `npm run build` — correcto.

## Defectos encontrados durante la verificación y corregidos

Los datos y los navegadores reales destaparon problemas que las pruebas
sintéticas no veían. Se anotan porque son justo el tipo de fallo que hay que
evitar.

**Del motor**

1. **`blacks` en −35 en las tres fotografías** — un valor fijo con apariencia de
   decisión. Sustituido por banda de tolerancia: ahora da −4 / −22 / −14 según
   el percentil medido.
2. **`contrast` saturado en −40** — no descontaba el aplanado que ya provocan la
   recuperación de luces y sombras. Ahora mide el contraste efectivo: −10 / +9 / −7.
3. **`dehaze` aplicado a todo** — ahora exige tres señales simultáneas y se
   retira en interiores.
4. **Contraluz no detectado** (confianza 0,009 en un contraluz evidente).
   Añadida la relación de luz sujeto/escena, que además evita confundir un tono
   de piel oscuro correctamente expuesto con subexposición.

**Del revelado**

5. **El preview WebGL2 mostraba la foto boca abajo.** Llevaba así desde el
   principio y ninguna prueba lo veía, porque todas comparaban un backend
   consigo mismo. Lo destapó la comparación entre WebGL2 y Canvas 2D: color
   medio idéntico, distribución por zonas completamente distinta, que es la
   firma exacta de un volteo vertical.

**De la lectura de archivos**

6. **Un TIFF LZW se rompía** porque el escáner ciego de bytes encontraba una
   secuencia `FF D8` por azar dentro de los datos comprimidos y la tomaba por
   una previsualización JPEG. Ahora se intenta primero la decodificación
   estructurada y el escaneo queda como último recurso, y además exige `FF D8 FF`,
   que es como empieza todo JPEG real.

**De la interfaz**

7. **Las miniaturas no cargaban** porque el `IntersectionObserver` estaba en un
   ref callback inline, que React reconstruye en cada render.
8. **Los sliders medían 20 px de alto** — en un editor de fotos, arrastrar un
   slider es *la* interacción. Ahora 44 px en pantallas táctiles. Igual los
   enlaces de navegación (36 px) y los botones de estrategia (27 px).
9. **El selector de archivos ocultaba los `.ARW` en Android**, porque `.ARW` no
   tiene tipo MIME registrado y *My Files* de Samsung ignora las extensiones.
10. **Descartar no desmarcaba la selección** desde la vista de revelado, aunque
    sí desde la rejilla: dos caminos con reglas distintas. La exclusión mutua
    vive ahora en un solo sitio.

## Implementado, no verificado end-to-end

- **«Aprender mi estilo»** — el aprendizaje y la aplicación tienen pruebas
  unitarias (incluida la comprobación de que un criterio disperso casi no se
  aplica), pero el flujo de la interfaz con pares RAW + `.xmp` reales no se ha
  ejecutado en navegador.
- **Copiar / sincronizar ajustes entre fotos** — implementado y persistido, con
  prueba unitaria del modelo, sin recorrido end-to-end.
- **Perfiles de estilo por escena** — la estructura existe y se rellena; hacen
  falta sesiones reales para saber si aporta sobre el sesgo global.
- **Recorte y enderezado** — el modelo, el XMP y la lectura están completos; no
  hay interfaz para dibujar un recorte.

## No implementado

- Revelado RAW real (demosaicing). Los JPG salen de la previsualización
  embebida; la ruta de calidad total es el `.xmp` en Lightroom.
- Autenticación y multiusuario. Ver `docs/ARQUITECTURA.md` — es una consecuencia
  de que no haya servidor, no un olvido.
- Máscaras locales, degradados, corrección de perspectiva.
- Detección de rostros basada en modelo. Ver `docs/IA-Y-COSTOS.md`.

## Lo que falta comprobar antes de producción

1. **Archivos `.ARW` de la cámara real.** Los de prueba son contenedores TIFF
   sintéticos con la estructura correcta y un JPEG real dentro, pero no cubren la
   variedad de MakerNotes de cámaras reales. Pasa un lote por
   `tests/e2e/probe.mjs` y revisa que el EXIF y la previsualización se lean bien.
2. **Abrir un `.xmp` en Lightroom Classic** y confirmar que los valores caen
   donde deben.
3. **Un lote grande en el teléfono real** (Samsung A16). El ritmo medido aquí es
   sobre archivos sintéticos pequeños en un contenedor de 4 núcleos; con `.ARW`
   de 25 MB el cuello de botella pasa a ser la lectura del archivo.
