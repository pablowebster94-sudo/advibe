# Contexto de marca — Kamauto / Komauto / KMA

**Estado:** v1 · 12 de septiembre de 2026
**Para:** cualquier agente o persona de AdVibe que vaya a escribir, grabar o pautar para esta cuenta.

> **Cómo leer este archivo.** Está dividido por **procedencia del dato**, no por tema. Lo que está en "Confirmado" se puede usar tal cual. Lo que está en "Sin confirmar" **no se inventa ni se rellena**: se escribe con `[CONFIRMAR: ...]` visible en la pieza. Lo que está en "Supuestos de trabajo" se usó para poder escribir los guiones de septiembre y **no es un dato de marca** — no lo cites como hecho ni lo asciendas a confirmado sin que el cliente lo apruebe.

---

## 1. Confirmado por el cliente

Información entregada directamente por el cliente. Se puede usar sin marcar.

| Dato | Valor |
|---|---|
| **Giro** | Importadora de **repuestos y accesorios automotrices** |
| **Ciudad** | Cuenca, Ecuador |
| **Líneas de marca** | Dos, diferenciadas por tipo de repuesto |
| **Komauto** | Línea de **colisión y carrocería** |
| **KMA** | Línea de **mecánica** |

### Requisito de comunicación vigente

El cliente lo planteó como objetivo del mes de septiembre 2026, y es el eje de la tanda de esa fecha:

> Las piezas deben dejar claro **cuál marca es cuál**.

Es decir: al terminar de ver el contenido, alguien debe saber que Komauto es colisión/carrocería y KMA es mecánica. Trátalo como el eje de la comunicación, no como un detalle de rótulo.

`[CONFIRMAR: si este objetivo sigue vigente después de septiembre 2026, o si a partir de octubre la prioridad cambia.]`

---

## 2. Registrado en el repo de AdVibe

Ficha de portfolio en `lib/cases.ts` (slug `kamauto`). Es el registro **interno de AdVibe sobre el trabajo hecho**, no un brief validado por el cliente.

| Campo | Contenido |
|---|---|
| Cliente | Kamauto |
| Sector | Automotriz |
| Servicios | Fotografía · Video · Contenido |
| Título | "Contenido automotriz con presencia de marca." |
| Resumen | "Producción de contenido visual para comunicar **vehículos y productos** con una estética comercial consistente." |
| Reto | "Destacar productos automotrices en un entorno donde la atención compite con decenas de ofertas similares." |
| Solución | "Dirección visual, fotografía comercial, video corto y piezas adaptadas a los formatos de redes sociales." |

### Dos contradicciones con lo confirmado — sin resolver

1. **Grafía del nombre.** El repo registra la cuenta como **"Kamauto"**. El cliente escribió **"Komauto"** para la línea de colisión.
   `[CONFIRMAR: ¿es Kamauto la casa matriz con dos submarcas, Komauto y KMA? ¿Es "Komauto" la grafía correcta y "Kamauto" una errata de AdVibe? ¿O son dos entidades distintas?]`
   **Mientras no se resuelva:** usar la grafía del cliente (Komauto / KMA) y **no animar, rotular ni imprimir ningún logotipo**. Una errata en el nombre arruina cualquier pieza cuyo eje sea la diferenciación de marcas.

2. **Giro del negocio.** La ficha habla de "vehículos y productos"; el cliente describe una importadora de repuestos y accesorios.
   `[CONFIRMAR: ¿comercializa también vehículos? Si es así, es una tercera línea y hay que decidir si entra en el relato o se deja fuera.]`
   Hasta aclararlo, **no afirmar que Kamauto vende vehículos** en ninguna pieza.

---

## 3. Sin confirmar — marcar siempre con [CONFIRMAR]

Nada de esto consta en archivo ni fue entregado por el cliente. No se inventa.

### Identidad
- `[CONFIRMAR: logotipos en vectorial de Komauto y de KMA, y si existe un logo paraguas de la casa matriz.]`
- `[CONFIRMAR: colores oficiales de cada línea.]` Sin esto no hay código cromático para distinguirlas en pantalla.
- `[CONFIRMAR: tipografías de marca.]`
- `[CONFIRMAR: existencia de un manual de marca.]`

