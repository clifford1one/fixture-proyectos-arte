/* =========================================================
   Visualizador del archivo de prácticas — backend

   Proyecto de Apps Script aparte del formulario, apuntando a la
   misma planilla. Cada estudiante ve solo sus propios trabajos y
   guarda su clasificación en nodos.
   ========================================================= */

// La misma planilla que escribe el formulario.
const SPREADSHEET_ID = '1sCBmSOlLlYEPLNkS0hVT8QOzIi0fc7BENiqfaVwwoZI';

// Hoja donde se guarda la clasificación. Se crea sola la primera vez.
const HOJA_CLASIFICACION = 'clasificacion';
const ENCABEZADOS_CLASIFICACION = ['correo', 'clasificacion', 'actualizado'];

// Columnas de la hoja de registro, por posición.
const COL = {
  FECHA: 0, CORREO: 1, NOMBRE: 2,
  LINEA: 3, FOLDER_LINEA: 4,
  CURSO: 5, FOLDER_CURSO: 6,
  ARCHIVO: 7, LINK: 8,
  TIPO: 9, CONTENIDO: 10, ENLACE: 11
};

/* Los nodos los define la carrera, no el estudiante. Viven en el
   servidor para poder validar contra ellos lo que llega del cliente. */
const CATEGORIAS = [
  {
    clave: 'forma',
    titulo: 'Forma y materiales',
    definicion: 'Qué materia toca el trabajo y qué decisiones formales lo ' +
      'sostienen: soportes, escalas, técnicas, texturas.'
  },
  {
    clave: 'nudo',
    titulo: 'Nudo conceptual',
    definicion: 'El problema que el trabajo mantiene abierto: la pregunta ' +
      'que vuelve, aunque cambie el medio.'
  },
  {
    clave: 'modos',
    titulo: 'Modos de hacer',
    definicion: 'Cómo se produce el trabajo: procesos, rutinas de taller, ' +
      'colaboraciones, maneras de resolver.'
  }
];

const LINEAS = ['Talleres', 'Estudios visuales', 'Lenguajes artísticos',
                'Imagen y tecnología', 'Gestión'];


/* =========================================================
   1. Servir la página
   Los datos van incrustados en el HTML en vez de pedirse
   después: Apps Script ya es lento de arrancar, y así no se
   suma una segunda vuelta al servidor antes de ver algo.
   ========================================================= */

