/* =========================================================
   1. Estructura curricular
   Editar aquí para agregar, quitar o renombrar cursos.
   ========================================================= */
const LINEAS_CURRICULARES = {
    "Talleres": [
        { nombre: "Taller de operaciones y procedimientos visuales", semestre: "S1-S2" },
        { nombre: "Taller de prácticas artísticas I", semestre: "S3" },
        { nombre: "Taller de prácticas artísticas II", semestre: "S4" }
    ],
    "Estudios visuales": [
        { nombre: "Introducción a las vanguardias artísticas", semestre: "S1" },
        { nombre: "Introducción al arte contemporáneo", semestre: "S2" },
        { nombre: "Arte contemporáneo en Chile y Latinoamérica", semestre: "S3" },
        { nombre: "Teoría de la imagen", semestre: "S4" }
    ],
    "Lenguajes artísticos": [
        { nombre: "Dibujo y observación", semestre: "S1" },
        { nombre: "Dibujo y observación II", semestre: "S2" },
        { nombre: "Técnicas escultóricas", semestre: "S2" },
        { nombre: "Técnicas pictóricas", semestre: "S3" },
        { nombre: "Lenguajes escultóricos", semestre: "S3" },
        { nombre: "Lenguajes pictóricos", semestre: "S4" }
    ],
    "Imagen y tecnología": [
        { nombre: "Medios gráficos", semestre: "S1" },
        { nombre: "Medios digitales", semestre: "S2" },
        { nombre: "Imagen fija", semestre: "S3" },
        { nombre: "Imagen en movimiento", semestre: "S4" }
    ],
    "Gestión": [
        { nombre: "Circuitos artísticos", semestre: "S1" }
    ]
};

/* =========================================================
   2. Reglas de validación de archivos
   ========================================================= */
const TIPOS_PERMITIDOS = ["image/png", "image/jpeg"];
const EXTENSIONES_PERMITIDAS = ["png", "jpg", "jpeg"];
const PESO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10 MB por imagen

// Compresión en el navegador, antes de enviar.
const LADO_MAXIMO = 2000;      // píxeles del lado mayor
const CALIDAD_WEBP = 0.85;

/* =========================================================
   3. Estado y referencias del DOM
   ========================================================= */

// Un bloque por curso. Cada uno:
// { id, nodo, selectCurso, inputArchivos, grilla, resumen, titulo, botonQuitar, imagenes }
let bloques = [];
let ultimoIdBloque = 0;

// Imágenes de un bloque. Cada una:
// { id, archivo, valido, motivo, urlVista, estado, mensajeEstado, pesoComprimido, nodo }
// estado: "pendiente" | "subiendo" | "subida" | "error"
let ultimoId = 0;

// Bloquea el formulario mientras se está subiendo una tanda.
let subidaEnCurso = false;

const campoNombre = document.getElementById("nombre");
const botonEnviar = document.getElementById("enviar");
const avisoEnvio = document.getElementById("aviso-envio");
const formulario = document.getElementById("formulario");

const contenedorBloques = document.getElementById("bloques");
const plantillaBloque = document.getElementById("plantilla-bloque");
const botonAgregarBloque = document.getElementById("agregar-bloque");

const barra = document.getElementById("barra");
const barraAvance = document.getElementById("barra-avance");

const ayudaNombre = document.getElementById("ayuda-nombre");

const pantallaGracias = document.getElementById("pantalla-gracias");
const graciasDetalle = document.getElementById("gracias-detalle");
const graciasEnlace = document.getElementById("gracias-enlace");
const graciasNota = document.getElementById("gracias-nota");
const botonSubirMas = document.getElementById("subir-mas");

/* =========================================================
   4. Select de cursos
   Solo se pregunta el curso: la línea curricular se deduce
   de la estructura, así que no hace falta pedirla.
   ========================================================= */

function crearOpcion(valor, texto) {
    const opcion = document.createElement("option");
    opcion.value = valor;
    opcion.textContent = texto;
    return opcion;
}