### Voz y vocabulario
- `[CONFIRMAR: tono de voz. No existe manual en archivo.]`
- `[CONFIRMAR: cómo nombra la casa internamente a cada línea — "colisión", "carrocería", "enderezada y pintura", "latonería". La pieza debería usar la misma palabra que usa el cliente por teléfono.]`

### Negocio y audiencia
- `[CONFIRMAR: a quién vende — ¿talleres, mecánicas y almacenes (B2B), dueño final en mostrador (B2C), o ambos? Determina el tratamiento de casi cualquier pieza.]`
- `[CONFIRMAR: diferencial frente a otras importadoras de Cuenca.]`
- `[CONFIRMAR: marcas de repuesto que distribuye, y si se pueden mostrar en cámara.]`
- `[CONFIRMAR: cobertura geográfica — ¿solo Cuenca, o envíos a otras ciudades?]`

### Datos duros (nunca por defecto en una pieza)
- `[CONFIRMAR: precios.]`
- `[CONFIRMAR: stock y catálogo.]`
- `[CONFIRMAR: plazos de entrega.]`
- `[CONFIRMAR: garantías y política de devolución.]`

### Canales y operación
- `[CONFIRMAR: canales de contacto y de venta (WhatsApp, mostrador, web, catálogo). Ninguno está confirmado.]`
- `[CONFIRMAR: cuentas de redes sociales — ¿una por línea o una sola para la casa?]`
- `[CONFIRMAR: dirección del local, horarios y si se puede mostrar la fachada en video.]`
- `[CONFIRMAR: personas autorizadas a salir a cámara.]`

---

## 4. Supuestos de trabajo — NO son datos de marca

Se adoptaron para poder escribir la tanda de septiembre 2026. Están declarados en `parrilla-septiembre-v1.md` y siguen pendientes de aprobación del cliente. **No los cites como hechos.**

| Supuesto | Usado en | Si el cliente lo corrige |
|---|---|---|
| Audiencia mixta con peso en **taller/mecánico profesional** | Guiones 1 y 3 | Si resulta ser solo B2B, esas dos piezas se reescriben, no se parchean |
| Tono **directo, de mostrador, sin adornos**: frases cortas, vocabulario del gremio, cero épica publicitaria | Las 3 piezas | Cambia la locución completa |
| Vocabulario local ecuatoriano: guardachoque, farola, guardafango, rulimán, enderezada y pintura | Las 3 piezas | Se sustituyen términos |
| La bodega está **separada físicamente por línea** (un pasillo cada una) | Guion 2, que depende enteramente de ello | Si está mezclada, la pieza 2 no se puede grabar como está escrita |
| **WhatsApp** como canal donde escribe el cliente | Guion 3, concepto y título | Si no es su canal, el guion 3 cambia de eje |

Los tres últimos son invención creativa de la tanda, no información recibida. El de la bodega y el de WhatsApp son los más delicados porque sostienen una pieza entera cada uno.

---

## 5. Reglas permanentes para esta cuenta

1. **Komauto = lo que se ve por fuera** (colisión, carrocería). **KMA = lo que se oye o se siente por dentro** (mecánica). Es el único par confirmado; mantenerlo consistente entre piezas.
2. **Cero claims inventados.** Precio, stock, garantía, plazo, cobertura y marca distribuida solo si constan arriba como confirmados. Hoy ninguno lo está.
3. **No rotular logotipos** hasta resolver la grafía del nombre.
4. **No afirmar que vende vehículos** hasta resolver la contradicción de giro.
5. Cuando el cliente confirme algo, **subirlo a la sección 1 de este archivo** y quitar el `[CONFIRMAR:]` correspondiente de los guiones que lo arrastren.

---

## 6. Historial de contenido

| Fecha | Entrega | Archivos |
|---|---|---|
| Septiembre 2026 | Tanda de 3 reels sobre la diferenciación Komauto / KMA. Pilares: educativo, detrás de cámaras, personas. | `parrilla-septiembre-v1.md`, `guion-septiembre-educativo-v1.md`, `guion-septiembre-bodega-v1.md`, `guion-septiembre-personas-v1.md` |

**Formato marcado como agotado tras septiembre:** el cenital de mesa. Sirvió una vez como pieza fundacional; repetirlo lo vuelve genérico.

**Ángulos aún sin probar:** testimonial/UGC con un taller cliente (requiere gestión de acceso con antelación), caso de colisión resuelto de punta a punta, parrillas independientes por línea.
