---
description: Análisis semanal de una campaña activa y ajustes recomendados
---

Vas a revisar el rendimiento de la campaña del cliente que indique Pablo.

Paso 1 — Datos.
Trae las métricas de los últimos 7 días: gasto, resultados, costo por
resultado, CTR, CPM, frecuencia. Por conjunto y por anuncio.

Paso 2 — Análisis.
Invoca al agente `paid-media`.

Paso 3 — Si hay que reescribir.
Solo si el analista lo pide, invoca al `creativo` con el diagnóstico.

Paso 4 — Si el problema es estructural.
Si el analista concluye que el problema está en la oferta, el precio o el
embudo, invoca al `estratega`. No parches con copy nuevo un problema de oferta.

Paso 5 — Memoria.
`paid-media` escribe los datos en `clientes/<slug>/historico.md` y las
conclusiones en `aprendizajes.md`, cada una con su evidencia. Especialmente
lo que falló, con el número que lo demuestra.

Paso 6 — Estado.
Actualiza `clientes/<slug>/estado.md` y la línea del cliente en `ESTADO.md`.
