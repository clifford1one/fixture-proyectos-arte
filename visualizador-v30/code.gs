/* =========================================================
   Visualizador del archivo de prácticas v30 — backend

   Un tablero libre, tipo pizarra: cada nodo es un área donde el
   estudiante deja sus trabajos donde quiera, los une con líneas y
   escribe encima. Nada se acomoda solo.

   Son dos archivos, los mismos dos que existen en Apps Script:
   este e index.html, que trae marcado, estilo y script juntos.
   ========================================================= */

// La planilla donde escribe el formulario: el id es lo que va entre /d/ y
// /edit en su dirección. Es la de formulario-v1.
const SPREADSHEET_ID = '1sCBmSOlLlYEPLNkS0hVT8QOzIi0fc7BENiqfaVwwoZI';

// Guardar el tablero de cada estudiante en la planilla. Con false el
// tablero vive solo mientras la página está abierta.
const GUARDAR_TABLERO = true;

// Hoja donde se guarda el tablero. Se crea sola la primera vez, al final.
// Es aparte de "clasificacion" (la de v4 y v20): las versiones pueden
// convivir sobre la misma planilla sin pisarse.
const HOJA_TABLERO = 'tablero';
const ENCABEZADOS_TABLERO = ['correo', 'tablero', 'clasificacion', 'actualizado'];

// Pestañas de los visualizadores: ninguna puede quedar primera, porque el
// formulario escribe siempre en la primera.
const HOJAS_DE_VISUALIZADORES = ['clasificacion', 'tablero'];

// Una celda de Sheets admite hasta 50.000 caracteres.
const MAXIMO_CELDA = 50000;

// Topes para lo que llega del navegador.
const LIMITES = { textos: 300, stickers: 300, lineas: 600, largoTexto: 2000, largoEtiqueta: 300, coordenada: 1000000 };
const ID_VALIDO = /^[A-Za-z0-9_:-]{1,120}$/;
const TAMANOS_TEXTO = ['s', 'm', 'l'];
const COLORES_STICKER = ['rosa', 'celeste', 'amarillo', 'negro'];

// Las paletas de colores que se pueden elegir en la página.
const TEMAS = ['formal', 'girlie', 'oscura', 'infantil'];

// Columnas de la hoja de registro, por posición. Son las de ENCABEZADOS
// en el code.gs del formulario.
const COL = {
  FECHA: 0, CORREO: 1, NOMBRE: 2,
  LINEA: 3, FOLDER_LINEA: 4,
  CURSO: 5, FOLDER_CURSO: 6,
  ARCHIVO: 7, LINK: 8,
  TIPO: 9, CONTENIDO: 10, ENLACE: 11
};

/* Los nodos los define la carrera, no el estudiante. En el tablero cada
   uno es un círculo (núcleo y atmósfera) que se puede mover y agrandar,
   pero no borrar ni renombrar. Mientras la definición esté vacía, se muestra solo el título. */
const CATEGORIAS = [
  { clave: 'forma', titulo: 'Forma y materiales', definicion: '' },
  { clave: 'nudo', titulo: 'Nudo conceptual', definicion: '' },
  { clave: 'modos', titulo: 'Modos de hacer', definicion: '' }
];

/* El orden en que aparecen los cursos en la lista lateral. Un curso que
   no esté acá igual se muestra, al final. */
const LINEAS_CURRICULARES = [
  { linea: 'Talleres', cursos: [
    { nombre: 'Taller de operaciones y procedimientos visuales', semestre: 'S1-S2' },
    { nombre: 'Taller de prácticas artísticas I', semestre: 'S3' },
    { nombre: 'Taller de prácticas artísticas II', semestre: 'S4' }
  ] },
  { linea: 'Estudios visuales', cursos: [
    { nombre: 'Introducción a las vanguardias artísticas', semestre: 'S1' },
    { nombre: 'Introducción al arte contemporáneo', semestre: 'S2' },
    { nombre: 'Arte contemporáneo en Chile y Latinoamérica', semestre: 'S3' },
    { nombre: 'Teoría de la imagen', semestre: 'S4' }
  ] },
  { linea: 'Lenguajes artísticos', cursos: [
    { nombre: 'Dibujo y observación I', semestre: 'S1' },
    { nombre: 'Dibujo y observación II', semestre: 'S2' },
    { nombre: 'Técnicas escultóricas', semestre: 'S2' },
    { nombre: 'Técnicas pictóricas', semestre: 'S3' },
    { nombre: 'Lenguajes escultóricos', semestre: 'S3' },
    { nombre: 'Lenguajes pictóricos', semestre: 'S4' }
  ] },
  { linea: 'Imagen y tecnología', cursos: [
    { nombre: 'Medios gráficos', semestre: 'S1' },
    { nombre: 'Medios digitales', semestre: 'S2' },
    { nombre: 'Imagen fija', semestre: 'S3' },
    { nombre: 'Imagen en movimiento', semestre: 'S4' }
  ] },
  { linea: 'Gestión', cursos: [
    { nombre: 'Circuitos artísticos', semestre: 'S1' }
  ] }
];