// Carga todos los cursos en un select, agrupados por línea.
function cargarCursos(select) {
    Object.keys(LINEAS_CURRICULARES).forEach(function (linea) {
        const grupo = document.createElement("optgroup");
        grupo.label = linea;

        LINEAS_CURRICULARES[linea].forEach(function (curso) {
            const etiqueta = curso.nombre + " (" + curso.semestre + ")";
            grupo.appendChild(crearOpcion(curso.nombre, etiqueta));
        });

        select.appendChild(grupo);
    });
}

// Devuelve la línea curricular a la que pertenece un curso.
function buscarLineaDeCurso(nombreCurso) {
    const lineas = Object.keys(LINEAS_CURRICULARES);

    for (let i = 0; i < lineas.length; i++) {
        const pertenece = LINEAS_CURRICULARES[lineas[i]].some(function (curso) {
            return curso.nombre === nombreCurso;
        });
        if (pertenece) return lineas[i];
    }
    return "";
}

/* =========================================================
   5. Bloques de curso
   Cada bloque es una copia de la plantilla con su propio
   curso, su input de archivos y su grilla.
   ========================================================= */

function crearBloque() {
    const copia = plantillaBloque.content.cloneNode(true);
    const nodo = copia.querySelector(".bloque");
    const numero = ++ultimoIdBloque;

    const bloque = {
        id: numero,
        nodo: nodo,
        selectCurso: nodo.querySelector(".curso"),
        inputArchivos: nodo.querySelector(".imagenes"),
        grilla: nodo.querySelector(".grilla"),
        resumen: nodo.querySelector(".resumen"),
        titulo: nodo.querySelector(".bloque-titulo"),
        botonQuitar: nodo.querySelector(".bloque-quitar"),
        avisoCurso: nodo.querySelector(".aviso-curso"),
        imagenes: []
    };

    // La etiqueta necesita un id único porque hay varios bloques a la vez.
    bloque.selectCurso.id = "curso-" + numero;
    nodo.querySelector(".etiqueta-curso").setAttribute("for", bloque.selectCurso.id);

    cargarCursos(bloque.selectCurso);

    bloque.selectCurso.addEventListener("change", function () {
        ponerTitulo(bloque);
        actualizarEstadoEnvio();
    });

    bloque.inputArchivos.addEventListener("change", function (evento) {
        agregarImagenes(bloque, evento.target.files);
        // Limpiamos el input para poder volver a elegir el mismo archivo si se quitó.
        evento.target.value = "";
    });

    bloque.botonQuitar.addEventListener("click", function () { quitarBloque(bloque); });

    bloques.push(bloque);
    contenedorBloques.appendChild(nodo);

    ponerTitulo(bloque);
    actualizarEstadoEnvio();
    return bloque;
}

// El título del bloque muestra el curso elegido, para no perderse con varios abiertos.
function ponerTitulo(bloque) {
    bloque.titulo.textContent = bloque.selectCurso.value || "Curso sin elegir";
}

function quitarBloque(bloque) {
    bloque.imagenes.forEach(soltarVistaPrevia);
    bloque.nodo.remove();
    bloques = bloques.filter(function (otro) { return otro !== bloque; });

    // Siempre queda al menos un bloque en pantalla.
    if (bloques.length === 0) crearBloque();

    avisoEnvio.textContent = "";
    actualizarEstadoEnvio();
}

// Pone al día lo que depende del estado general: botones y avisos de cada bloque.
function refrescarBloques() {
    bloques.forEach(function (bloque) {
        // El botón de quitar no tiene sentido cuando hay un solo bloque.
        bloque.botonQuitar.hidden = bloques.length === 1;
        bloque.botonQuitar.disabled = subidaEnCurso;
        bloque.selectCurso.disabled = subidaEnCurso;
        bloque.inputArchivos.disabled = subidaEnCurso;

        // Con imágenes puestas y sin curso, el bloque no se puede enviar: hay que decirlo.
        bloque.avisoCurso.hidden =
            bloque.selectCurso.value !== "" || porSubirEn(bloque).length === 0;
    });
}

function soltarVistaPrevia(item) {
    if (item.urlVista) URL.revokeObjectURL(item.urlVista);
}

// Todas las imágenes de todos los bloques, en una sola lista.
function todasLasImagenes() {
    return bloques.reduce(function (acumulado, bloque) {
        return acumulado.concat(bloque.imagenes);
    }, []);
}


/* =========================================================
   6. Validación e incorporación de imágenes
   ========================================================= */

