# Verificación end-to-end

Estas pruebas ejecutan el flujo completo del MVP en **Chromium real** con
**archivos reales**, y comprueban artefactos reales (píxeles del canvas, XMP
descargado, bytes del ZIP) en lugar de limitarse a verificar que un botón
existe.

## Requisitos

- Chromium + Playwright instalados (globalmente o en el repositorio).
- `CHROMIUM_PATH` apuntando al ejecutable de Chromium.
- `PLAYWRIGHT_MODULE` apuntando al módulo de Playwright si está instalado
  globalmente (por ejemplo `/usr/lib/node_modules/playwright/index.mjs`).
- La aplicación compilada y sirviéndose en `http://localhost:3210`.

```bash
npm run build
npx next start -p 3210 &

export CHROMIUM_PATH=/ruta/a/chromium
export PLAYWRIGHT_MODULE=/ruta/a/playwright/index.mjs   # solo si es global

# 1. Genera los archivos de prueba (JPEG reales codificados por Chromium,
#    envueltos en contenedores TIFF/ARW reales con su EXIF).
node --import ./tests/register.mjs tests/e2e/make-fixtures.mjs
node --import ./tests/register.mjs tests/e2e/make-batch.mjs

# 2. Flujo completo: crear proyecto -> importar -> analizar -> generar ajustes
#    -> previsualizar -> modificar a mano -> generar XMP -> descargar ZIP.
node tests/e2e/e2e.mjs

# 3. Procesamiento por lotes: 40 ARW en 10 ráfagas de 4.
node tests/e2e/batch.mjs

# 4. Auditoría: vuelca el análisis completo y las razones de cada decisión.
node tests/e2e/probe.mjs
```

## Sobre los archivos de prueba

Los `.ARW` son **sintéticos**, no salen de una cámara: son contenedores TIFF
construidos con la misma estructura que usa Sony (cabecera `II*\0`, cadena de
IFD, puntero a ExifIFD, SubIFD con `JpegInterchangeFormat`/`Length`) y llevan
dentro un JPEG real codificado por Chromium. Eso es exactamente lo que el
parser tiene que resolver, y permite probar sin meter 25 MB de binario en el
repositorio.

Lo que **no** cubren: la variedad de MakerNotes de cámaras reales. Antes de
producción conviene pasar un lote de `.ARW` de la cámara concreta y revisar en
`probe.mjs` que el EXIF y la previsualización se leen bien.

Los artefactos generados van a `tests/e2e/.artifacts/` y están en `.gitignore`.
