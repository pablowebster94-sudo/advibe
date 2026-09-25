# Generación de XMP para Lightroom Classic

## Qué se escribe

Un sidecar `DSC08487.xmp` junto a `DSC08487.ARW`, con la misma estructura que
escribe Lightroom Classic: envoltorio `xpacket`, un `rdf:Description` con las
propiedades `crs:` como atributos, y forma de elemento solo donde el esquema
exige un contenedor (las curvas de tonos).

**El RAW original no se toca en ningún momento.**

## De dónde salen los nombres de las propiedades

Del `crs` tag table de ExifTool (`lib/Image/ExifTool/XMP.pm`), que es el registro
público más completo de las propiedades posteriores a 2012.

Esto importa: el esquema publicado por Adobe en
`developer.adobe.com/xmp/docs/XMPNamespaces/crs` se quedó en los parámetros del
proceso de 2003 y **no lista** `Exposure2012`, `Texture`, `Dehaze` ni la familia
`ColorGrade*`. Escribir contra esa documentación produciría un sidecar que
Lightroom ignora en su mayor parte.

- `crs:Version = 15.4`
- `crs:ProcessVersion = 11.0` — el proceso moderno que escribe Lightroom
  Classic 9+, y el primero que soporta todo el conjunto que emitimos.
- `crs:HasSettings = True`

Se escribe el conjunto completo de parámetros, no solo lo que cambió. Es lo que
hace Lightroom: un sidecar describe el estado completo de revelado, y omitir un
control deja el valor que ya tuviera el catálogo.

## La única limitación real: el balance de blancos

Este es el punto donde no se puede ser exacto, y conviene entender por qué.

**Para un RAW**, `crs:Temperature` es un valor **absoluto en Kelvin**
(2000–50000) y solo se aplica si `crs:WhiteBalance="Custom"`. Convertir nuestro
control relativo en un Kelvin absoluto exige los multiplicadores de balance de
la cámara **y** su matriz de color. Sony no publica un valor en Kelvin en el
EXIF estándar, y esta aplicación no incluye matrices de color. Cualquier cifra
absoluta que escribiéramos sería una invención que además **sobrescribiría en
silencio lo que midió la cámara**.

Solución adoptada: se mantiene `crs:WhiteBalance="As Shot"` y se escriben
`crs:IncrementalTemperature` y `crs:IncrementalTint`, que Camera Raw aplica como
desplazamientos *sobre* el valor de la cámara. El resultado es exactamente lo
que se previsualizó, y el balance original queda intacto debajo.

**Para archivos no RAW** (JPEG/PNG/TIFF) el control de temperatura de Camera Raw
ya es relativo y va de −100 a +100, así que ahí sí se escriben
`crs:Temperature`/`crs:Tint` directamente con `crs:WhiteBalance="Custom"`.

Al **leer** un sidecar ajeno (para «Aprender mi estilo»), un
`crs:Temperature` en Kelvin se reporta como no soportado en lugar de meterlo a
la fuerza en el control relativo.

## Parámetros que se escriben

| Grupo | Propiedades |
|---|---|
| Tono | `Exposure2012`, `Contrast2012`, `Highlights2012`, `Shadows2012`, `Whites2012`, `Blacks2012` |
| Presencia | `Clarity2012`, `Texture`, `Dehaze` |
| Color | `Vibrance`, `Saturation`, + balance según la sección anterior |
| Detalle | `Sharpness`, `SharpenRadius`, `SharpenDetail`, `SharpenEdgeMasking`, `LuminanceSmoothing`, `LuminanceNoiseReductionDetail`, `ColorNoiseReduction`, `ColorNoiseReductionDetail` |
| Óptica | `LensProfileEnable`, `LensProfileSetup`, `AutoLateralCA`, `DefringePurpleAmount`, `DefringeGreenAmount` |
| Viñeta | `PostCropVignetteAmount`, `Midpoint`, `Feather`, `Roundness`, `Style` |
| HSL | `HueAdjustment*`, `SaturationAdjustment*`, `LuminanceAdjustment*` (8 bandas) |
| Color grading | `SplitToningShadow*`, `SplitToningHighlight*`, `SplitToningBalance`, `ColorGradeMidtone*`, `ColorGrade*Lum`, `ColorGradeGlobal*`, `ColorGradeBlending` |
| Recorte | `HasCrop`, `CropTop/Left/Bottom/Right`, `CropAngle`, `CropConstrainToWarp` |
| Curva | `ToneCurveName2012`, `ToneCurvePV2012` (`rdf:Seq` de `"x, y"`) |

`LensProfileSetup="LensDefaults"` deja que Lightroom elija el perfil que
corresponde al objetivo del EXIF, en lugar de nombrar un archivo de perfil cuya
existencia no podemos verificar.

Nota sobre color grading: Adobe reutiliza el almacenamiento antiguo de
`SplitToning` para las ruedas de sombras y altas luces, y añade propiedades
propias para medios tonos y global. Por eso se escriben **ambas** familias.

## Parámetros del modelo que Lightroom NO recibe

Ninguno: todo lo que la aplicación deja modificar viaja al XMP. Lo que sí queda
fuera son parámetros de Lightroom que esta aplicación no genera —máscaras
locales, degradados, corrección de tinta de sombras, grano, Upright—. Al leer un
sidecar que los traiga, se listan como no soportados en vez de descartarlos en
silencio.

## Cómo usarlo

1. Copia cada `.xmp` junto a su RAW, misma carpeta y mismo nombre base.
2. Importa la carpeta en Lightroom Classic. Si los RAW ya estaban importados,
   selecciónalos y usa **Metadatos → Leer metadatos del archivo**.
3. Los ajustes aparecen en el módulo Revelar y se siguen editando con
   normalidad.

## Verificación

`tests/xmp.test.ts` cubre el mapeo, la escritura, el ida y vuelta completo
(escribir → leer → comparar cada parámetro), el análisis de un sidecar real de
Lightroom Classic y el rechazo del Kelvin absoluto.

`tests/e2e/e2e.mjs` descarga el `.xmp` desde la interfaz en un navegador real y
comprueba sobre los bytes descargados que lleva el `xpacket`, el namespace
`crs`, el valor editado a mano, el balance incremental, `As Shot`, la referencia
al RAW y la curva de tonos.

Lo que **no** se ha podido verificar en este entorno: abrir el sidecar en una
instalación real de Lightroom Classic. Antes de usarlo en producción, pasa un
archivo por Lightroom y confirma que los valores aparecen donde deben.