// Devuelve la extensión en minúsculas, o cadena vacía si no tiene.
function obtenerExtension(nombreArchivo) {
    const partes = nombreArchivo.split(".");
    return partes.length > 1 ? partes.pop().toLowerCase() : "";
}

// Revisa formato y peso. Devuelve el motivo del rechazo, o null si está bien.
function motivoDeRechazo(archivo) {
    const extension = obtenerExtension(archivo.name);
    const formatoValido =
        TIPOS_PERMITIDOS.indexOf(archivo.type) !== -1 ||
        EXTENSIONES_PERMITIDAS.indexOf(extension) !== -1;

    if (!formatoValido) {
        return "Formato no admitido: solo PNG, JPG o JPEG.";
    }
    if (archivo.size > PESO_MAXIMO_BYTES) {
        return "Pesa " + formatearPeso(archivo.size) + ", el máximo es 10 MB.";
    }
    return null;
}

// Evita repetir un archivo en el mismo bloque, comparando nombre, peso y fecha.
function yaEstaElegido(bloque, archivo) {
    return bloque.imagenes.some(function (item) {
        return item.archivo.name === archivo.name &&
            item.archivo.size === archivo.size &&
            item.archivo.lastModified === archivo.lastModified;
    });
}

// Suma archivos nuevos al bloque, sin tocar los que ya estaban.
function agregarImagenes(bloque, listaArchivos) {
    let omitidos = 0;

    Array.prototype.forEach.call(listaArchivos, function (archivo) {
        if (yaEstaElegido(bloque, archivo)) {
            omitidos++;
            return;
        }

        const motivo = motivoDeRechazo(archivo);

        bloque.imagenes.push({
            id: ++ultimoId,
            archivo: archivo,
            valido: motivo === null,
            motivo: motivo,
            // Solo pedimos vista previa si el navegador puede dibujar el archivo.
            urlVista: archivo.type.indexOf("image/") === 0 ? URL.createObjectURL(archivo) : null,
            estado: "pendiente",
            mensajeEstado: "",
            pesoComprimido: null, // se conoce recién al comprimir, antes de enviar
            nodo: null
        });
    });

    avisoEnvio.textContent = omitidos > 0
        ? "Se omitieron " + omitidos + " imagen(es) que ya estaban en ese curso."
        : "";

    dibujarGrilla(bloque);
    actualizarEstadoEnvio();
}

// Saca una imagen del bloque y libera su vista previa.
function quitarImagen(bloque, id) {
    const indice = bloque.imagenes.findIndex(function (item) { return item.id === id; });
    if (indice === -1) return;

    soltarVistaPrevia(bloque.imagenes[indice]);
    bloque.imagenes.splice(indice, 1);

    avisoEnvio.textContent = "";
    dibujarGrilla(bloque);
    actualizarEstadoEnvio();
}

/* =========================================================
   7. Grilla de previsualizaciones
   ========================================================= */

