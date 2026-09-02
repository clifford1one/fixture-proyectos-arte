/* =========================================================
   Archivo de prácticas — backend mínimo
   Sube una imagen a la vez a una subcarpeta por estudiante.
   ========================================================= */

// Carpeta de Drive donde se crean las subcarpetas de cada estudiante.
const DRIVE_FOLDER_ID = '1TfjGEABWqdrUGu20V9WQAUn3FTTyGnmh';

// Planilla donde se registra cada imagen subida.
const SPREADSHEET_ID = '1sCBmSOlLlYEPLNkS0hVT8QOzIi0fc7BENiqfaVwwoZI';

// Columnas de la planilla, en orden. Las nuevas van siempre al final:
// appendRow escribe por posición, así que insertar una al medio desalinearía
// todas las filas ya escritas.
const ENCABEZADOS = [
  'fecha', 'correo', 'nombre',
  'linea', 'folderLinea',
  'curso', 'folderCurso',
  'nombreArchivo', 'linkArchivo',
  'tipo', 'contenido', 'enlace'
];

// Tope de un texto. Se revisa acá además del maxlength del navegador:
// el cliente puede mentir.
const TEXTO_MAXIMO = 2000;


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
   Recibe: { correo, nombre, linea, curso, codigoCurso, nombreArchivo, tipo, base64 }
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
      carpetas.curso, nombreEstudiante, datos.codigoCurso, datos.curso,
      extensionDe(datos.nombreArchivo));

    // Del base64 al archivo en Drive. No se tocan los permisos:
    // el archivo hereda los de la carpeta.
    const bytes = Utilities.base64Decode(datos.base64);
    const blob = Utilities.newBlob(bytes, datos.tipo, nombreArchivo);
    const archivo = carpetas.curso.createFile(blob);

    // El archivo ya está guardado: si la planilla falla, no se pierde la subida.
    const errorPlanilla = registrarEnPlanilla(filaDeRegistro(
      correo, nombreEstudiante, datos, carpetas,
      nombreArchivo, archivo.getUrl(), 'imagen', '', ''));

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
   3b. Subida de un texto
   Recibe: { nombre, linea, curso, codigoCurso, contenido }
   El .txt queda en la misma carpeta que las imágenes del curso.
   ========================================================= */