function doGet() {
  const plantilla = HtmlService.createTemplateFromFile('index');

  // El < evita que un texto de estudiante que contenga
  // "</script>" cierre el bloque antes de tiempo.
  plantilla.datosJson = JSON.stringify(reunirArchivo()).replace(/</g, '\\u003c');

  return plantilla.evaluate()
    .setTitle('Archivo de prácticas')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// El editor de Apps Script no acepta .css ni .js sueltos: el estilo y
// el script viven en style.html y script.html, y se pegan acá.
function include(nombre) {
  return HtmlService.createHtmlOutputFromFile(nombre).getContent();
}


/* =========================================================
   2. Reunir lo que le toca a quien entró
   ========================================================= */

function reunirArchivo() {
  const correo = Session.getActiveUser().getEmail();

  if (!correo) {
    return {
      error: 'No pudimos identificar tu cuenta. Avisa al equipo.',
      categorias: CATEGORIAS, lineas: LINEAS, obras: [], clasificacion: {}
    };
  }

  const obras = obrasDe(correo);

  return {
    error: '',
    correo: correo,
    nombre: obras.length > 0 ? obras[0].estudiante : '',
    urlCarpeta: urlDeCarpeta(obras),
    categorias: CATEGORIAS,
    lineas: LINEAS,
    obras: obras,
    clasificacion: leerClasificacion(correo)
  };
}

// Todas las filas de la planilla que son de este correo.
function obrasDe(correo) {
  const hoja = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
  const filas = hoja.getDataRange().getValues();
  const obras = [];

  // Se parte en 1 para saltar los encabezados.
  for (let i = 1; i < filas.length; i++) {
    const fila = filas[i];
    if (String(fila[COL.CORREO]).trim().toLowerCase() !== correo.toLowerCase()) continue;

    // Las filas anteriores a la columna "tipo" no la traen: se deduce.
    const tipo = String(fila[COL.TIPO] || '').trim() ||
      tipoSegunArchivo(fila[COL.ARCHIVO]);

    const idDrive = idDesdeUrl(fila[COL.LINK]);
    const idVideo = tipo === 'youtube' ? idDeYoutube(fila[COL.ENLACE]) : '';

    // Un video de YouTube no tiene archivo en Drive, así que su identidad
    // es la del video. El prefijo evita chocar con los ids de Drive.
    const id = idVideo ? ('yt:' + idVideo) : idDrive;
    if (!id) continue;   // fila sin nada que mostrar

    obras.push({
      id: id,
      estudiante: String(fila[COL.NOMBRE]),
      linea: String(fila[COL.LINEA]),
      curso: String(fila[COL.CURSO]),
      archivo: String(fila[COL.ARCHIVO]),
      tipo: tipo,
      contenido: String(fila[COL.CONTENIDO] || ''),
      // Solo en los de YouTube: el id del video y el de su portada en Drive.
      idVideo: idVideo,
      portada: idVideo ? idDrive : '',
      urlCurso: String(fila[COL.FOLDER_CURSO] || '')
    });
  }

  return obras;
}

// "https://drive.google.com/file/d/ABC123/view?usp=drivesdk" -> "ABC123"
function idDesdeUrl(url) {
  const encontrado = String(url || '').match(/\/d\/([A-Za-z0-9_-]+)/);
  return encontrado ? encontrado[1] : '';
}

// El formulario guarda la URL canónica, pero se acepta cualquier forma
// por si alguien edita la planilla a mano.
function idDeYoutube(url) {
  const texto = String(url || '').trim();
  const patrones = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /\/shorts\/([A-Za-z0-9_-]{11})/,
    /\/embed\/([A-Za-z0-9_-]{11})/,
    /\/live\/([A-Za-z0-9_-]{11})/
  ];

  for (let i = 0; i < patrones.length; i++) {
    const encontrado = texto.match(patrones[i]);
    if (encontrado) return encontrado[1];
  }

  return /^[A-Za-z0-9_-]{11}$/.test(texto) ? texto : '';
}

// Respaldo para filas escritas antes de que existiera la columna "tipo".
// Solo para filas viejas, anteriores a la columna "tipo".
function tipoSegunArchivo(nombreArchivo) {
  const nombre = String(nombreArchivo || '').toLowerCase();
  if (nombre.slice(-4) === '.txt') return 'texto';
  if (nombre.slice(-4) === '.mp4' || nombre.slice(-4) === '.mov') return 'video';
  return 'imagen';
}

// La carpeta del estudiante es la que contiene a la del curso.
function urlDeCarpeta(obras) {
  if (obras.length === 0) return '';

  try {
    const carpetaCurso = DriveApp.getFolderById(idDesdeUrl(obras[0].urlCurso));
    const padres = carpetaCurso.getParents();          // la línea
    if (!padres.hasNext()) return obras[0].urlCurso;

    const abuelos = padres.next().getParents();        // el estudiante
    return abuelos.hasNext() ? abuelos.next().getUrl() : obras[0].urlCurso;

  } catch (error) {
    Logger.log('No se pudo resolver la carpeta: %s', error.message);
    return obras[0].urlCurso;
  }
}


/* =========================================================
   3. Clasificación en nodos
   Una fila por estudiante, con todo su mapa en JSON. Así
   guardar es escribir una celda y no reescribir la hoja.
   ========================================================= */