/* =========================================================
   1. Servir la página
   Los datos van incrustados en el HTML en vez de pedirse
   después: Apps Script ya es lento de arrancar.
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


/* =========================================================
   2. Reunir lo que le toca a quien entró
   ========================================================= */

function reunirArchivo() {
  const correo = Session.getActiveUser().getEmail();

  if (!correo) {
    return conError('No pudimos identificar tu cuenta. Avisa al equipo.');
  }
  if (!planillaConfigurada()) {
    return conError('El visualizador todavía no está conectado a la planilla. ' +
      'Avisa al equipo.');
  }

  let obras;
  try {
    obras = obrasDe(correo);
  } catch (error) {
    // Al estudiante no le sirve el mensaje de Google: queda en el registro
    // de ejecuciones, y diagnostico() lo muestra entero.
    Logger.log('No se pudo leer la planilla: %s', error.message);
    return conError('No pudimos leer tu archivo. Avisa al equipo.');
  }

  return {
    error: '',
    correo: correo,
    nombre: obras.length > 0 ? obras[0].estudiante : '',
    urlCarpeta: urlDeCarpeta(obras),
    categorias: CATEGORIAS,
    lineas: LINEAS_CURRICULARES,
    obras: obras,
    guardar: GUARDAR_TABLERO,
    tablero: GUARDAR_TABLERO ? leerTablero(correo) : null
  };
}

// Lo mínimo para que la página muestre el aviso en vez de romperse.
function conError(mensaje) {
  return {
    error: mensaje, categorias: CATEGORIAS, lineas: LINEAS_CURRICULARES,
    obras: [], guardar: false, tablero: null
  };
}

function planillaConfigurada() {
  return SPREADSHEET_ID !== '' && SPREADSHEET_ID.indexOf('PEGA_AQUI') === -1;
}

// La pestaña donde escribe el formulario, que es siempre la primera. Si
// una pestaña de los visualizadores queda primera, el formulario empieza a
// escribir ahí; se corta con un mensaje que dice qué hacer.
function hojaDeRegistro() {
  const hoja = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];

  if (HOJAS_DE_VISUALIZADORES.indexOf(hoja.getName()) !== -1) {
    throw new Error('La pestaña "' + hoja.getName() + '" quedó primera en la ' +
      'planilla. Muévela al final: el formulario escribe siempre en la primera.');
  }
  return hoja;
}

