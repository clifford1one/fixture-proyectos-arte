  /* =========================================================
    Visualizador del archivo de prácticas — backend

    Proyecto de Apps Script aparte del formulario, apuntando a la
    misma planilla. Cada estudiante ve solo sus propios trabajos y
    los reparte entre los tres nodos arrastrándolos a los círculos.

    Son dos archivos, los mismos dos que existen en Apps Script:
    este y index.html, que trae marcado, estilo y script juntos.
    ========================================================= */

  // La planilla donde escribe el formulario: el id es lo que va entre /d/ y
  // /edit en su dirección. Es la de formulario-v1; formulario-v2 apunta a
  // otra, y lo que se suba por ese no va a aparecer acá hasta que los dos
  // usen la misma.
  const SPREADSHEET_ID = '1sCBmSOlLlYEPLNkS0hVT8QOzIi0fc7BENiqfaVwwoZI';

  // Hoja donde se guarda la clasificación. Se crea sola la primera vez.
  // "ocultos" viene del visualizador v4: esta versión no la usa, pero la
  // deja intacta para que las dos puedan convivir sobre la misma planilla.
  const HOJA_CLASIFICACION = 'clasificacion';
  const ENCABEZADOS_CLASIFICACION = ['correo', 'clasificacion', 'actualizado', 'ocultos'];

  // Columnas de la hoja de registro, por posición. Son las de ENCABEZADOS
  // en el code.gs del formulario.
  const COL = {
    FECHA: 0, CORREO: 1, NOMBRE: 2,
    LINEA: 3, FOLDER_LINEA: 4,
    CURSO: 5, FOLDER_CURSO: 6,
    ARCHIVO: 7, LINK: 8,
    TIPO: 9, CONTENIDO: 10, ENLACE: 11
  };

  /* Los nodos los define la carrera, no el estudiante. Viven en el
    servidor para poder validar contra ellos lo que llega del cliente.
    Mientras la definición esté vacía, el nodo se muestra solo con su
    título. */
  const CATEGORIAS = [
    { clave: 'forma', titulo: 'Forma y materiales', definicion: '' },
    { clave: 'nudo', titulo: 'Nudo conceptual', definicion: '' },
    { clave: 'modos', titulo: 'Modos de hacer', definicion: '' }
  ];

  /* El orden en que aparecen los cursos en la lista lateral. Es la misma
    estructura del formulario, sin los códigos: acá solo importa el orden.
    Un curso que no esté acá (renombrado, o escrito a mano en la planilla)
    igual se muestra, al final. */
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
      clasificacion: leerClasificacion(correo)
    };
  }

  // Lo mínimo para que la página muestre el aviso en vez de romperse.
  function conError(mensaje) {
    return {
      error: mensaje, categorias: CATEGORIAS, lineas: LINEAS_CURRICULARES,
      obras: [], clasificacion: {}
    };
  }

  function planillaConfigurada() {
    return SPREADSHEET_ID !== '' && SPREADSHEET_ID.indexOf('PEGA_AQUI') === -1;
  }

  // La pestaña donde escribe el formulario, que es siempre la primera: no la
  // busca por nombre. Si "clasificacion" queda primera, el formulario empieza
  // a escribir ahí, y leerla como registro mostraría un archivo vacío sin
  // ninguna pista. Se corta con un mensaje que dice qué hacer.
  function hojaDeRegistro() {
    const hoja = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];

    if (hoja.getName() === HOJA_CLASIFICACION) {
      throw new Error('La pestaña "' + HOJA_CLASIFICACION + '" quedó primera en la ' +
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

  // Saca el id de un enlace de Drive. Archivos y carpetas lo traen en
  // lugares distintos:
  //   https://drive.google.com/file/d/ABC123/view?usp=drivesdk
  //   https://drive.google.com/drive/folders/ABC123
  //   https://drive.google.com/open?id=ABC123
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

    // Los nombres nuevos empiezan por el tipo: imagen-ART03113-juanPerez-01.webp
    if (nombre.indexOf('imagen-') === 0) return 'imagen';
    if (nombre.indexOf('texto-') === 0) return 'texto';
    if (nombre.indexOf('video-') === 0) return 'youtube';

    // Los viejos solo tienen la extensión.
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
    3. Clasificación en nodos
    Una fila por estudiante, con su mapa de nodos en JSON. Así
    guardar es escribir dos celdas y no reescribir la hoja.
    ========================================================= */

  function hojaDeClasificacion() {
    const libro = SpreadsheetApp.openById(SPREADSHEET_ID);
    let hoja = libro.getSheetByName(HOJA_CLASIFICACION);

    if (!hoja) {
      // Al final, con posición explícita: el formulario escribe en la primera
      // pestaña, y esta no puede quedar en su lugar.
      hoja = libro.insertSheet(HOJA_CLASIFICACION, libro.getSheets().length);
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

  // En qué nodos dejó el estudiante cada trabajo: { idDeArchivo: ['forma'] }.
  function leerClasificacion(correo) {
    try {
      const hoja = hojaDeClasificacion();
      const fila = filaDelCorreo(hoja, correo);
      if (fila === 0) return {};

      const texto = hoja.getRange(fila, 2).getValue();
      return texto ? JSON.parse(texto) : {};

    } catch (error) {
      Logger.log('No se pudo leer la clasificación: %s', error.message);
      return {};
    }
  }

  /* Recibe { idDeArchivo: ['forma', 'nudo'], ... } y lo guarda entero. El
    cliente manda siempre todo, así que no hay que fusionar nada: la última
    escritura es la verdad. */
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

      // Solo clasificacion y actualizado: la columna de ocultos no se toca.
      if (fila === 0) hoja.appendRow([correo, limpio, new Date(), '']);
      else hoja.getRange(fila, 2, 1, 2).setValues([[limpio, new Date()]]);

      return { exito: true };

    } catch (error) {
      Logger.log('No se pudo guardar la clasificación: %s', error.message);
      return { exito: false, mensaje: error.message };

    } finally {
      cerrojo.releaseLock();
    }
  }

  // Solo se aceptan claves de nodo que existan, y sin repetir. No se revisa
  // que los ids sean trabajos del estudiante: solo afecta su propia fila.
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
    if (!planillaConfigurada()) {
      Logger.log('Falta el id de la planilla: reemplaza SPREADSHEET_ID al comienzo de code.gs.');
      return;
    }

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

  /* Prueba la escritura sin cambiar nada: lee la clasificación de quien lo
    ejecuta y la vuelve a guardar igual. Si la lectura falla se detiene
    antes de escribir, para no reemplazar lo guardado por un mapa vacío. */
  function probarGuardado() {
    const correo = Session.getActiveUser().getEmail();
    Logger.log('Correo de la sesión: "%s"', correo);

    let actual;
    try {
      const hoja = hojaDeClasificacion();
      Logger.log('Pestaña "%s" encontrada, con %s filas.', hoja.getName(), hoja.getLastRow());
      const fila = filaDelCorreo(hoja, correo);
      const texto = fila ? hoja.getRange(fila, 2).getValue() : '';
      actual = texto ? JSON.parse(texto) : {};
      Logger.log('Clasificación actual: %s trabajos.', Object.keys(actual).length);

    } catch (error) {
      Logger.log('Falló al leer la pestaña de clasificación: %s', error.message);
      return;
    }

    Logger.log('Resultado de guardar: %s', JSON.stringify(guardarClasificacion(actual)));
  }
