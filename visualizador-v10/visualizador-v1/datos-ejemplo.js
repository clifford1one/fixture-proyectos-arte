/* =========================================================
   Datos de ejemplo
   Solo para abrir index.html suelto y ver la página sin
   desplegarla. En Apps Script este archivo no se incluye:
   doGet() inyecta los datos de verdad.

   Los ids son falsos, así que Drive no devuelve miniatura y
   cada trabajo queda como un rectángulo gris — que es
   justamente lo que se quiere para revisar la maqueta.
   ========================================================= */

const DATOS_EJEMPLO = (function () {
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

  // [línea, curso, código, tipo]
  const CRUDO = [
    ['Talleres', 'Taller de operaciones y procedimientos visuales', 'ART03111', 'imagen'],
    ['Talleres', 'Taller de operaciones y procedimientos visuales', 'ART03111', 'imagen'],
    ['Talleres', 'Taller de operaciones y procedimientos visuales', 'ART03111', 'texto'],
    ['Talleres', 'Taller de prácticas artísticas I', 'ART03211', 'imagen'],
    ['Talleres', 'Taller de prácticas artísticas I', 'ART03211', 'imagen'],
    ['Talleres', 'Taller de prácticas artísticas I', 'ART03211', 'imagen'],
    ['Talleres', 'Taller de prácticas artísticas II', 'ART03221', 'imagen'],
    ['Talleres', 'Taller de prácticas artísticas II', 'ART03221', 'texto'],
    ['Estudios visuales', 'Introducción a las vanguardias artísticas', 'ART03112', 'imagen'],
    ['Estudios visuales', 'Introducción a las vanguardias artísticas', 'ART03112', 'texto'],
    ['Estudios visuales', 'Introducción al arte contemporáneo', 'ART03122', 'imagen'],
    ['Estudios visuales', 'Introducción al arte contemporáneo', 'ART03122', 'imagen'],
    ['Estudios visuales', 'Arte contemporáneo en Chile y Latinoamérica', 'ART03212', 'texto'],
    ['Estudios visuales', 'Teoría de la imagen', 'ART03222', 'imagen'],
    ['Estudios visuales', 'Teoría de la imagen', 'ART03222', 'texto'],
    ['Lenguajes artísticos', 'Dibujo y observación I', 'ART03113', 'imagen'],
    ['Lenguajes artísticos', 'Dibujo y observación I', 'ART03113', 'imagen'],
    ['Lenguajes artísticos', 'Dibujo y observación I', 'ART03113', 'imagen'],
    ['Lenguajes artísticos', 'Dibujo y observación II', 'ART03123', 'imagen'],
    ['Lenguajes artísticos', 'Dibujo y observación II', 'ART03123', 'imagen'],
    ['Lenguajes artísticos', 'Técnicas escultóricas', 'ART03124', 'imagen'],
    ['Lenguajes artísticos', 'Técnicas escultóricas', 'ART03124', 'imagen'],
    ['Lenguajes artísticos', 'Técnicas escultóricas', 'ART03124', 'texto'],
    ['Lenguajes artísticos', 'Técnicas pictóricas', 'ART03213', 'imagen'],
    ['Lenguajes artísticos', 'Técnicas pictóricas', 'ART03213', 'imagen'],
    ['Lenguajes artísticos', 'Lenguajes escultóricos', 'ART03214', 'imagen'],
    ['Lenguajes artísticos', 'Lenguajes escultóricos', 'ART03214', 'imagen'],
    ['Lenguajes artísticos', 'Lenguajes pictóricos', 'ART03223', 'imagen'],
    ['Lenguajes artísticos', 'Lenguajes pictóricos', 'ART03223', 'imagen'],
    ['Imagen y tecnología', 'Medios gráficos', 'ART03114', 'imagen'],
    ['Imagen y tecnología', 'Medios gráficos', 'ART03114', 'imagen'],
    ['Imagen y tecnología', 'Medios digitales', 'ART03125', 'imagen'],
    ['Imagen y tecnología', 'Medios digitales', 'ART03125', 'youtube'],
    ['Imagen y tecnología', 'Imagen fija', 'ART03215', 'imagen'],
    ['Imagen y tecnología', 'Imagen fija', 'ART03215', 'imagen'],
    ['Imagen y tecnología', 'Imagen en movimiento', 'ART03224', 'video'],
    ['Imagen y tecnología', 'Imagen en movimiento', 'ART03224', 'youtube'],
    ['Imagen y tecnología', 'Imagen en movimiento', 'ART03224', 'imagen'],
    ['Gestión', 'Circuitos artísticos', 'ART03115', 'imagen'],
    ['Gestión', 'Circuitos artísticos', 'ART03115', 'texto']
  ];

  const TEXTOS = [
    'Anoté la hora en que la luz tocaba el muro. A las 17:40 ya no estaba.',
    'El material recuerda la forma que tuvo antes de ser material.',
    '«El dibujo es la probidad del arte.» — Ingres',
    'Trabajé sobre el reverso. Lo que se ve es lo que quedó del otro lado.',
    '«Toda fotografía es un certificado de presencia.» — Roland Barthes',
    'No es un registro del taller: es lo que el taller dejó en el papel.',
    'Repetí el mismo gesto treinta veces para ver dónde se rompía.',
    'La escala la decidió el ancho de la mesa, no yo.'
  ];

  const EXTENSION = { imagen: 'webp', texto: 'txt', video: 'mp4', youtube: 'jpg' };

  // En el nombre del archivo los de YouTube van como "video".
  const NOMBRE_TIPO = { imagen: 'imagen', texto: 'texto', video: 'video', youtube: 'video' };
  let cuentaTexto = 0;

  // Videos reales, para poder ver el embed funcionando al abrir el
  // archivo suelto. Cámbialos por los que quieras probar.
  const VIDEOS = ['A1_u4n5Cz2w', 'aqz-KE-bpKQ'];
  let cuentaVideo = 0;

  const obras = CRUDO.map(function (fila, i) {
    const numero = String(i + 1).padStart(2, '0');
    const tipo = fila[3];
    const idVideo = tipo === 'youtube' ? VIDEOS[cuentaVideo++ % VIDEOS.length] : '';

    return {
      // Un video de YouTube se identifica por el video, no por un archivo.
      id: idVideo ? ('yt:' + idVideo) : ('ejemplo-' + numero),
      estudiante: 'Camila Ferrada',
      linea: fila[0],
      curso: fila[1],
      archivo: NOMBRE_TIPO[tipo] + '-' + fila[2] + '-camilaFerrada-' + numero +
        '.' + EXTENSION[tipo],
      tipo: tipo,
      contenido: tipo === 'texto' ? TEXTOS[cuentaTexto++ % TEXTOS.length] : '',
      idVideo: idVideo,
      // Sin portada guardada: cae a la miniatura que sirve YouTube.
      portada: '',
      urlCurso: ''
    };
  });

  return {
    error: '',
    correo: 'camila.ferrada@ejemplo.cl',
    nombre: 'Camila Ferrada',
    urlCarpeta: '',
    categorias: CATEGORIAS,
    lineas: ['Talleres', 'Estudios visuales', 'Lenguajes artísticos',
             'Imagen y tecnología', 'Gestión'],
    obras: obras,
    clasificacion: {}
  };
})();
