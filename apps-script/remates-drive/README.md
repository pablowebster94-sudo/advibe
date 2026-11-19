# REMATES desde una carpeta de Drive (Apps Script)

Publica como JSON el contenido de una carpeta de Google Drive, para que la página de remates
(`app/<cliente>/remates`) la lea. **El cliente solo sube fotos a la carpeta: el mueble aparece
solo.** El nombre y los precios salen del nombre del archivo.

## Cómo se nombran las fotos

```
Sofá Bruno - 720 - 450 - Salas.jpg
 nombre    antes  remate  categoría (opcional)
```

| Nombre del archivo | Qué sale en la página |
|---|---|
| `Sofá Bruno - 720 - 450.jpg` | Sofá Bruno, antes $720, ahora $450, con su `-38%` |
| `Mesa de centro - 199.jpg` | Mesa de centro a $199, sin precio tachado |
| `Juego de comedor.jpg` | El mueble con su foto, sin precio |
| `Colchón - 340 - 199 VENDIDO.jpg` | Marcado como vendido: gris, al final y sin botón |
| `01. Sofá Bruno - 450.jpg` | Igual que el primero; el `01.` solo sirve para ordenar |

- **Varias fotos del mismo mueble**: pon el mismo nombre (`Sofá Bruno.jpg`, `Sofá Bruno (1).jpg`)
  y se juntan en una sola ficha con todas las fotos.
- **Subcarpetas**: si creas carpetas `Salas`, `Dormitorios`, etc., su nombre se usa de categoría y
  aparecen como filtros arriba. No hace falta escribirla en el nombre del archivo.
- El orden de los dos precios da igual: el mayor se toma como el precio anterior.

## Despliegue (10 min, una sola vez)

1. En el Drive del cliente, crea la carpeta de remates (por ejemplo **REMATES**) y, si quiere,
   subcarpetas por categoría.
2. Comparte esa carpeta: **Compartir → Acceso general → Cualquier persona con el enlace → Lector**.
   Sin esto, las fotos no se ven en la página. Las subcarpetas y las fotos lo heredan.
3. Entra a <https://script.google.com> → **Nuevo proyecto**.
4. Pega `Code.gs`. En ⚙️ Configuración, activa el manifiesto y pega `appsscript.json`.
5. En `Code.gs`, cambia `CARPETA_ID` por el ID de la carpeta: es lo que va después de `/folders/`
   en su URL.
6. Ejecuta la función `probar` una vez y autoriza el acceso a Drive. En el registro debe decir
   `ok: true` y el número de fotos.
7. **Implementar → Nueva implementación → Aplicación web.** Ejecutar como: **Yo**.
   Quién tiene acceso: **Cualquier usuario**.
8. Copia la URL que termina en `/exec` y ponla en la variable de entorno del cliente
   (`REMATES_<CLIENTE>_DRIVE`) en Vercel.

> **Qué ve el público.** La URL `/exec` devuelve los nombres e IDs de las fotos de esa carpeta, y
> la carpeta queda legible por quien tenga el enlace. Úsala **solo** para la carpeta de remates:
> nunca apuntes `CARPETA_ID` a una carpeta con documentos internos.

## Si algo falla

| Síntoma | Causa habitual |
|---|---|
| La página sale vacía en producción | Falta la variable `REMATES_<CLIENTE>_DRIVE`, o el `/exec` responde error. Abre la URL en el navegador: debe devolver `{"ok":true,...}`. |
| Los muebles salen pero sin foto | La carpeta no está compartida como "cualquier persona con el enlace". |
| Un mueble sale sin precio | El nombre del archivo no lleva ` - ` entre el nombre y el precio (espacio, guion, espacio). |
| Sale el mueble duplicado | Dos archivos con nombres distintos (`Sofa Bruno` y `Sofá Bruno 2`). Usa el mismo nombre para agruparlos. |
