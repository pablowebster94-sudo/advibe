# AdVibe Agencia — Instrucciones del proyecto

Este archivo describe el sistema operativo de marketing de AdVibe Agencia.
Director: Pablo Webster. Los agentes ejecutan, Pablo decide.

Convive en el mismo repositorio con el código del sitio (`app/`, `components/`,
`lib/`) y con `ventads-ai/`. Las reglas de código viven en `AGENTS.md`; estas
son las de la operación de la agencia. Cuando se hable de `ESTADO.md` aquí se
habla del de la raíz, no de `docs/ESTADO.md`, que es del proyecto web.

Los agentes son transversales: sirven para cualquier cliente. Lo que cambia
es el archivo de contexto que leen, nunca el agente. Latin Eagle es el primer
cliente piloto, no el proyecto.

## Estructura

```
conocimiento/          Permanente y transversal. Cambia rara vez.
  advibe.md            Qué es AdVibe, mercados, capacidad, estándar de trabajo
  servicios-precios.md Qué vende y a cuánto
  meta-ads.md          Restricciones y comportamiento de plataforma
  aprendizajes.md      Lo que se generalizó de varios clientes
  visual-flow/         Blueprint del motor de producción visual y su demo

clientes/
  PLANTILLA-ficha.md   Estructura en blanco de una ficha. La usa /cliente-nuevo
  <slug>/
    ficha.md           Contexto estable del negocio
    estado.md          Qué está activo, pendiente y cerrado
    decisiones.md      Decisiones aprobadas por Pablo
    historico.md       Campañas, resultados, datos de rendimiento
    aprendizajes.md    Conclusiones con evidencia, de este cliente

prospeccion/<nicho>.md Memoria de lo que se probó en cada nicho
salidas/               Entregables. Aquí escriben los agentes.
ESTADO.md              Índice general
```

## Convención de información — obligatoria

Todo lo que un agente escriba en un archivo va etiquetado:

- `[hecho]` — verificado o dicho por el cliente
- `[hipótesis]` — plausible, sin verificar. Debe decir cómo se verificaría.
- `[recomendación]` — lo que el agente propone hacer
- `[dato pendiente]` — falta y hay que preguntarlo

**Ningún agente convierte una hipótesis en hecho.** Si falta información, se
marca `[dato pendiente]` y se pide. No se rellena con supuestos del sector, con
lo que es típico del rubro, ni con promedios de mercado.

## Decisiones

Solo Pablo escribe en `decisiones.md`. Los agentes proponen y recomiendan;
ninguno registra una decisión como aprobada. Un agente que anota sus propias
propuestas como decisiones convierte el archivo en basura en dos semanas.

## Aprendizajes

Un aprendizaje nace en `clientes/<slug>/aprendizajes.md` con su evidencia:
afirmación, número que la sostiene, dónde se observó. Sin evidencia adjunta no
es un aprendizaje.

Sube a `conocimiento/aprendizajes.md` solo cuando se observó en más de un
cliente, o cuando hay razón clara para considerarlo transversal y esa razón
queda escrita. Una generalización de un solo caso no entra: contamina las
campañas de todos los demás.

La promoción la escribe Pablo. El agente que cree que un aprendizaje debe
subir lo propone con su argumento y lo deja en su entrega; no lo mueve él.
Misma lógica que `decisiones.md`: `conocimiento/` es el archivo que leen todos
los clientes, y un error ahí se propaga a todos.

## Disciplina de la ficha

`ficha.md` guarda lo que no cambia solo. Si pasa de 150 líneas, es señal de
revisar si algo que se mueve se coló adentro: se traslada a `historico.md` o
`estado.md`. Es una señal de revisión, no una orden de recortar. Nunca se
borra información útil para cumplir el límite.

## Orden de lectura por agente

| Agente | Lee, en este orden |
|---|---|
| `estratega` | `conocimiento/advibe.md` → `ficha.md` → `decisiones.md` → `aprendizajes.md` → `historico.md` |
| `creativo` | `conocimiento/advibe.md` → `ficha.md` → última estrategia en `salidas/<cliente>/` |
| `paid-media` | `conocimiento/advibe.md` → `conocimiento/meta-ads.md` → `ficha.md` → `historico.md` → `aprendizajes.md` |
| `sales` | `conocimiento/advibe.md` → `conocimiento/servicios-precios.md` → `prospeccion/<nicho>.md` |

`decisiones.md` se lee antes de proponer: evita reproponer lo ya descartado.

## Permisos de escritura

Hay dos cosas distintas y la tabla solo aplica a una:

- **Subagente** (`.claude/agents/`): trabaja en su propio contexto, Pablo no ve
  lo que hace mientras lo hace. Le aplica la tabla.
- **Comando** (`.claude/commands/`): corre en el hilo principal, delante de
  Pablo, paso a paso. Puede tocar archivos que un subagente no toca —
  `/cliente-nuevo` crea la `ficha.md`, y varios comandos actualizan
  `ESTADO.md` — porque Pablo lo está viendo y puede detenerlo.

Tabla de subagentes. Convención operativa, no barrera técnica: el campo `tools`
restringe tipos de herramienta, no rutas, así que un agente puede saltársela.
Está escrita para que no lo haga, y para que se note cuando ocurra.

| Agente | Escribe en |
|---|---|
| `estratega` | `salidas/<cliente>/` |
| `creativo` | `salidas/<cliente>/` |
| `paid-media` | `salidas/<cliente>/`, `clientes/<slug>/historico.md`, `clientes/<slug>/aprendizajes.md` |
| `sales` | `salidas/prospeccion/`, `prospeccion/<nicho>.md` |

Ningún subagente escribe en `ficha.md`, en `ESTADO.md` ni en
`conocimiento/`: los mantiene Pablo, y más adelante el agente `cuentas`. En
`decisiones.md` no escribe nadie más que Pablo, ni agente ni comando, nunca.

## Cómo trabajan los agentes

Pablo → agente → archivos → output → revisión de Pablo.

Los agentes no conversan entre sí ni simulan hacerlo. Cada uno trabaja en su
propio contexto sobre la misma fuente de verdad y deja un artefacto en disco.
El siguiente lee ese archivo, no un resumen. El traspaso va por disco porque
los subagentes no comparten memoria.

## Segunda regla

Todos los agentes tienen permiso y obligación de decir que algo no va a
funcionar. Si el presupuesto no alcanza, si la oferta es débil, si no hay
datos suficientes para concluir: se dice primero, antes de entregar el trabajo.

## Flujos

Campaña: ficha → estratega → creativo → campaña real → paid-media → aprendizajes
Prospección: nicho → sales → lista calificada → mensajes → respuestas → nicho

## Agente pendiente

`cuentas` (Fase 6): mantendrá `ficha.md` y `estado.md`, detectará información
faltante y consolidará aprendizajes. La estructura de archivos ya está lista
para él. No existe todavía.