function formatearPeso(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function dibujarGrilla(bloque) {
    bloque.grilla.innerHTML = "";
    bloque.imagenes.forEach(function (item) {
        bloque.grilla.appendChild(crearMiniatura(bloque, item));
    });
    actualizarResumen(bloque);
}

function crearMiniatura(bloque, item) {
    const figura = document.createElement("figure");
    figura.className = "miniatura " + claseSegunEstado(item);

    figura.appendChild(crearLienzo(item));
    figura.appendChild(crearDatos(item));
    figura.appendChild(crearBotonQuitar(bloque, item));

    // Guardamos el nodo para poder repintar solo esta miniatura.
    item.nodo = figura;
    return figura;
}

function claseSegunEstado(item) {
    if (!item.valido) return "rechazada";
    if (item.estado === "subiendo") return "subiendo";
    if (item.estado === "subida") return "subida";
    if (item.estado === "error") return "con-error";
    return "";
}

// Vuelve a dibujar una sola miniatura, sin rehacer toda la grilla.
function repintarMiniatura(bloque, item) {
    if (!item.nodo) return;
    item.nodo.replaceWith(crearMiniatura(bloque, item));
}

// Cuadrado con la imagen o, si no se puede previsualizar, un aviso.
function crearLienzo(item) {
    const lienzo = document.createElement("div");
    lienzo.className = "lienzo";

    if (item.urlVista) {
        const imagen = document.createElement("img");
        imagen.src = item.urlVista;
        imagen.alt = item.archivo.name;
        imagen.loading = "lazy";
        lienzo.appendChild(imagen);
    } else {
        const aviso = document.createElement("span");
        aviso.className = "sin-vista";
        aviso.textContent = "Sin vista previa";
        lienzo.appendChild(aviso);
    }

    return lienzo;
}

// Nombre, peso y, cuando corresponde, motivo del rechazo.
function crearDatos(item) {
    const datos = document.createElement("figcaption");
    datos.className = "datos";

    const nombreArchivo = document.createElement("p");
    nombreArchivo.className = "nombre-archivo";
    nombreArchivo.textContent = item.archivo.name;
    datos.appendChild(nombreArchivo);

    const peso = document.createElement("p");
    peso.className = "peso";
    peso.textContent = textoDePeso(item);
    datos.appendChild(peso);

    if (!item.valido) {
        const motivo = document.createElement("p");
        motivo.className = "motivo";
        motivo.textContent = "Rechazada — " + item.motivo;
        datos.appendChild(motivo);
    } else if (item.estado !== "pendiente") {
        const estado = document.createElement("p");
        estado.className = "estado";
        estado.textContent = textoDeEstado(item);
        datos.appendChild(estado);
    }

    return datos;
}

// Muestra el peso original y, cuando ya se comprimió, también el nuevo.
function textoDePeso(item) {
    const original = formatearPeso(item.archivo.size);

    if (item.pesoComprimido === null) return original;
    return original + " → " + formatearPeso(item.pesoComprimido) + " WebP";
}

function textoDeEstado(item) {
    if (item.estado === "subiendo") return "Subiendo…";
    if (item.estado === "error") return "Error — " + item.mensajeEstado;

    if (item.estado === "subida") {
        return item.errorPlanilla
            ? "✓ Subida a Drive, pero no quedó registrada en la planilla"
            : "✓ Subida a Drive";
    }
    return "";
}

function crearBotonQuitar(bloque, item) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "quitar";
    boton.textContent = "×";
    boton.title = "Quitar " + item.archivo.name;
    boton.setAttribute("aria-label", "Quitar " + item.archivo.name);
    boton.disabled = subidaEnCurso; // no se toca la lista mientras se sube
    boton.addEventListener("click", function () { quitarImagen(bloque, item.id); });
    return boton;
}

function actualizarResumen(bloque) {
    if (bloque.imagenes.length === 0) {
        bloque.resumen.textContent = "";
        return;
    }

    const partes = [];
    const pendientes = contarPorEstado(bloque, "pendiente");
    const subidas = contarPorEstado(bloque, "subida");
    const conError = contarPorEstado(bloque, "error");
    const rechazadas = bloque.imagenes.filter(function (item) { return !item.valido; }).length;

    if (pendientes > 0) partes.push(pendientes + " por subir");
    if (subidas > 0) partes.push(subidas + " subida(s)");
    if (conError > 0) partes.push(conError + " con error, se reintentará");
    if (rechazadas > 0) partes.push(rechazadas + " rechazada(s), no se enviarán");

    bloque.resumen.textContent = partes.join(" · ") + ".";
}

/* =========================================================
   8. Habilitación del botón de envío
   ========================================================= */

// Cuenta imágenes válidas del bloque que están en un estado dado.
function contarPorEstado(bloque, estado) {
    return bloque.imagenes.filter(function (item) {
        return item.valido && item.estado === estado;
    }).length;
}

// Se suben las válidas que aún no están en Drive; las que fallaron se reintentan.
function faltaSubir(item) {
    return item.valido && (item.estado === "pendiente" || item.estado === "error");
}

function porSubirEn(bloque) {
    return bloque.imagenes.filter(faltaSubir);
}

function contarPorSubir() {
    return todasLasImagenes().filter(faltaSubir).length;
}

// Un bloque está listo cuando tiene curso elegido e imágenes por subir.
function bloqueListo(bloque) {
    return bloque.selectCurso.value !== "" && porSubirEn(bloque).length > 0;
}

