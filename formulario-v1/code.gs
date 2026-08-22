/* =========================================================
   Archivo de prácticas — backend mínimo
   Sube una imagen a la vez a una subcarpeta por estudiante.
   ========================================================= */

// Carpeta de Drive donde se crean las subcarpetas de cada estudiante.
const DRIVE_FOLDER_ID = '1TfjGEABWqdrUGu20V9WQAUn3FTTyGnmh';

// Planilla donde se registra cada imagen subida.
const SPREADSHEET_ID = '1sCBmSOlLlYEPLNkS0hVT8QOzIi0fc7BENiqfaVwwoZI';

// Columnas de la planilla, en orden.
const ENCABEZADOS = [
  'fecha', 'correo', 'nombre', 'linea', 'curso', 'nombreArchivo', 'idDrive', 'urlDrive'
];


/* =========================================================
   1. Servir el formulario
   ========================================================= */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Archivo de prácticas')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}


/* =========================================================
   2. Nombre asociado al correo
   Se guarda una vez y se reutiliza en las visitas siguientes.
   ========================================================= */

// Clave con la que se guarda el nombre de cada correo.
function claveDeNombre(correo) {
  return 'nombre::' + correo;
}

// Devuelve el nombre guardado para la sesión actual, o '' la primera vez.
function obtenerNombre() {
  const correo = Session.getActiveUser().getEmail();
  if (!correo) return '';

  return PropertiesService.getScriptProperties()
    .getProperty(claveDeNombre(correo)) || '';
}

// Guarda el nombre para la sesión actual.
function guardarNombre(nombre) {
  const correo = Session.getActiveUser().getEmail();
  const limpio = (nombre || '').trim();
  if (!correo || !limpio) return '';

  PropertiesService.getScriptProperties()
    .setProperty(claveDeNombre(correo), limpio);
  return limpio;
}

// El nombre guardado manda sobre el que llega del cliente.
// Si todavía no hay ninguno, se guarda el que llega y se usa ese.
function resolverNombre(nombreDelCliente) {
  const guardado = obtenerNombre();
  if (guardado) return guardado;

  const limpio = (nombreDelCliente || '').trim();
  guardarNombre(limpio);
  return limpio;
}


/* =========================================================
   3. Subida de una imagen
   Recibe: { correo, nombre, linea, curso, nombreArchivo, tipo, base64 }
   Devuelve: { exito: true, id, url, errorPlanilla } o { exito: false, mensaje }
   ========================================================= */

function subirImagen(datos) {
  try {
    // El correo del cliente no se usa: se toma el de la sesión real.
    const correo = Session.getActiveUser().getEmail();

    const nombreEstudiante = resolverNombre(datos.nombre);
    if (!nombreEstudiante) {
      return { exito: false, mensaje: 'Falta el nombre del estudiante.' };
    }
    if (!datos.base64) {
      return { exito: false, mensaje: 'No llegó el contenido de la imagen.' };
    }

    // Una subcarpeta por estudiante dentro de la carpeta del archivo.
    const carpeta = obtenerOCrearSubcarpeta(nombreEstudiante);

    // Del base64 al archivo en Drive. No se tocan los permisos:
    // el archivo hereda los de la carpeta.
    const bytes = Utilities.base64Decode(datos.base64);
    const blob = Utilities.newBlob(bytes, datos.tipo, datos.nombreArchivo);
    const archivo = carpeta.createFile(blob);

    // El archivo ya está guardado: si la planilla falla, no se pierde la subida.
    const errorPlanilla = registrarEnPlanilla([
      new Date(),
      correo,
      nombreEstudiante,
      datos.linea,
      datos.curso,
      datos.nombreArchivo,
      archivo.getId(),
      archivo.getUrl()
    ]);

    return {
      exito: true,
      id: archivo.getId(),
      url: archivo.getUrl(),
      errorPlanilla: errorPlanilla
    };

  } catch (error) {
    return { exito: false, mensaje: error.message };
  }
}


/* =========================================================
   4. Registro en la planilla
   ========================================================= */

// Agrega una fila a la primera hoja. Devuelve '' si salió bien,
// o el mensaje de error si falló: nunca lanza.
function registrarEnPlanilla(fila) {
  try {
    const hoja = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];

    // Hoja recién creada: primero los encabezados.
    if (hoja.getLastRow() === 0) {
      hoja.appendRow(ENCABEZADOS);
    }

    hoja.appendRow(fila);
    return '';

  } catch (error) {
    Logger.log('No se pudo escribir en la planilla: %s', error.message);
    return error.message;
  }
}


/* =========================================================
   5. Auxiliares
   ========================================================= */

// Devuelve la subcarpeta del estudiante y la crea si todavía no existe.
function obtenerOCrearSubcarpeta(nombreEstudiante) {
  const carpetaRaiz = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const encontradas = carpetaRaiz.getFoldersByName(nombreEstudiante);

  return encontradas.hasNext()
    ? encontradas.next()
    : carpetaRaiz.createFolder(nombreEstudiante);
}
