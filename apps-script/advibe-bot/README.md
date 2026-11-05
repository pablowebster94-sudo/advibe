# ADvibe Bot (Telegram)

Tu asistente en Telegram. Le escribes o le mandas un audio como a un empleado, y trabaja sobre la hoja oficial `ADvibe_CONTROL_2026 (1)`.

Por ahora hace tres cosas:

| Le dices | Hace |
|---|---|
| "¿Qué me falta hoy?" · `/hoy` | Te dice qué cobros están vencidos o vencen esta semana y qué tareas tienes hoy y mañana |
| "Ya me pagó Kamauto" · "Muebles Ideal abonó 100" | Prepara el pago y te pregunta **✅ Sí / ❌ No**. Solo escribe en COBROS y PAGOS cuando pulsas Sí |
| "Recuérdame mañana a las 9 llamar a Gualaceo" | Lo apunta en TAREAS y a esa hora te escribe ⏰ con un botón **✅ Hecho** |

Además te escribe solo:
- **Todos los días a las 8:00**, con los cobros vencidos y las tareas del día.
- **A la hora de cada recordatorio.** Lo revisa cada 15 minutos, así que el aviso puede llegar hasta 15 minutos tarde.

**Audios:** los transcribe y te muestra lo que entendió («…») antes de responder, para que veas si se equivocó.

**Cobros:** solo persigue los de **octubre de 2026 en adelante**. Septiembre sigue sin conciliar entre las hojas nº 5 y nº 9 (ver `docs/advibe-os/fuentes-de-verdad.md`). Cuando lo aclares, puedes cambiar la propiedad `COBROS_DESDE`.

## Instalación (unos 20 minutos)

### 1. Crea el bot en Telegram
1. En Telegram, abre **@BotFather** y escribe `/newbot`.
2. Ponle un nombre (por ejemplo "AdVibe Asistente") y un usuario que termine en `bot`.
3. Copia el **token** que te da (algo como `123456:ABC...`).

### 2. Consigue las dos claves
- **Claude** (el cerebro): <https://console.anthropic.com> → API Keys → Create Key. Necesita saldo cargado.
- **Gemini** (solo para pasar los audios a texto): <https://aistudio.google.com/apikey> → Create API key.

### 3. Crea el proyecto
1. Entra en <https://script.google.com> → **Nuevo proyecto**. Llámalo "ADvibe Bot".

   Es un proyecto aparte. No lo pegues dentro del Apps Script de la hoja, que ya tiene la app ADvibe CONTROL.
2. Borra lo que trae `Código.gs` y pega el contenido de `Bot.gs`.
3. ⚙️ **Configuración del proyecto**:
   - Marca "Mostrar el archivo de manifiesto appsscript.json". Vuelve al editor, abre `appsscript.json` y pega el de esta carpeta.
   - En **Propiedades del script**, añade:

| Propiedad | Valor |
|---|---|
| `TELEGRAM_TOKEN` | el token de BotFather |
| `ANTHROPIC_API_KEY` | la clave de Claude |
| `GEMINI_API_KEY` | la clave de Gemini |

### 4. Publícalo
1. **Implementar → Nueva implementación → Aplicación web**.
2. Ejecutar como: **Yo**. Quién tiene acceso: **Cualquier usuario**. Telegram tiene que poder llamarlo. El bot está protegido por una clave secreta en la URL y solo te responde a ti.
3. Copia la URL que termina en `/exec` y guárdala como propiedad `WEBAPP_URL`.

### 5. Conéctalo
1. En el editor, elige la función `conectarTelegram` → ▶ **Ejecutar** → autoriza los permisos (Sheets y conexiones externas).
2. En Telegram, abre tu bot y escribe `/start` **en los 30 minutos siguientes**. El primer chat que lo haga queda como dueño, y el bot no le responde a nadie más.

Listo. Prueba con "¿qué me falta hoy?" o con un audio.

### Si cambias el código
Pega el nuevo `Bot.gs` → **Implementar → Gestionar implementaciones → ✏️ → Versión: Nueva versión → Implementar**. La URL no cambia y no hay que volver a conectar.

## Propiedades opcionales

| Propiedad | Por defecto | Para qué |
|---|---|---|
| `COBROS_DESDE` | `2026-10` | Primer mes desde el que el bot persigue cobros |
| `CLAUDE_MODEL` | `claude-opus-5-5` | Modelo de Claude. El más capaz; ver costos abajo |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Modelo que transcribe. Cámbialo si Google lo retira |
| `SHEET_ID` | la hoja oficial | Solo si algún día cambia la hoja |

## Costos
- **Telegram y Apps Script:** gratis.
- **Gemini** (audios): cabe en el plan gratuito con tu volumen.
- **Claude:** el resumen de la mañana, `/hoy` y los recordatorios **no** usan Claude. Cada mensaje libre sí, y cuesta unos centavos con `claude-opus-5-5`. Con 20 mensajes al día, calcula del orden de $1 diario. Para gastar menos, cambia `CLAUDE_MODEL` a `claude-sonnet-5-5` o `claude-haiku-4-5`, a cambio de algo menos de precisión entendiendo frases enredadas.

Si Claude rechaza una petición, el bot la reintenta en otro modelo (`fallbacks: "default"`), así no te quedas sin respuesta.

## Qué toca en la hoja

| Pestaña | Lee | Escribe |
|---|---|---|
| CLIENTES | ID, nombre, mensualidad, día de pago, estado | — |
| COBROS | cobro del cliente y periodo | crea la fila del mes si no existe; actualiza Total pagado, Saldo y Estado (`PAGADO` / `ABONO`) |
| PAGOS | — | una fila por pago confirmado |
| TAREAS | tareas no completadas ni canceladas | recordatorios nuevos; Estado al pulsar Hecho; `[avisado]` en Notas |
| LOG | — | una fila por pago |

Un cobro está vencido cuando su día de pago ya pasó y tiene saldo. Si un cliente no tiene fila en COBROS para el mes, se toma la mensualidad completa como pendiente.

## Fuera de alcance por ahora
Videos y producción, campañas de Meta, mensajes a clientes. El bot responde que todavía no lo hace. Se irán agregando una por una.

## Pruebas
`npm test` carga `Bot.gs` en Node con una hoja y unas APIs simuladas (`tests/advibe-bot.test.ts`).