function formularioCompleto() {
    if (campoNombre.value.trim() === "") return false;

    // Ningún bloque puede quedar con imágenes sin curso: se subirían a ninguna parte.
    const sinCurso = bloques.some(function (bloque) {
        return bloque.selectCurso.value === "" && porSubirEn(bloque).length > 0;
    });

    return !sinCurso && bloques.some(bloqueListo);
}

function actualizarEstadoEnvio() {
    botonEnviar.disabled = subidaEnCurso || !formularioCompleto();
    botonEnviar.textContent = subidaEnCurso ? "Subiendo…" : "Enviar trabajos";

    // Mientras sube no se cambian los datos de la tanda.
    campoNombre.disabled = subidaEnCurso;
    botonAgregarBloque.disabled = subidaEnCurso;
    refrescarBloques();
}

/* =========================================================
   8. Compresión en el navegador
   Se achica y se pasa a WebP antes de enviar, para no mandar
   fotos de celular de varios MB.
   ========================================================= */

// Cambia la extensión del nombre por .webp.
function nombreComoWebp(nombreArchivo) {
    const punto = nombreArchivo.lastIndexOf(".");
    const base = punto > 0 ? nombreArchivo.slice(0, punto) : nombreArchivo;
    return base + ".webp";
}

// Calcula el tamaño final respetando la proporción. Nunca agranda.
function calcularMedidas(ancho, alto) {
    const escala = Math.min(1, LADO_MAXIMO / Math.max(ancho, alto));
    return {
        ancho: Math.round(ancho * escala),
        alto: Math.round(alto * escala)
    };
}

// Dibuja la imagen en un canvas del tamaño calculado.
// imageOrientation: "from-image" aplica la orientación EXIF,
// así las fotos de celular no salen rotadas.
async function dibujarEnCanvas(archivo) {
    const mapa = await createImageBitmap(archivo, { imageOrientation: "from-image" });
    const medidas = calcularMedidas(mapa.width, mapa.height);

    const lienzo = document.createElement("canvas");
    lienzo.width = medidas.ancho;
    lienzo.height = medidas.alto;
    lienzo.getContext("2d").drawImage(mapa, 0, 0, medidas.ancho, medidas.alto);

    mapa.close();
    return lienzo;
}

// Devuelve el WebP como blob. Lanza si el navegador no puede generarlo.
function exportarWebp(lienzo) {
    return new Promise(function (resolver, rechazar) {
        lienzo.toBlob(function (blob) {
            if (blob) resolver(blob);
            else rechazar(new Error("El navegador no pudo exportar a WebP."));
        }, "image/webp", CALIDAD_WEBP);
    });
}

// Deja la imagen lista para enviar. Si la compresión falla por lo que sea,
// se manda el archivo original en vez de descartarlo.
async function prepararParaEnvio(item) {
    try {
        const lienzo = await dibujarEnCanvas(item.archivo);
        const comprimida = await exportarWebp(lienzo);

        item.pesoComprimido = comprimida.size;
        return {
            contenido: comprimida,
            nombre: nombreComoWebp(item.archivo.name),
            tipo: "image/webp"
        };

    } catch (error) {
        item.pesoComprimido = null;
        return {
            contenido: item.archivo,
            nombre: item.archivo.name,
            tipo: item.archivo.type
        };
    }
}

/* =========================================================
   9. Envío a Apps Script, una imagen a la vez
   ========================================================= */

// Convierte un File o Blob a base64 sin el prefijo "data:...;base64,".
function leerComoBase64(archivo) {
    return new Promise(function (resolver, rechazar) {
        const lector = new FileReader();
        lector.onload = function () {
            resolver(lector.result.split(",")[1]);
        };
        lector.onerror = function () {
            rechazar(new Error("No se pudo leer el archivo."));
        };
        lector.readAsDataURL(archivo);
    });
}

// Llama a subirImagen() del servidor y devuelve su respuesta como promesa.
function llamarAlServidor(carga) {
    return new Promise(function (resolver) {
        // Abriendo el archivo fuera de Apps Script no existe google.script.run.
        if (typeof google === "undefined" || !google.script) {
            console.log("Sin servidor — aquí iría el envío de:", carga);
            resolver({ exito: false, mensaje: "Sin conexión con Apps Script (prueba local)." });
            return;
        }

        google.script.run
            .withSuccessHandler(resolver)
            .withFailureHandler(function (error) {
                resolver({ exito: false, mensaje: error.message || "Error del servidor." });
            })
            .subirImagen(carga);
    });
}

