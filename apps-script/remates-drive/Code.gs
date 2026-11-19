/**
 * REMATES — lista una carpeta de Google Drive y la devuelve como JSON.
 *
 * La página de remates (app/<cliente>/remates) lee este JSON. El cliente solo sube fotos a la
 * carpeta: el mueble aparece solo. El nombre, los precios y la categoría salen del nombre del
 * archivo (ver docs/remates.md).
 *
 * Despliegue: ver README.md de esta carpeta.
 */

// Pega aquí el ID de la carpeta de remates (lo que va después de /folders/ en su URL).
var CARPETA_ID = 'PON_AQUI_EL_ID_DE_LA_CARPETA';

// Hasta cuántas fotos devolver. Suficiente para cualquier mueblería y evita respuestas enormes.
var LIMITE = 300;

function doGet() {
  var salida = { ok: true, archivos: [], generado: new Date().toISOString() };
  try {
    var raiz = DriveApp.getFolderById(CARPETA_ID);
    recoger(raiz, '', salida.archivos);
    // Las subcarpetas sirven de categoría: "Salas", "Dormitorios"...
    var subs = raiz.getFolders();
    while (subs.hasNext() && salida.archivos.length < LIMITE) {
      var sub = subs.next();
      recoger(sub, sub.getName(), salida.archivos);
    }
  } catch (e) {
    salida.ok = false;
    salida.error = String(e && e.message ? e.message : e);
  }
  return ContentService.createTextOutput(JSON.stringify(salida))
    .setMimeType(ContentService.MimeType.JSON);
}

function recoger(carpeta, nombreCarpeta, acumulado) {
  var it = carpeta.getFiles();
  while (it.hasNext() && acumulado.length < LIMITE) {
    var f = it.next();
    if (String(f.getMimeType()).indexOf('image/') !== 0) continue; // solo fotos
    acumulado.push({
      id: f.getId(),
      nombre: f.getName(),
      carpeta: nombreCarpeta || '',
      actualizado: f.getLastUpdated().toISOString()
    });
  }
}

/** Ejecuta esto una vez desde el editor para comprobar que la carpeta se lee bien. */
function probar() {
  var r = JSON.parse(doGet().getContent());
  Logger.log('ok: ' + r.ok + ' | fotos: ' + r.archivos.length);
  if (r.error) Logger.log('error: ' + r.error);
  r.archivos.slice(0, 5).forEach(function (a) { Logger.log(a.carpeta + ' / ' + a.nombre); });
}