function hojaDeClasificacion() {
  const libro = SpreadsheetApp.openById(SPREADSHEET_ID);
  let hoja = libro.getSheetByName(HOJA_CLASIFICACION);

  if (!hoja) {
    hoja = libro.insertSheet(HOJA_CLASIFICACION);
    hoja.appendRow(ENCABEZADOS_CLASIFICACION);
  }
  return hoja;
}

// Devuelve la fila (base 1) donde está ese correo, o 0 si no está.
function filaDelCorreo(hoja, correo) {
  const correos = hoja.getRange(1, 1, Math.max(hoja.getLastRow(), 1), 1).getValues();

  for (let i = 1; i < correos.length; i++) {
    if (String(correos[i][0]).trim().toLowerCase() === correo.toLowerCase()) {
      return i + 1;
    }
  }
  return 0;
}

function leerClasificacion(correo) {
  try {
    const hoja = hojaDeClasificacion();
    const fila = filaDelCorreo(hoja, correo);
    if (fila === 0) return {};

    const crudo = hoja.getRange(fila, 2).getValue();
    return crudo ? JSON.parse(crudo) : {};

  } catch (error) {
    Logger.log('No se pudo leer la clasificación: %s', error.message);
    return {};
  }
}

/* Recibe { idDeArchivo: ['forma', 'nudo'], ... } y lo guarda entero.
   El cliente manda siempre el mapa completo, así que no hay que
   fusionar nada: la última escritura es la verdad. */
function guardarClasificacion(mapa) {
  const correo = Session.getActiveUser().getEmail();
  if (!correo) return { exito: false, mensaje: 'No pudimos identificar tu cuenta.' };

  // Dos pestañas del mismo estudiante no deben pisarse.
  const cerrojo = LockService.getUserLock();

  try {
    cerrojo.waitLock(10000);

    const hoja = hojaDeClasificacion();
    const limpio = JSON.stringify(limpiarMapa(mapa));
    const fila = filaDelCorreo(hoja, correo);

    if (fila === 0) hoja.appendRow([correo, limpio, new Date()]);
    else hoja.getRange(fila, 2, 1, 2).setValues([[limpio, new Date()]]);

    return { exito: true };

  } catch (error) {
    Logger.log('No se pudo guardar la clasificación: %s', error.message);
    return { exito: false, mensaje: error.message };

  } finally {
    cerrojo.releaseLock();
  }
}

// Solo se aceptan claves de nodo que existan, y sin repetir.
function limpiarMapa(mapa) {
  const validas = CATEGORIAS.map(function (categoria) { return categoria.clave; });
  const limpio = {};

  Object.keys(mapa || {}).forEach(function (id) {
    const claves = (mapa[id] || []).filter(function (clave, i, lista) {
      return validas.indexOf(clave) !== -1 && lista.indexOf(clave) === i;
    });
    if (claves.length > 0) limpio[id] = claves;
  });

  return limpio;
}


/* =========================================================
   4. Diagnóstico
   Se ejecuta a mano desde el editor, sin argumentos.
   La página no la usa.
   ========================================================= */

function diagnostico() {
  const correo = Session.getActiveUser().getEmail();
  Logger.log('Correo de la sesión: "%s"', correo);

  // Sin correo no hay caso: es lo primero que hay que arreglar.
  if (!correo) {
    Logger.log('Vacío. Revisar "Ejecutar como" y que la cuenta esté en el ' +
               'mismo dominio que el dueño del script.');
    return;
  }

  try {
    const obras = obrasDe(correo);
    Logger.log('Trabajos encontrados: %s', obras.length);
    if (obras.length > 0) {
      Logger.log('Primero: %s (%s)', obras[0].archivo, obras[0].tipo);
      Logger.log('Carpeta: %s', urlDeCarpeta(obras));
    }
    Logger.log('Clasificados: %s', Object.keys(leerClasificacion(correo)).length);

  } catch (error) {
    Logger.log('Falló al leer la planilla: %s', error.message);
  }
}