// Comprime, pasa a base64 y sube una sola imagen.
async function subirUnaImagen(item, datosBase) {
    try {
        const listo = await prepararParaEnvio(item);
        const base64 = await leerComoBase64(listo.contenido);

        return await llamarAlServidor({
            correo: "",                     // lo resuelve el servidor con la sesión
            nombre: datosBase.nombre,
            linea: datosBase.linea,
            curso: datosBase.curso,
            nombreArchivo: listo.nombre,
            tipo: listo.tipo,
            base64: base64
        });

    } catch (error) {
        return { exito: false, mensaje: error.message };
    }
}

async function manejarEnvio(evento) {
    evento.preventDefault();
    if (subidaEnCurso || !formularioCompleto()) return;

    subidaEnCurso = true;
    avisoEnvio.textContent = "";
    actualizarEstadoEnvio();
    bloques.forEach(dibujarGrilla); // deshabilita los botones de quitar

    const nombre = campoNombre.value.trim();
    const total = contarPorSubir();
    let hechas = 0;
    let logradas = 0;

    // Lo que se subió en cada curso, para el correo y la pantalla final.
    const detalles = [];

    mostrarAvance(0, total);

    // Bloque por bloque, y dentro de cada uno imagen por imagen.
    for (const bloque of bloques) {
        if (!bloqueListo(bloque)) continue;

        const datosBase = {
            nombre: nombre,
            curso: bloque.selectCurso.value,
            // La línea no se pregunta: se deduce del curso elegido.
            linea: buscarLineaDeCurso(bloque.selectCurso.value)
        };

        // Los nombres con los que quedaron guardados, para el correo.
        const archivosDelCurso = [];
        let urlCarpetaCurso = "";
        let logradasAqui = 0;

        for (const item of porSubirEn(bloque)) {
            item.estado = "subiendo";
            item.mensajeEstado = "";
            repintarMiniatura(bloque, item);

            const respuesta = await subirUnaImagen(item, datosBase);

            if (respuesta && respuesta.exito) {
                item.estado = "subida";
                item.urlDrive = respuesta.url;
                item.idDrive = respuesta.id;
                // El archivo está en Drive aunque la planilla haya fallado.
                item.errorPlanilla = respuesta.errorPlanilla || "";
                // El servidor renombra el archivo: guardamos con qué nombre quedó.
                item.nombreEnDrive = respuesta.nombreArchivo || item.archivo.name;
                archivosDelCurso.push(item.nombreEnDrive);
                urlCarpetaCurso = respuesta.urlCarpetaCurso || urlCarpetaCurso;
                logradasAqui++;
                logradas++;
            } else {
                item.estado = "error";
                item.mensajeEstado = (respuesta && respuesta.mensaje) || "Error desconocido.";
            }

            hechas++;
            mostrarAvance(hechas, total);
            repintarMiniatura(bloque, item);
            actualizarResumen(bloque);
        }

        if (logradasAqui > 0) {
            detalles.push({
                linea: datosBase.linea,
                curso: datosBase.curso,
                cantidad: logradasAqui,
                urlCarpeta: urlCarpetaCurso,
                archivos: archivosDelCurso
            });
        }
    }

    subidaEnCurso = false;
    actualizarEstadoEnvio();
    bloques.forEach(dibujarGrilla);
    ocultarAvance();

    const fallidas = total - logradas;

    // Con la primera subida el servidor ya guardó el nombre: se fija acá también,
    // sin esperar a la próxima visita.
    if (logradas > 0) bloquearNombre();

    // Con todo subido se avisa por correo y se pasa a la pantalla final.
    // Si algo falló nos quedamos en el formulario para poder reintentar.
    if (fallidas === 0 && logradas > 0) {
        const cierre = await pedirAvisoPorCorreo({ cantidad: logradas, detalles: detalles });
        mostrarGracias(detalles, logradas, cierre);
        return;
    }

    avisoEnvio.textContent =
        logradas + " subida(s), " + fallidas + " con error. Puedes volver a enviar para reintentar.";
}

