# ADvibe CONTROL (Apps Script)

Chat web, pensado para el móvil, con el que Pablo registra el trabajo del día: videos hechos, grabaciones, publicaciones y tareas. La app **escribe** en la hoja CONTROL y en Google Calendar. Los agentes de Claude (`docs/advibe-os/`) **leen** esa misma hoja. Así hay una sola fuente de verdad.

## Despliegue (10 min)

1. Abre la **hoja oficial**: <https://docs.google.com/spreadsheets/d/137EdqtLXOtB0pU1Yhqb9VpigWcyQl4lW0hOCCD_0DNc/edit>. No importes un `.xlsx`: eso crearía otra copia de la hoja.
2. Ve a **Extensiones → Apps Script**.
3. En el editor:
   - Crea `Backend.gs` e `Index.html` y pega el contenido de estos archivos.
   - En ⚙️ Configuración del proyecto, activa "Mostrar el archivo de manifiesto `appsscript.json`" y pega `appsscript.json`. Fija la zona horaria America/Guayaquil y deja la app **solo para ti**.
4. En la hoja, pestaña CONFIGURACION, rellena `EMAIL_ADMIN` con tu correo. Ahora está vacío.
5. En el editor, selecciona `setupSystem` → ▶ Ejecutar → autoriza Sheets, Calendar y Gmail.
6. **Implementar → Nueva implementación → Aplicación web**. Ejecutar como: **Yo**. Quién tiene acceso: **Solo yo**.
7. Abre la URL `/exec` en el móvil y añádela a la pantalla de inicio.

## Qué entiende

| Dices | Hace |
|---|---|
| "Hoy hice 2 videos para Muebles Ideal" | Suma 2 en CLIENTES y añade 2 filas en PRODUCCION |
| "Muebles Ideal ya tiene 5 videos" | Fija el total en 5 y añade filas solo por la diferencia |
| "¿Cuántos videos lleva Paola?" | Solo consulta, no escribe nada |
| "Grabar con Kamauto el martes a las 3 de la tarde" | Crea un evento en Calendar y una fila en GRABACIONES |
| "Publicar Muebles Ideal el jueves a las 19:00" | Crea un evento en Calendar y una fila en PUBLICACIONES |
| "Tarea: llamar a Gualaceo mañana a las 9" | Crea un evento en Calendar y una fila en TAREAS |
| "¿Qué tengo hoy / mañana / esta semana?" | Agenda sacada de la hoja y de Calendar, incluidas las publicaciones recurrentes |

Fechas que entiende: hoy, mañana, pasado mañana, un día de la semana, "5 de octubre" y "5/10". La hora solo se toma si va marcada ("a las 3", "15:30", "4pm"). Si no hay hora, usa las 10:00.

## Correcciones frente a la versión original (probadas en `node`)

| Problema en el original | Efecto | Corrección |
|---|---|---|
| "¿Cuántos videos tiene Muebles Ideal?" se trataba como una orden | **Sobrescribía el contador a 1** | Las preguntas solo consultan |
| Sin cantidad explícita asumía 1, y "to**dos**" se leía como 2 | Registraba cifras inventadas | Si no hay cantidad, la pide. Las palabras se buscan completas |
| Modo "ya tiene N" añadía N filas | PRODUCCION quedaba duplicada | Añade solo la diferencia |
| Cualquier número se tomaba como hora ("3 videos") | Grabaciones a las 03:00 | Solo toma horas marcadas; entiende "de la tarde" |
| Un cliente sin fila en la hoja entraba en recursión infinita | La app se caía | Corregido |
| No existían los alias "Gualaceo" ni "Santa Bárbara" | Las tareas quedaban como "General" | Alias añadidos |
| Con `EMAIL_ADMIN` vacío, los resúmenes lanzaban un error cada día | Fallo diario | Avisa en el log y no envía |
| El resumen de la noche repetía el de hoy | No servía de nada | Ahora envía el de mañana |
| La agenda no mostraba los eventos de Calendar | No aparecían las publicaciones recurrentes | Integra Calendar sin duplicar los eventos que crea la app |
| La agenda de PUBLICACIONES mostraba un espacio en lugar del cliente | Líneas vacías | Mapa de columnas explícito |
| No había bloqueo entre escrituras simultáneas | El contador podía corromperse | `LockService` |
| No había manifiesto | Zona horaria y acceso sin definir | `appsscript.json`: Guayaquil y acceso "Solo yo" |

Gemini no se usa: el análisis lo hacen los agentes de Claude sobre la misma hoja.
