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
  'fechaSubida', 'correo', 'nombre',
  'linea', 'linkCarpetaLinea',
  'curso', 'linkCarpetaCurso',
  'nombreArchivo', 'linkArchivo'
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
    if (!datos.linea || !datos.curso) {
      return { exito: false, mensaje: 'Falta la línea o el curso.' };
    }

    // Ruta completa: estudiante > línea > curso.
    const carpetas = prepararCarpetas(nombreEstudiante, datos.linea, datos.curso);

    // El archivo se renombra: el que manda el cliente solo aporta la extensión.
    const nombreArchivo = construirNombreArchivo(
      carpetas.curso, nombreEstudiante, datos.curso, datos.nombreArchivo);

    // Del base64 al archivo en Drive. No se tocan los permisos:
    // el archivo hereda los de la carpeta.
    const bytes = Utilities.base64Decode(datos.base64);
    const blob = Utilities.newBlob(bytes, datos.tipo, nombreArchivo);
    const archivo = carpetas.curso.createFile(blob);

    // El archivo ya está guardado: si la planilla falla, no se pierde la subida.
    const errorPlanilla = registrarEnPlanilla([
      new Date(),
      correo,
      nombreEstudiante,
      datos.linea,
      carpetas.linea.getUrl(),
      datos.curso,
      carpetas.curso.getUrl(),
      nombreArchivo,
      archivo.getUrl()
    ]);

    return {
      exito: true,
      id: archivo.getId(),
      url: archivo.getUrl(),
      nombreArchivo: nombreArchivo,
      urlCarpetaCurso: carpetas.curso.getUrl(),
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
   5. Nombre del archivo
   Queda: juanPerez-dibujo-y-observacion-01.webp
   La línea no se incluye porque se deduce del curso.
   ========================================================= */

// Quita tildes y deja solo minúsculas, números y guiones.
function aSlug(texto) {
  return (texto || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // marcas de acento que deja NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// "Juan Pérez Soto" -> "juanPerezSoto"
function aCamelCase(texto) {
  const partes = aSlug(texto).split('-').filter(String);

  return partes.map(function (parte, indice) {
    return indice === 0 ? parte : parte.charAt(0).toUpperCase() + parte.slice(1);
  }).join('');
}

// Extensión del archivo original; si no tiene, asumimos webp.
function extensionDe(nombreArchivo) {
  const punto = (nombreArchivo || '').lastIndexOf('.');
  return punto > 0 ? nombreArchivo.slice(punto + 1).toLowerCase() : 'webp';
}

// Cuenta los archivos de la carpeta que ya usan ese prefijo, para no repetir nombre.
function siguienteCorrelativo(carpeta, prefijo) {
  const archivos = carpeta.getFiles();
  let cuenta = 0;

  while (archivos.hasNext()) {
    if (archivos.next().getName().indexOf(prefijo) === 0) cuenta++;
  }
  return cuenta + 1;
}

function construirNombreArchivo(carpeta, nombreEstudiante, curso, nombreOriginal) {
  const prefijo = aCamelCase(nombreEstudiante) + '-' + aSlug(curso) + '-';
  const numero = siguienteCorrelativo(carpeta, prefijo);
  const correlativo = numero < 10 ? '0' + numero : String(numero);

  return prefijo + correlativo + '.' + extensionDe(nombreOriginal);
}


/* =========================================================
   6. Aviso por correo al terminar la tanda
   Se llama una sola vez, no una por imagen.
   Recibe: { curso, linea, cantidad }
   ========================================================= */

function avisarPorCorreo(resumen) {
  try {
    const correo = Session.getActiveUser().getEmail();
    if (!correo) {
      return { exito: false, mensaje: 'No se pudo obtener el correo de la sesión.' };
    }

    const nombre = obtenerNombre();
    if (!nombre) {
      return { exito: false, mensaje: 'Todavía no hay un nombre guardado.' };
    }

    const urlCarpeta = carpetaDelEstudiante(nombre).getUrl();

    MailApp.sendEmail({
      to: correo,
      subject: 'Archivo de prácticas — trabajos recibidos',
      htmlBody: armarCuerpoDelCorreo(nombre, resumen, urlCarpeta)
    });

    return { exito: true, urlCarpeta: urlCarpeta };

  } catch (error) {
    Logger.log('No se pudo enviar el correo: %s', error.message);
    return { exito: false, mensaje: error.message };
  }
}

function armarCuerpoDelCorreo(nombre, resumen, urlCarpeta) {
  const fecha = Utilities.formatDate(
    new Date(), Session.getScriptTimeZone(), "d 'de' MMMM, HH:mm");

  return '<p>Hola ' + nombre + ',</p>' +

    '<p>Gracias por completar el formulario. El ' + fecha + ' recibimos ' +
    resumen.cantidad + ' imagen(es):</p>' +

    listaDeCursos(resumen.detalles) +

    '<p>Puedes revisar todo lo que has subido en tu carpeta:<br>' +
    '<a href="' + urlCarpeta + '">' + urlCarpeta + '</a></p>' +

    '<p style="color:#666;font-size:13px">Los archivos se renombran y se convierten a ' +
    'WebP al guardarse, así que el nombre que ves acá no es el que tenían en tu ' +
    'teléfono o computador. Es el mismo archivo.</p>' +

    '<p>Puedes volver a subir trabajos las veces que quieras mientras la ventana ' +
    'esté abierta. Si algo no cuadra, responde este correo.</p>';
}

// Un bloque por curso: cuántas imágenes, el enlace a la carpeta y los nombres.
function listaDeCursos(detalles) {
  if (!detalles || !detalles.length) return '';

  return detalles.map(function (detalle) {
    return '<p><strong>' + detalle.curso + '</strong> — ' + detalle.linea + '<br>' +
      detalle.cantidad + ' imagen(es) · ' +
      '<a href="' + detalle.urlCarpeta + '">ver la carpeta del curso</a></p>' +
      listaDeArchivos(detalle.archivos);
  }).join('');
}

function listaDeArchivos(archivos) {
  if (!archivos || !archivos.length) return '';

  const filas = archivos.map(function (nombre) {
    return '<li>' + nombre + '</li>';
  });

  return '<ul style="color:#666;font-size:13px">' + filas.join('') + '</ul>';
}


/* =========================================================
   7. Auxiliares
   ========================================================= */

// Busca una subcarpeta por nombre dentro de otra, y la crea si no existe.
function obtenerOCrearSubcarpeta(carpetaPadre, nombre) {
  const encontradas = carpetaPadre.getFoldersByName(nombre);

  return encontradas.hasNext()
    ? encontradas.next()
    : carpetaPadre.createFolder(nombre);
}

// Arma la ruta estudiante > línea > curso y devuelve las tres carpetas.
function prepararCarpetas(nombreEstudiante, linea, curso) {
  const raiz = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const carpetaEstudiante = obtenerOCrearSubcarpeta(raiz, nombreEstudiante);
  const carpetaLinea = obtenerOCrearSubcarpeta(carpetaEstudiante, linea);

  return {
    estudiante: carpetaEstudiante,
    linea: carpetaLinea,
    curso: obtenerOCrearSubcarpeta(carpetaLinea, curso)
  };
}

// Carpeta del estudiante, sin bajar a línea ni curso.
function carpetaDelEstudiante(nombreEstudiante) {
  const raiz = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  return obtenerOCrearSubcarpeta(raiz, nombreEstudiante);
}


/* =========================================================
   8. Diagnóstico
   Se ejecuta a mano desde el editor, sin argumentos.
   El formulario no la usa.
   ========================================================= */

function diagnostico() {
  const correo = Session.getActiveUser().getEmail();

  Logger.log('Correo de la sesión: "%s"', correo);
  Logger.log('Nombre guardado: "%s"', obtenerNombre());

  // Sin correo no hay caso: el aviso se corta antes de intentar enviarlo.
  if (!correo) {
    Logger.log('Vacío. Revisar "Ejecutar como" en el despliegue.');
    return;
  }

  try {
    MailApp.sendEmail(
      correo,
      'Prueba — archivo de prácticas',
      'Si te llegó esto, el envío de correo funciona.');

    Logger.log('Correo de prueba enviado. Quedan %s envíos hoy.',
      MailApp.getRemainingDailyQuota());

  } catch (error) {
    Logger.log('MailApp falló: %s', error.message);
  }
}
