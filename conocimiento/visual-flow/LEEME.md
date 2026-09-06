# AdVibe Visual Flow

Motor de producción visual: convierte un brief informal en un brief
estructurado, de ahí en un prompt técnico de imagen, y termina ensamblando
la tipografía sobre la imagen generada.

## Qué hay aquí

- `blueprint.md` — la especificación para montarlo: esquema JSON, los dos
  prompts de sistema, configuración de los módulos de Make.com, capas de la
  plantilla de Bannerbear y el mapeo de variables. Es lo que se sigue para
  construirlo.
- `demo.html` — demo interactiva de una sola página. Simula el pipeline en
  canvas; no llama a ninguna API.

## Estado

- [hecho] El blueprint está escrito y es autocontenido: se puede montar
  siguiéndolo.
- [dato pendiente] No consta que el escenario de Make.com esté montado ni que
  se haya generado una pieza real con él.
- [dato pendiente] Costo real por pieza, medido en la cuenta de OpenAI y
  Bannerbear, no estimado.

## Advertencia sobre las cifras de la demo

`demo.html` muestra métricas —2.5 min por pieza, $0.18 de costo, 96.4% de
aprobación a primera versión, 1.240 piezas al mes, la caída de revisiones del
28% al 3.6%— que son **de relleno para la demo**. No salen de ninguna campaña
de AdVibe.

`[hipótesis]` en el mejor de los casos, y sin forma de verificarlas hoy
porque el motor todavía no ha producido una pieza real.

**No se muestran a un cliente ni se citan en una propuesta como resultados de
AdVibe.** Es exactamente lo que este sistema existe para no hacer: un número
sin evidencia presentado como hecho. Si la demo se le enseña a alguien, se
enseña como maqueta de flujo y se dice que los números son de ejemplo.

Cuando el motor produzca piezas reales, los números medidos van a
`clientes/<slug>/aprendizajes.md` con su evidencia, y desde ahí se decide si
suben a `conocimiento/aprendizajes.md`.

## Límite con los agentes

El blueprint describe una automatización externa (Make.com + OpenAI +
Bannerbear). No es un agente de este repositorio y ningún agente lo ejecuta.
El `creativo` puede escribir el brief y el concepto que entran al flujo; la
ejecución es de Pablo.