// Barra y porcentaje. No mide bytes: cuenta imágenes terminadas.
function mostrarAvance(hechas, total) {
    const porcentaje = total === 0 ? 0 : Math.round((hechas / total) * 100);

    barra.hidden = false;
    barraAvance.style.width = porcentaje + "%";
    avisoEnvio.textContent = "Subiendo " + hechas + " de " + total + " — " + porcentaje + "%";
}

function ocultarAvance() {
    barra.hidden = true;
    barraAvance.style.width = "0";
}


/* =========================================================
   10. Pantalla final
   ========================================================= */

// Pide al servidor que mande el correo de aviso de la tanda.
function pedirAvisoPorCorreo(resumen) {
    return new Promise(function (resolver) {
        if (typeof google === "undefined" || !google.script) {
            resolver({ exito: false, mensaje: "Prueba local: no se envía correo." });
            return;
        }

        google.script.run
            .withSuccessHandler(resolver)
            .withFailureHandler(function (error) {
                resolver({ exito: false, mensaje: error.message });
            })
            .avisarPorCorreo(resumen);
    });
}

function mostrarGracias(detalles, cantidad, cierre) {
    // Un curso por línea, con cuántas imágenes quedaron en cada uno.
    const porCurso = detalles.map(function (detalle) {
        return detalle.curso + " (" + detalle.cantidad + ")";
    }).join(", ");

    graciasDetalle.textContent =
        "Se subieron " + cantidad + " imagen(es): " + porCurso + ".";

    // El enlace a la carpeta solo aparece si el servidor lo pudo resolver.
    if (cierre && cierre.urlCarpeta) {
        graciasEnlace.href = cierre.urlCarpeta;
        graciasEnlace.hidden = false;
    } else {
        graciasEnlace.hidden = true;
    }

    graciasNota.textContent = (cierre && cierre.exito)
        ? "Te enviamos un correo con el enlace a tu carpeta."
        : "No pudimos enviarte el correo de aviso, pero tus imágenes sí quedaron guardadas.";

    // El motivo real va a la consola: al estudiante no le sirve, a nosotros sí.
    if (cierre && !cierre.exito) {
        console.warn("No se envió el correo de aviso:", cierre.mensaje);
    }

    formulario.hidden = true;
    pantallaGracias.hidden = false;
    window.scrollTo(0, 0);
}

// Vuelve al formulario para otra tanda. Se conserva el nombre.
function volverAlFormulario() {
    todasLasImagenes().forEach(soltarVistaPrevia);
    bloques = [];
    contenedorBloques.innerHTML = "";
    crearBloque();

    avisoEnvio.textContent = "";

    pantallaGracias.hidden = true;
    formulario.hidden = false;

    actualizarEstadoEnvio();
    window.scrollTo(0, 0);
}

/* =========================================================
   11. Escuchas de eventos e inicio
   ========================================================= */

// Si el servidor ya tiene un nombre guardado para este correo, lo rellena.
// El campo queda editable igual.
function precargarNombre() {
    if (typeof google === "undefined" || !google.script) return;

    google.script.run
        .withSuccessHandler(function (nombre) {
            if (!nombre) return;
            campoNombre.value = nombre;
            bloquearNombre();
            actualizarEstadoEnvio();
        })
        .obtenerNombre();
}

// El nombre se fija en la primera subida y ya no se edita:
// es la clave con la que se agrupan las carpetas y las filas de la planilla.
function bloquearNombre() {
    if (campoNombre.readOnly) return;

    campoNombre.readOnly = true;
    campoNombre.classList.add("bloqueado");
    ayudaNombre.textContent =
        "Quedó guardado en tu primera subida. Avisa al equipo si necesitas corregirlo.";
    ayudaNombre.hidden = false;
}

// Los eventos de cada bloque se enganchan en crearBloque().
campoNombre.addEventListener("input", actualizarEstadoEnvio);
botonAgregarBloque.addEventListener("click", function () { crearBloque(); });
formulario.addEventListener("submit", manejarEnvio);
botonSubirMas.addEventListener("click", volverAlFormulario);

crearBloque();
precargarNombre();
actualizarEstadoEnvio();