function subirTexto(datos) {
  try {
    const correo = Session.getActiveUser().getEmail();

    const nombreEstudiante = resolverNombre(datos.nombre);
    if (!nombreEstudiante) {
      return { exito: false, mensaje: 'Falta el nombre del estudiante.' };
    }

    const contenido = (datos.contenido || '').trim();
    if (!contenido) {
      return { exito: false, mensaje: 'El texto llegó vacío.' };
    }
    if (contenido.length > TEXTO_MAXIMO) {
      return { exito: false, mensaje: 'El texto pasa de ' + TEXTO_MAXIMO + ' caracteres.' };
    }
    if (!datos.linea || !datos.curso) {
      return { exito: false, mensaje: 'Falta la línea o el curso.' };
    }

    const carpetas = prepararCarpetas(nombreEstudiante, datos.linea, datos.curso);

    const nombreArchivo = construirNombreArchivo(
      carpetas.curso, nombreEstudiante, datos.codigoCurso, datos.curso, 'txt');

    // newBlob con un String guarda en UTF-8: las tildes y la ñ quedan bien.
    const blob = Utilities.newBlob(contenido, 'text/plain', nombreArchivo);
    const archivo = carpetas.curso.createFile(blob);

    // El texto va también a la planilla: es corto, y ahí queda buscable sin
    // tener que abrir el archivo uno por uno.
    const errorPlanilla = registrarEnPlanilla(filaDeRegistro(
      correo, nombreEstudiante, datos, carpetas,
      nombreArchivo, archivo.getUrl(), 'texto', contenido, ''));

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
   3c. Enlace de video de YouTube
   Recibe: { nombre, linea, curso, codigoCurso, url }

   El video no se sube: vive en YouTube. Lo que sí queda en Drive
   es su portada, para que el archivo conserve algo aunque el
   estudiante borre el video o le cambie la privacidad.
   ========================================================= */

// Saca el id de 11 caracteres de cualquiera de las formas que usa
// YouTube: watch?v=, youtu.be/, /shorts/, /embed/, con o sin más
// parámetros detrás.
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

  // Pegar el id pelado también vale.
  return /^[A-Za-z0-9_-]{11}$/.test(texto) ? texto : '';
}

// Pregunta por el video sin API key. Responde 200 con título y portada
// si es público u oculto, y 401 si es privado: justo la distinción que
// importa, porque un video privado no se puede insertar en ninguna parte.
// Devuelve { ok, titulo, urlPortada, mensaje }.
function consultarYoutube(idVideo) {
  const consulta = 'https://www.youtube.com/oembed?format=json&url=' +
    encodeURIComponent('https://www.youtube.com/watch?v=' + idVideo);

  try {
    const respuesta = UrlFetchApp.fetch(consulta, { muteHttpExceptions: true });
    const codigo = respuesta.getResponseCode();

    if (codigo === 401 || codigo === 403) {
      return {
        ok: false,
        mensaje: 'El video es privado. Cámbialo a "Oculto" para que se pueda ver acá.'
      };
    }
    if (codigo === 404) {
      return { ok: false, mensaje: 'No encontramos ese video. Revisa el enlace.' };
    }
    if (codigo !== 200) {
      return { ok: false, mensaje: 'YouTube respondió ' + codigo + '.' };
    }

    const datos = JSON.parse(respuesta.getContentText());
    return {
      ok: true,
      titulo: datos.title || '',
      urlPortada: datos.thumbnail_url || ''
    };

  } catch (error) {
    // Sin permiso de salida a internet no se puede verificar. No es
    // motivo para rechazar el enlace: se guarda sin comprobar.
    Logger.log('No se pudo consultar YouTube: %s', error.message);
    return { ok: true, titulo: '', urlPortada: '', sinVerificar: true };
  }
}

// Baja la portada y la deja en la carpeta del curso, con el enlace del
// video en la descripción del archivo. Devuelve { nombre, url } o null
// si no se pudo — normalmente porque el dominio no permite UrlFetchApp.
function guardarPortada(carpeta, nombreBase, urlPortada, titulo, urlVideo) {
  if (!urlPortada) return null;

  try {
    const respuesta = UrlFetchApp.fetch(urlPortada, { muteHttpExceptions: true });
    if (respuesta.getResponseCode() !== 200) return null;

    const nombre = nombreBase + '.jpg';
    const blob = respuesta.getBlob().setName(nombre);
    const archivo = carpeta.createFile(blob);

    // Una imagen suelta no dice a qué video pertenece. La descripción se
    // ve en el panel de detalles de Drive y viaja con el archivo.
    archivo.setDescription((titulo ? titulo + ' — ' : '') + urlVideo);

    return { nombre: nombre, url: archivo.getUrl() };

  } catch (error) {
    Logger.log('No se pudo guardar la portada: %s', error.message);
    return null;
  }
}

// Piso garantizado: si no hubo portada, igual queda algo en la carpeta
// del curso. Es un .txt, así que Drive lo previsualiza al abrirlo y no
// necesita salir a internet para crearse.
function guardarNotaDelVideo(carpeta, nombreBase, titulo, urlVideo) {
  const nombre = nombreBase + '.txt';
  const cuerpo = (titulo || 'Video de YouTube') + '\n' + urlVideo + '\n';

  const blob = Utilities.newBlob(cuerpo, 'text/plain', nombre);
  const archivo = carpeta.createFile(blob);
  archivo.setDescription(urlVideo);

  return { nombre: nombre, url: archivo.getUrl() };
}

function agregarVideoYoutube(datos) {
  try {
    const correo = Session.getActiveUser().getEmail();

    const nombreEstudiante = resolverNombre(datos.nombre);
    if (!nombreEstudiante) {
      return { exito: false, mensaje: 'Falta el nombre del estudiante.' };
    }
    if (!datos.linea || !datos.curso) {
      return { exito: false, mensaje: 'Falta la línea o el curso.' };
    }

    const idVideo = idDeYoutube(datos.url);
    if (!idVideo) {
      return { exito: false, mensaje: 'Ese no parece un enlace de YouTube.' };
    }

    const consulta = consultarYoutube(idVideo);
    if (!consulta.ok) {
      return { exito: false, mensaje: consulta.mensaje };
    }

    const carpetas = prepararCarpetas(nombreEstudiante, datos.linea, datos.curso);

    const urlCanonica = 'https://www.youtube.com/watch?v=' + idVideo;

    // El video entra en la misma numeración que las imágenes y los textos
    // del curso. Se arma el nombre sin extensión: la pone quien guarde.
    const conExtension = construirNombreArchivo(
      carpetas.curso, nombreEstudiante, datos.codigoCurso, datos.curso, 'jpg');
    const nombreBase = conExtension.slice(0, -4);

    // Siempre queda algo en la carpeta: la portada si se pudo bajar, y si
    // no, una nota con el título y el enlace. Así el video nunca es
    // invisible para quien revise el archivo desde Drive.
    const enDrive =
      guardarPortada(carpetas.curso, nombreBase, consulta.urlPortada,
                     consulta.titulo, urlCanonica) ||
      guardarNotaDelVideo(carpetas.curso, nombreBase, consulta.titulo, urlCanonica);

    const errorPlanilla = registrarEnPlanilla(filaDeRegistro(
      correo, nombreEstudiante, datos, carpetas,
      enDrive.nombre, enDrive.url,
      'youtube', consulta.titulo, urlCanonica));

    return {
      exito: true,
      idVideo: idVideo,
      titulo: consulta.titulo,
      url: urlCanonica,
      nombreArchivo: enDrive.nombre,
      urlCarpetaCurso: carpetas.curso.getUrl(),
      sinVerificar: consulta.sinVerificar === true,
      // Sin portada quedó la nota de texto, no una imagen.
      sinPortada: enDrive.nombre.slice(-4) !== '.jpg',
      errorPlanilla: errorPlanilla
    };

  } catch (error) {
    return { exito: false, mensaje: error.message };
  }
}


/* =========================================================
   4. Registro en la planilla
   ========================================================= */

// Arma la fila en el orden de ENCABEZADOS. Imágenes y textos pasan por acá,
// para que las columnas no se puedan desalinear entre un tipo y el otro.
function filaDeRegistro(correo, nombre, datos, carpetas,
                        nombreArchivo, url, tipo, contenido, enlace) {
  return [
    new Date(),
    correo,
    nombre,
    datos.linea,
    carpetas.linea.getUrl(),
    datos.curso,
    carpetas.curso.getUrl(),
    nombreArchivo,
    url,
    tipo,
    contenido,
    enlace || ''
  ];
}

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
   Queda: juanPerez-ART03113-01.webp
   El código de asignatura va en vez del nombre del curso: es corto,
   estable ante renombres y sirve para ordenar el archivo. La línea no
   se incluye porque se deduce del curso.
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

// Deja el código listo para un nombre de archivo. Los códigos de la malla ya
// vienen limpios ("ART03215"); esto es por si alguno se escribe con espacio o
// guion al agregar un curso.
// Si el curso todavía no tiene código, se cae al nombre en slug para no
// dejar el archivo sin identificar.
function claveDeCurso(codigoCurso, curso) {
  const codigo = (codigoCurso || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return codigo || aSlug(curso);
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

function construirNombreArchivo(carpeta, nombreEstudiante, codigoCurso, curso, extension) {
  const prefijo = aCamelCase(nombreEstudiante) + '-' + claveDeCurso(codigoCurso, curso) + '-';
  const numero = siguienteCorrelativo(carpeta, prefijo);
  const correlativo = numero < 10 ? '0' + numero : String(numero);

  // El correlativo no distingue imágenes de textos: cuenta por prefijo, así que
  // una carpeta queda 01.webp, 02.txt, 03.webp, en el orden en que llegaron.
  return prefijo + correlativo + '.' + extension;
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
    resumen.cantidad + ' archivo(s):</p>' +

    listaDeCursos(resumen.detalles) +

    '<p>Puedes revisar todo lo que has subido en tu carpeta:<br>' +
    '<a href="' + urlCarpeta + '">' + urlCarpeta + '</a></p>' +

    '<p style="color:#666;font-size:13px">Los archivos se renombran al guardarse, y ' +
    'las imágenes además se convierten a WebP, así que el nombre que ves acá no es ' +
    'el que tenían en tu teléfono o computador. Es el mismo archivo.</p>' +

    '<p>Puedes volver a subir trabajos las veces que quieras mientras la ventana ' +
    'esté abierta. Si algo no cuadra, responde este correo.</p>';
}

// Un bloque por curso: cuántas imágenes, el enlace a la carpeta y los nombres.
function listaDeCursos(detalles) {
  if (!detalles || !detalles.length) return '';

  return detalles.map(function (detalle) {
    return '<p><strong>' + detalle.curso + '</strong> — ' + detalle.linea + '<br>' +
      detalle.cantidad + ' archivo(s) · ' +
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

  diagnosticarYoutube();
}


/* Responde lo único que puede hacer que un video quede sin portada en
   Drive: si el script tiene permiso para salir a internet. Sin ese
   permiso el enlace igual se registra en la planilla, pero no se
   guarda ninguna imagen. */
function diagnosticarYoutube() {
  const idPrueba = 'A1_u4n5Cz2w';

  Logger.log('--- YouTube ---');

  let consulta;
  try {
    consulta = consultarYoutube(idPrueba);
  } catch (error) {
    Logger.log('consultarYoutube lanzó: %s', error.message);
    return;
  }

  if (consulta.sinVerificar) {
    Logger.log('UrlFetchApp NO está disponible.');
    Logger.log('Los enlaces se van a registrar igual, pero sin portada en Drive.');
    Logger.log('Falta el permiso script.external_request en el manifiesto,');
    Logger.log('o el dominio lo tiene bloqueado.');
    return;
  }

  if (!consulta.ok) {
    Logger.log('UrlFetchApp funciona, pero el video de prueba no: %s', consulta.mensaje);
    return;
  }

  Logger.log('UrlFetchApp funciona. Título del video: "%s"', consulta.titulo);
  Logger.log('Portada: %s', consulta.urlPortada || '(sin portada)');

  // Se guarda en la raíz y se borra: solo interesa saber si se puede.
  try {
    const raiz = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const portada = guardarPortada(raiz, 'prueba-portada', consulta.urlPortada,
                                   consulta.titulo, 'https://youtu.be/' + idPrueba);

    if (!portada) {
      Logger.log('No se pudo guardar la portada en Drive.');
      return;
    }

    Logger.log('Portada guardada en Drive: %s', portada.url);
    DriveApp.getFileById(portada.url.match(/\/d\/([^\/]+)/)[1]).setTrashed(true);
    Logger.log('(archivo de prueba enviado a la papelera)');

  } catch (error) {
    Logger.log('Falló al guardar en Drive: %s', error.message);
  }
}