// Todas las filas de la planilla que son de este correo.
function obrasDe(correo) {
  const filas = hojaDeRegistro().getDataRange().getValues();
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

// Saca el id de un enlace de Drive, sea de archivo o de carpeta.
function idDesdeUrl(url) {
  const encontrado = String(url || '').match(/(?:\/d\/|\/folders\/|[?&]id=)([A-Za-z0-9_-]+)/);
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

// Solo para filas viejas, anteriores a la columna "tipo".
function tipoSegunArchivo(nombreArchivo) {
  const nombre = String(nombreArchivo || '').toLowerCase();

  if (nombre.indexOf('imagen-') === 0) return 'imagen';
  if (nombre.indexOf('texto-') === 0) return 'texto';
  if (nombre.indexOf('video-') === 0) return 'youtube';

  if (nombre.slice(-4) === '.txt') return 'texto';
  if (nombre.slice(-4) === '.mp4' || nombre.slice(-4) === '.mov') return 'video';
  return 'imagen';
}

// La carpeta del estudiante es la que contiene a la de la línea, que
// contiene a la del curso.
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
   3. Tablero
   Una fila por estudiante: el tablero entero en JSON, y al lado
   la clasificación que se deduce de él ({ id: ['forma'] }),
   para poder leer en qué nodo quedó cada trabajo sin abrir el
   tablero.
   ========================================================= */

function hojaDelTablero() {
  const libro = SpreadsheetApp.openById(SPREADSHEET_ID);
  let hoja = libro.getSheetByName(HOJA_TABLERO);

  if (!hoja) {
    // Al final, con posición explícita: el formulario escribe en la primera.
    hoja = libro.insertSheet(HOJA_TABLERO, libro.getSheets().length);
    hoja.appendRow(ENCABEZADOS_TABLERO);
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

function leerTablero(correo) {
  try {
    const hoja = hojaDelTablero();
    const fila = filaDelCorreo(hoja, correo);
    if (fila === 0) return null;

    const texto = hoja.getRange(fila, 2).getValue();
    return texto ? JSON.parse(texto) : null;

  } catch (error) {
    Logger.log('No se pudo leer el tablero: %s', error.message);
    return null;
  }
}

/* Recibe { tablero: {...}, clasificacion: { id: ['forma'] } } y lo guarda
   entero. El cliente manda siempre todo: la última escritura es la verdad. */
function guardarTablero(datos) {
  if (!GUARDAR_TABLERO) return { exito: false, mensaje: 'El guardado está desactivado.' };

  const correo = Session.getActiveUser().getEmail();
  if (!correo) return { exito: false, mensaje: 'No pudimos identificar tu cuenta.' };

  const tablero = JSON.stringify(limpiarTablero(datos && datos.tablero));
  const clasificacion = JSON.stringify(limpiarMapa(datos && datos.clasificacion));

  if (tablero.length > MAXIMO_CELDA || clasificacion.length > MAXIMO_CELDA) {
    return { exito: false, mensaje: 'El tablero es demasiado grande para guardarse ' +
      '(' + tablero.length + ' caracteres; el máximo es ' + MAXIMO_CELDA + ').' };
  }

  // Dos pestañas del mismo estudiante no deben pisarse a medio escribir.
  const cerrojo = LockService.getUserLock();

  try {
    cerrojo.waitLock(10000);

    const hoja = hojaDelTablero();
    const fila = filaDelCorreo(hoja, correo);
    const valores = [tablero, clasificacion, new Date()];

    if (fila === 0) hoja.appendRow([correo].concat(valores));
    else hoja.getRange(fila, 2, 1, 3).setValues([valores]);

    return { exito: true };

  } catch (error) {
    Logger.log('No se pudo guardar el tablero: %s', error.message);
    return { exito: false, mensaje: error.message };

  } finally {
    cerrojo.releaseLock();
  }
}

/* Deja pasar solo la forma esperada, con topes. No se revisa que los ids
   de trabajos sean del estudiante: solo afecta su propia fila. */
function limpiarTablero(t) {
  t = esObjeto(t) ? t : {};
  const limpio = { nodos: {}, fichas: {}, textos: [], stickers: [], lineas: [], vista: null, tema: 'formal' };

  CATEGORIAS.forEach(function (categoria) {
    const n = esObjeto(t.nodos) ? t.nodos[categoria.clave] : null;
    if (sonNumeros(n, ['x', 'y', 'w', 'h'])) {
      limpio.nodos[categoria.clave] = {
        x: coordenada(n.x), y: coordenada(n.y), w: medida(n.w), h: medida(n.h)
      };
    }
  });

  const fichas = esObjeto(t.fichas) ? t.fichas : {};
  Object.keys(fichas).forEach(function (id) {
    const f = fichas[id];
    if (ID_VALIDO.test(id) && sonNumeros(f, ['x', 'y', 'w'])) {
      limpio.fichas[id] = { x: coordenada(f.x), y: coordenada(f.y), w: medida(f.w) };
    }
  });

  (Array.isArray(t.textos) ? t.textos : []).slice(0, LIMITES.textos).forEach(function (x) {
    if (!esObjeto(x) || !ID_VALIDO.test(String(x.id)) || !sonNumeros(x, ['x', 'y', 'w'])) return;
    limpio.textos.push({
      id: String(x.id),
      x: coordenada(x.x), y: coordenada(x.y), w: medida(x.w),
      texto: String(x.texto || '').slice(0, LIMITES.largoTexto),
      tam: TAMANOS_TEXTO.indexOf(x.tam) !== -1 ? x.tam : 'm'
    });
  });

  (Array.isArray(t.stickers) ? t.stickers : []).slice(0, LIMITES.stickers).forEach(function (s) {
    if (!esObjeto(s) || !ID_VALIDO.test(String(s.id)) || !sonNumeros(s, ['x', 'y', 'w'])) return;
    limpio.stickers.push({
      id: String(s.id),
      x: coordenada(s.x), y: coordenada(s.y), w: medida(s.w),
      color: COLORES_STICKER.indexOf(s.color) !== -1 ? s.color : 'rosa'
    });
  });

  if (TEMAS.indexOf(t.tema) !== -1) limpio.tema = t.tema;

  const idsDeTextos = limpio.textos.map(function (x) { return x.id; });
  const existe = function (ref) {
    ref = String(ref || '');
    const id = ref.slice(2);
    if (ref.indexOf('o:') === 0) return limpio.fichas.hasOwnProperty(id);
    if (ref.indexOf('t:') === 0) return idsDeTextos.indexOf(id) !== -1;
    return false;
  };

  (Array.isArray(t.lineas) ? t.lineas : []).slice(0, LIMITES.lineas).forEach(function (l) {
    if (!esObjeto(l) || !ID_VALIDO.test(String(l.id))) return;
    if (!existe(l.de) || !existe(l.a) || l.de === l.a) return;
    limpio.lineas.push({
      id: String(l.id), de: String(l.de), a: String(l.a),
      flecha: l.flecha !== false, punteada: l.punteada === true,
      texto: String(l.texto || '').slice(0, LIMITES.largoEtiqueta)
    });
  });

  if (sonNumeros(t.vista, ['cx', 'cy', 'z'])) {
    limpio.vista = {
      cx: coordenada(t.vista.cx), cy: coordenada(t.vista.cy),
      z: Math.min(4, Math.max(0.05, t.vista.z))
    };
  }

  return limpio;
}

// Solo se aceptan claves de nodo que existan, y sin repetir.
function limpiarMapa(mapa) {
  const validas = CATEGORIAS.map(function (categoria) { return categoria.clave; });
  const limpio = {};

  Object.keys(esObjeto(mapa) ? mapa : {}).forEach(function (id) {
    if (!ID_VALIDO.test(id) || !Array.isArray(mapa[id])) return;
    const claves = mapa[id].filter(function (clave, i, lista) {
      return validas.indexOf(clave) !== -1 && lista.indexOf(clave) === i;
    });
    if (claves.length > 0) limpio[id] = claves;
  });

  return limpio;
}

function esObjeto(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

function sonNumeros(objeto, campos) {
  return esObjeto(objeto) && campos.every(function (campo) {
    return typeof objeto[campo] === 'number' && isFinite(objeto[campo]);
  });
}

// Un decimal alcanza y ahorra espacio en la celda.
function coordenada(valor) {
  const tope = LIMITES.coordenada;
  return Math.round(Math.min(tope, Math.max(-tope, valor)) * 10) / 10;
}

function medida(valor) {
  return Math.round(Math.min(20000, Math.max(20, valor)) * 10) / 10;
}


/* =========================================================
   4. Diagnóstico
   Se ejecuta a mano desde el editor, sin argumentos.
   ========================================================= */

function diagnostico() {
  if (!planillaConfigurada()) {
    Logger.log('Falta el id de la planilla: reemplaza SPREADSHEET_ID al comienzo de code.gs.');
    return;
  }

  const correo = Session.getActiveUser().getEmail();
  Logger.log('Correo de la sesión: "%s"', correo);

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

    const tablero = leerTablero(correo);
    if (!tablero) Logger.log('Todavía no tiene tablero guardado.');
    else Logger.log('Tablero: %s trabajos puestos, %s textos, %s líneas.',
      Object.keys(tablero.fichas || {}).length,
      (tablero.textos || []).length, (tablero.lineas || []).length);

  } catch (error) {
    Logger.log('Falló al leer la planilla: %s', error.message);
  }
}

/* Prueba la escritura sin cambiar nada: lee el tablero de quien lo ejecuta
   y lo vuelve a guardar igual. Si la lectura falla se detiene antes de
   escribir, para no reemplazar lo guardado por un tablero vacío. */
function probarGuardado() {
  const correo = Session.getActiveUser().getEmail();
  Logger.log('Correo de la sesión: "%s"', correo);

  let actual;
  let clasificacion;
  try {
    const hoja = hojaDelTablero();
    Logger.log('Pestaña "%s" encontrada, con %s filas.', hoja.getName(), hoja.getLastRow());
    const fila = filaDelCorreo(hoja, correo);
    const texto = fila ? hoja.getRange(fila, 2).getValue() : '';
    const mapa = fila ? hoja.getRange(fila, 3).getValue() : '';
    actual = texto ? JSON.parse(texto) : {};
    clasificacion = mapa ? JSON.parse(mapa) : {};
    Logger.log('Tablero actual: %s trabajos puestos.', Object.keys(actual.fichas || {}).length);

  } catch (error) {
    Logger.log('Falló al leer la pestaña del tablero: %s', error.message);
    return;
  }

  Logger.log('Resultado de guardar: %s',
    JSON.stringify(guardarTablero({ tablero: actual, clasificacion: clasificacion })));
}
