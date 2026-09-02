/* =========================================================
   1. Datos
   En Apps Script los inyecta doGet() como la constante DATOS.
   Abriendo el archivo suelto esa constante no existe, y se usa
   el juego de ejemplo de datos-ejemplo.js: así la página se
   puede revisar sin desplegarla.
   ========================================================= */
const ARCHIVO = (typeof DATOS !== "undefined") ? DATOS : DATOS_EJEMPLO;

const CATEGORIAS = ARCHIVO.categorias || [];
const LINEAS = ARCHIVO.lineas || [];
const OBRAS = ARCHIVO.obras || [];

// La clasificación guardada se cuelga de cada trabajo para no
// andar consultando dos estructuras en paralelo.
OBRAS.forEach(function (obra) {
    obra.categorias = (ARCHIVO.clasificacion && ARCHIVO.clasificacion[obra.id]) || [];
});

/* Las cuatro secciones, en el orden de la grilla 2×2. La primera
   muestra todo en grilla; las otras tres son nodos en órbita. */
const SECCIONES = [{
    titulo: "Todos mis trabajos",
    clave: null,
    definicion: null
}].concat(CATEGORIAS.map(function (categoria) {
    return {
        titulo: categoria.titulo,
        clave: categoria.clave,
        definicion: categoria.definicion
    };
}));

// Miniatura servida por Drive. Si la política del dominio no permite
// verla, la imagen falla y queda el rectángulo gris de fondo.
//
// Para los videos de YouTube se prefiere la portada que el formulario
// guardó en Drive, porque sobrevive aunque el video desaparezca. Si esa
// no existe, se cae a la que sirve YouTube.
function urlMiniatura(obra, ancho) {
    if (obra.tipo === "youtube") {
        // El archivo en Drive puede ser la portada .jpg o, si no se pudo
        // bajar, una nota .txt. De la nota no sale miniatura: para esos
        // se pide la que sirve YouTube.
        if (obra.portada && obra.archivo.slice(-4).toLowerCase() === ".jpg") {
            return "https://drive.google.com/thumbnail?id=" + obra.portada + "&sz=w" + ancho;
        }
        return "https://img.youtube.com/vi/" + obra.idVideo + "/hqdefault.jpg";
    }

    return "https://drive.google.com/thumbnail?id=" + obra.id + "&sz=w" + ancho;
}

// Los videos de Drive no tienen URL directa reproducible: se usa su
// reproductor. Los de YouTube van por el dominio sin cookies, que es el
// mismo reproductor pero sin seguimiento del que mira.
function urlReproductor(obra) {
    if (obra.tipo === "youtube") {
        return "https://www.youtube-nocookie.com/embed/" + obra.idVideo;
    }

    return "https://drive.google.com/file/d/" + obra.id + "/preview";
}

/* =========================================================
   2. Estado
   ========================================================= */
const estado = {
    ampliada: null,       // índice de sección ampliada, o null en vista general
    lista: [],            // trabajos por los que navegan las flechas del visor
    obra: null,           // índice dentro de esa lista, o null si está cerrado

    seleccion: [],        // ids de los trabajos elegidos para el lote

    // Lo que se va a aplicar al confirmar, no antes. Por cada nodo:
    // "todos", "ninguno", o "mixto" para dejar cada trabajo como está.
    destinos: {},
    tocados: []           // nodos que el estudiante decidió a mano
};

const tablero = document.getElementById("tablero");
const telon = document.getElementById("telon");
const botonVolver = document.getElementById("volver");
const avisoGuardado = document.getElementById("guardado");

// Trabajos que le tocan a una sección.
function obrasDe(seccion) {
    if (!seccion.clave) return OBRAS;
    return OBRAS.filter(function (obra) {
        return obra.categorias.indexOf(seccion.clave) !== -1;
    });
}

/* =========================================================
   3. Guardado
   No se llama al servidor en cada clic: se junta lo que pasó
   en un segundo y se manda el mapa completo de una vez.
   ========================================================= */
let temporizador = null;

function mapaDeClasificacion() {
    const mapa = {};
    OBRAS.forEach(function (obra) {
        if (obra.categorias.length > 0) mapa[obra.id] = obra.categorias;
    });
    return mapa;
}

function mostrarGuardado(texto, falla) {
    avisoGuardado.textContent = texto;
    avisoGuardado.classList.toggle("falla", falla === true);
}

function programarGuardado() {
    mostrarGuardado("Guardando…");
    clearTimeout(temporizador);
    temporizador = setTimeout(guardarAhora, 900);
}

function guardarAhora() {
    if (typeof google === "undefined" || !google.script) {
        mostrarGuardado("Sin guardar (prueba local)", true);
        return;
    }

    google.script.run
        .withSuccessHandler(function (respuesta) {
            if (respuesta && respuesta.exito) mostrarGuardado("Guardado");
            else mostrarGuardado("No se pudo guardar", true);
        })
        .withFailureHandler(function () {
            mostrarGuardado("No se pudo guardar", true);
        })
        .guardarClasificacion(mapaDeClasificacion());
}

/* =========================================================
   4. Fichas
   ========================================================= */
function crearImagen(obra, ancho) {
    const imagen = document.createElement("img");
    imagen.src = urlMiniatura(obra, ancho);
    imagen.alt = "";
    imagen.loading = "lazy";

    // Si Drive no la sirve, se quita y queda el rectángulo gris.
    imagen.addEventListener("error", function () { imagen.remove(); });
    return imagen;
}

function crearContenidoDeFicha(obra) {
    if (obra.tipo === "texto") {
        const extracto = document.createElement("p");
        extracto.className = "extracto";
        extracto.textContent = obra.contenido;
        return [extracto];
    }

    const partes = [crearImagen(obra, 400)];

    if (obra.tipo === "video" || obra.tipo === "youtube") {
        const marca = document.createElement("span");
        marca.className = "marca-video";
        partes.push(marca);
    }

    return partes;
}

// La casilla que selecciona el trabajo sin abrirlo. Solo se pone en la
// grilla: en las órbitas la ficha puede quedar de 22px y no habría dónde
// apuntar.
function crearCasilla(obra) {
    const casilla = document.createElement("button");
    casilla.type = "button";
    casilla.className = "elegir";
    casilla.textContent = "✓";
    casilla.setAttribute("role", "checkbox");
    casilla.setAttribute("aria-checked", String(obraElegida(obra)));
    casilla.setAttribute("aria-label", "Seleccionar " + obra.archivo);

    casilla.addEventListener("click", function () { alternarSeleccion(obra); });
    return casilla;
}

function crearObra(obra, lista, indice, conCasilla) {
    const ficha = document.createElement("div");
    ficha.className = "obra";

    // El mismo trabajo puede tener ficha en varias secciones a la vez.
    ficha.dataset.obra = obra.id;
    if (obraElegida(obra)) ficha.classList.add("elegida");

    // El botón cubre la ficha entera; la casilla va encima, en una esquina.
    const abrir = document.createElement("button");
    abrir.type = "button";
    abrir.className = "obra-abrir";
    abrir.setAttribute("aria-label", obra.archivo + ", " + obra.curso);
    abrir.addEventListener("click", function () { abrirObra(lista, indice); });

    crearContenidoDeFicha(obra).forEach(function (parte) { abrir.appendChild(parte); });
    ficha.appendChild(abrir);

    if (obra.categorias.length > 0) {
        const marcas = document.createElement("div");
        marcas.className = "marcas";
        obra.categorias.forEach(function () { marcas.appendChild(document.createElement("i")); });
        ficha.appendChild(marcas);
    }

    if (conCasilla) ficha.appendChild(crearCasilla(obra));

    return ficha;
}

function crearGrilla(lista) {
    const ul = document.createElement("ul");
    ul.className = "obras";

    lista.forEach(function (obra, i) {
        const celda = document.createElement("li");
        celda.appendChild(crearObra(obra, lista, i, true));
        ul.appendChild(celda);
    });

    return ul;
}

// La primera sección va agrupada por línea curricular.
function crearPorLinea(lista) {
    const envoltura = document.createDocumentFragment();

    LINEAS.forEach(function (linea) {
        const deLaLinea = lista.filter(function (o) { return o.linea === linea; });
        if (deLaLinea.length === 0) return;

        const grupo = document.createElement("div");
        grupo.className = "grupo-linea";

        const rotulo = document.createElement("h3");
        rotulo.className = "rotulo-linea";
        rotulo.textContent = linea + " · " + deLaLinea.length;
        grupo.appendChild(rotulo);

        grupo.appendChild(crearGrilla(deLaLinea));
        envoltura.appendChild(grupo);
    });

    return envoltura;
}

/* =========================================================
   5. Reparto en anillos
   Toda la geometría de la órbita vive acá. El tamaño de ficha
   sale de la cantidad de trabajos y del radio disponible; si el
   anillo más externo no cabe, se achica la ficha y se vuelve a
   repartir. Por eso pocos trabajos salen grandes y muchos se
   acomodan en más anillos sin desbordarse.
   ========================================================= */
const LADO_MINIMO = 22;
const LADO_MAXIMO = 200;

// Cuántas fichas de este lado caben en una vuelta de este radio.
function capacidadDelAnillo(radio, lado) {
    return Math.max(1, Math.floor((2 * Math.PI * radio) / (lado * 1.12)));
}

// Devuelve las posiciones relativas al centro y el radio externo.
function repartirEnAnillos(cantidad, lado, radioInterior, radioMaximo) {
    const anillos = [];
    let radio = radioInterior + lado * 0.7;
    let colocadas = 0;

    while (colocadas < cantidad) {
        const enEste = Math.min(capacidadDelAnillo(radio, lado), cantidad - colocadas);
        anillos.push({ radio: radio, cuantas: enEste });

        colocadas += enEste;
        if (colocadas < cantidad) radio += lado * 1.18;
    }

    // Con pocos trabajos los anillos quedan pegados al núcleo y todo el
    // borde sobra. Se corre el conjunto hacia afuera para ocupar ese
    // espacio: al haber más circunferencia, la ficha puede ser más
    // grande, que es de dónde sale que pocos trabajos se vean grandes.
    // Se reserva 1px: si el anillo queda justo sobre el límite, el
    // redondeo del navegador hace que a veces mida una milésima de más
    // y las fichas se descarten como si no cupieran. Con el zoom al 90%
    // el redondeo caía para el otro lado y reaparecían.
    const holgura = radioMaximo - (radio + lado / 2) - 1;
    if (holgura > 0) {
        anillos.forEach(function (anillo) { anillo.radio += holgura; });
        radio += holgura;
    }

    const posiciones = [];

    anillos.forEach(function (anillo, i) {
        // Cada anillo se gira medio paso: así las fichas no quedan
        // alineadas en radios y la mancha se ve más pareja.
        const giro = (i % 2) * (Math.PI / anillo.cuantas);

        for (let j = 0; j < anillo.cuantas; j++) {
            const angulo = giro + (j * 2 * Math.PI) / anillo.cuantas - Math.PI / 2;
            posiciones.push({
                x: Math.cos(angulo) * anillo.radio,
                y: Math.sin(angulo) * anillo.radio
            });
        }
    });

    return { posiciones: posiciones, radio: radio, interno: anillos[0].radio };
}

// Busca el lado más grande con el que todo cabe dentro del radio.
// Un tamaño sirve si nada se sale del borde y el anillo interno no se
// mete dentro del núcleo.
function ladoSirve(cantidad, lado, radioMaximo, radioInterior) {
    const reparto = repartirEnAnillos(cantidad, lado, radioInterior, radioMaximo);
    return reparto.radio + lado / 2 <= radioMaximo + 0.5 &&
        reparto.interno - lado / 2 >= radioInterior;
}

// Busca el tamaño más grande que sirva, partiendo del mínimo y subiendo
// de a poco. Antes solo se achicaba desde un tanteo, y con pocos
// trabajos el tanteo se topaba con el núcleo: uno, tres y ocho trabajos
// terminaban todos del mismo porte.
function ajustarLado(cantidad, radioMaximo, radioInterior) {
    let lado = LADO_MINIMO;

    for (let intento = 0; intento < 80; intento++) {
        const prueba = Math.min(LADO_MAXIMO, lado * 1.04);
        if (prueba <= lado) break;   // ya está en el tope
        if (!ladoSirve(cantidad, prueba, radioMaximo, radioInterior)) break;
        lado = prueba;
    }

    const reparto = repartirEnAnillos(cantidad, lado, radioInterior, radioMaximo);
    return { lado: lado, posiciones: reparto.posiciones };
}

// Coloca las fichas ya creadas. Se llama al dibujar y cada vez que
// la sección cambia de tamaño.
function acomodarOrbita(orbita) {
    const fichas = orbita.querySelectorAll(".orbitando");
    if (fichas.length === 0) return;

    const ancho = orbita.clientWidth;
    const alto = orbita.clientHeight;
    if (ancho === 0 || alto === 0) return;   // sección colapsada

    const nucleo = orbita.querySelector(".nucleo");
    const radioMaximo = Math.min(ancho, alto) / 2 - 6;

    // El núcleo es ancho y bajo, así que su lado mayor exagera lo que de
    // verdad estorba: una ficha puesta arriba o abajo no lo toca. Y como
    // el núcleo se dibuja encima con fondo sólido, tampoco necesita el
    // despeje completo. Sin este tope, con pocos trabajos la ficha no
    // podía crecer más que el anillo libre y uno, tres y ocho salían
    // todos del mismo porte.
    const radioInterior = Math.min(
        Math.max(nucleo.offsetWidth, nucleo.offsetHeight) / 2,
        radioMaximo * 0.42
    );

    const plan = ajustarLado(fichas.length, radioMaximo, radioInterior);

    // Con muchos trabajos en un cuadrante chico la ficha toca su piso y
    // el anillo externo ya no cabe. En vez de recortarlo a medias, se
    // muestran los que entran y el núcleo dice cuántos faltan: al
    // ampliar la sección hay radio de sobra y aparecen todos.
    // El margen de 1px es el mismo que reserva repartirEnAnillos: sin él,
    // un anillo que cabe justo se descarta entero por redondeo.
    const caben = plan.posiciones.filter(function (punto) {
        return Math.hypot(punto.x, punto.y) + plan.lado / 2 <= radioMaximo + 1;
    }).length;

    fichas.forEach(function (ficha, i) {
        if (i >= caben) {
            ficha.hidden = true;
            return;
        }

        const punto = plan.posiciones[i];
        ficha.hidden = false;
        ficha.style.width = plan.lado + "px";
        ficha.style.left = (ancho / 2 + punto.x) + "px";
        ficha.style.top = (alto / 2 + punto.y) + "px";
        ficha.classList.toggle("diminuta", plan.lado < 60);
    });

    const resto = orbita.querySelector(".resto");
    const faltan = fichas.length - caben;
    resto.textContent = faltan > 0 ? "+" + faltan + " al ampliar" : "";
    resto.hidden = faltan === 0;
}

/* =========================================================
   6. Construcción de la pantalla
   ========================================================= */
function crearNucleo(seccion, indice, cantidad) {
    const nucleo = document.createElement("div");
    nucleo.className = "nucleo";

    const titulo = document.createElement("button");
    titulo.type = "button";
    titulo.className = "titulo-nodo";
    titulo.innerHTML = seccion.titulo + '<br><span class="cuenta">' + cantidad + "</span>";
    titulo.addEventListener("click", function () { ampliar(indice); });
    nucleo.appendChild(titulo);

    const definicion = document.createElement("p");
    definicion.className = "definicion";
    definicion.textContent = seccion.definicion;
    nucleo.appendChild(definicion);

    if (cantidad === 0) {
        const vacio = document.createElement("p");
        vacio.className = "vacio-nodo";
        vacio.textContent = "Abre un trabajo desde «Todos mis trabajos» y mándalo a este nodo.";
        nucleo.appendChild(vacio);
    }

    // Lo llena acomodarOrbita() cuando no alcanzan a caber todos.
    const resto = document.createElement("p");
    resto.className = "resto";
    resto.hidden = true;
    nucleo.appendChild(resto);

    return nucleo;
}

function crearOrbita(seccion, indice, lista) {
    const orbita = document.createElement("div");
    orbita.className = "orbita";
    orbita.appendChild(crearNucleo(seccion, indice, lista.length));

    lista.forEach(function (obra, i) {
        const ficha = crearObra(obra, lista, i, false);
        ficha.classList.add("orbitando");
        orbita.appendChild(ficha);
    });

    return orbita;
}

function crearSeccion(seccion, indice) {
    const nodo = document.createElement("section");
    nodo.className = "seccion";

    // Solo la primera lleva encabezado: en los nodos el título va al
    // centro de la órbita y es el que abre la sección.
    if (seccion.clave === null) {
        const cabecera = document.createElement("div");
        cabecera.className = "seccion-cabecera";

        const titulo = document.createElement("button");
        titulo.type = "button";
        titulo.className = "titulo-seccion";
        titulo.addEventListener("click", function () { ampliar(indice); });

        cabecera.appendChild(titulo);
        nodo.appendChild(cabecera);
        seccion.nodoTitulo = titulo;
    }

    const cuerpo = document.createElement("div");
    cuerpo.className = "seccion-cuerpo" + (seccion.clave ? " cuerpo-orbita" : "");
    nodo.appendChild(cuerpo);

    seccion.nodoCuerpo = cuerpo;
    return nodo;
}

function refrescarSeccion(seccion, indice) {
    const lista = obrasDe(seccion);
    seccion.nodoCuerpo.innerHTML = "";

    if (seccion.clave === null) {
        seccion.nodoTitulo.innerHTML = seccion.titulo +
            ' <span class="cuenta">' + lista.length + "</span>";
        seccion.nodoCuerpo.appendChild(crearPorLinea(lista));
        return;
    }

    const orbita = crearOrbita(seccion, indice, lista);
    seccion.nodoCuerpo.appendChild(orbita);
    acomodarOrbita(orbita);
}

function refrescar() {
    SECCIONES.forEach(refrescarSeccion);
}

// La órbita depende del tamaño de la sección, y ese tamaño cambia al
// ampliar y al mover la ventana. Se recalcula en cada cambio, así la
// órbita se abre junto con la sección.
function vigilarTamanos() {
    if (typeof ResizeObserver === "undefined") return;

    const vigia = new ResizeObserver(function (entradas) {
        entradas.forEach(function (entrada) {
            const orbita = entrada.target.querySelector(".orbita");
            if (orbita) acomodarOrbita(orbita);
        });
    });

    SECCIONES.forEach(function (seccion) {
        if (seccion.clave) vigia.observe(seccion.nodoCuerpo);
    });
}

/* =========================================================
   7. Las dos vistas
   No hay zoom gradual: la grilla pasa de 1fr 1fr a 1fr 0fr (o
   la combinación que toque) y la sección elegida crece en su
   lugar. Las otras se colapsan y se apagan.
   ========================================================= */
const COLUMNAS = ["1fr 0fr", "0fr 1fr", "1fr 0fr", "0fr 1fr"];
const FILAS    = ["1fr 0fr", "1fr 0fr", "0fr 1fr", "0fr 1fr"];

function aplicarVista() {
    const ampliada = estado.ampliada;
    const hayAmpliada = ampliada !== null;

    tablero.style.gridTemplateColumns = hayAmpliada ? COLUMNAS[ampliada] : "1fr 1fr";
    tablero.style.gridTemplateRows = hayAmpliada ? FILAS[ampliada] : "1fr 1fr";
    tablero.classList.toggle("ampliada", hayAmpliada);

    Array.prototype.forEach.call(tablero.children, function (nodo, i) {
        nodo.classList.toggle("apagada", hayAmpliada && i !== ampliada);
    });

    botonVolver.hidden = !hayAmpliada;
}

function ampliar(indice) {
    estado.ampliada = indice;
    aplicarVista();
}

function volverAGeneral() {
    estado.ampliada = null;
    aplicarVista();
}

// En vista de sección, las flechas pasan a la sección contigua.
function moverSeccion(paso) {
    if (estado.ampliada === null) return;
    const total = SECCIONES.length;
    ampliar((estado.ampliada + paso + total) % total);
}

/* =========================================================
   8. Trabajo en primer plano
   ========================================================= */
function abrirObra(lista, indice) {
    estado.lista = lista;
    estado.obra = indice;
    pintarVisor();
    telon.classList.add("abierto");
    document.getElementById("cerrar").focus();
}

function cerrarObra() {
    estado.obra = null;
    telon.classList.remove("abierto");
    // Se vacía para que un video no siga sonando detrás del telón.
    document.getElementById("visor-hueco").innerHTML = "";
}

// Las flechas pasan al trabajo siguiente o anterior sin cerrar.
function moverObra(paso) {
    if (estado.obra === null) return;
    const total = estado.lista.length;
    estado.obra = (estado.obra + paso + total) % total;
    pintarVisor();
}

function crearVistaGrande(obra) {
    if (obra.tipo === "texto") {
        const cita = document.createElement("blockquote");
        cita.textContent = obra.contenido;
        return cita;
    }

    if (obra.tipo === "video" || obra.tipo === "youtube") {
        const marco = document.createElement("iframe");
        marco.src = urlReproductor(obra);
        marco.allow = "autoplay; encrypted-media; picture-in-picture";
        marco.setAttribute("allowfullscreen", "");
        marco.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        return marco;
    }

    return crearImagen(obra, 1600);
}

function pintarVisor() {
    const obra = estado.lista[estado.obra];
    const hueco = document.getElementById("visor-hueco");

    hueco.innerHTML = "";
    hueco.appendChild(crearVistaGrande(obra));

    document.getElementById("visor-curso").textContent = obra.curso;
    document.getElementById("visor-linea").textContent = obra.linea;
    document.getElementById("visor-indice").textContent =
        (estado.obra + 1) + " / " + estado.lista.length;

    pintarDestinos(obra);
}

// Manda o saca el trabajo de un nodo. Puede estar en varios a la vez,
// y sigue estando en "Todos mis trabajos".
function alternarCategoria(obra, clave) {
    const puesto = obra.categorias.indexOf(clave);
    if (puesto === -1) obra.categorias.push(clave);
    else obra.categorias.splice(puesto, 1);

    programarGuardado();
    refrescar();
    pintarDestinos(obra);
}

function pintarDestinos(obra) {
    const zona = document.getElementById("enviar");
    zona.querySelectorAll(".destino").forEach(function (n) { n.remove(); });

    CATEGORIAS.forEach(function (categoria) {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "destino";
        boton.textContent = categoria.titulo;
        boton.setAttribute("aria-pressed",
            String(obra.categorias.indexOf(categoria.clave) !== -1));
        boton.addEventListener("click", function () {
            alternarCategoria(obra, categoria.clave);
        });
        zona.appendChild(boton);
    });
}

/* =========================================================
   9. Selección múltiple
   Permite mandar varios trabajos a un nodo de una vez, sin
   tener que abrirlos uno por uno.
   ========================================================= */
const lote = document.getElementById("lote");
const loteCuenta = document.getElementById("lote-cuenta");
const loteDestinos = document.getElementById("lote-destinos");
const botonConfirmar = document.getElementById("lote-confirmar");

function obraElegida(obra) {
    return estado.seleccion.indexOf(obra.id) !== -1;
}

function obrasSeleccionadas() {
    return OBRAS.filter(obraElegida);
}

// Todas las fichas de ese trabajo, estén en la sección que estén,
// tienen que reflejar lo mismo.
function marcarFichas(obra) {
    const elegida = obraElegida(obra);

    document.querySelectorAll('[data-obra="' + obra.id + '"]').forEach(function (ficha) {
        ficha.classList.toggle("elegida", elegida);

        const casilla = ficha.querySelector(".elegir");
        if (casilla) casilla.setAttribute("aria-checked", String(elegida));
    });
}

function alternarSeleccion(obra) {
    const puesto = estado.seleccion.indexOf(obra.id);
    if (puesto === -1) estado.seleccion.push(obra.id);
    else estado.seleccion.splice(puesto, 1);

    marcarFichas(obra);
    pintarLote();
}

// Cuántos del lote ya están en ese nodo.
function cuantasEn(lista, clave) {
    return lista.filter(function (obra) {
        return obra.categorias.indexOf(clave) !== -1;
    }).length;
}

// Si todos están, el botón los saca; si no, los agrega todos. Así el
// mismo botón sirve para mandar y para deshacer.
// Los nodos que el estudiante no ha tocado reflejan cómo está hoy la
// selección: todos dentro, ninguno, o mezclado. Los que sí tocó se
// respetan aunque cambie la selección.
function recalcularDestinos() {
    const lista = obrasSeleccionadas();

    CATEGORIAS.forEach(function (categoria) {
        if (estado.tocados.indexOf(categoria.clave) !== -1) return;

        const dentro = cuantasEn(lista, categoria.clave);
        estado.destinos[categoria.clave] =
            lista.length === 0 || (dentro > 0 && dentro < lista.length) ? "mixto" :
            dentro === lista.length ? "todos" : "ninguno";
    });
}

// Un clic decide el nodo para todo el lote. No escribe nada todavía.
function alternarDestino(clave) {
    estado.destinos[clave] = estado.destinos[clave] === "todos" ? "ninguno" : "todos";
    if (estado.tocados.indexOf(clave) === -1) estado.tocados.push(clave);
    pintarLote();
}

// Recién acá se toca la clasificación. Los nodos que quedaron en "mixto"
// no se tocan: cada trabajo conserva lo que ya tenía.
function confirmarSeleccion() {
    const lista = obrasSeleccionadas();
    if (lista.length === 0) return;

    lista.forEach(function (obra) {
        CATEGORIAS.forEach(function (categoria) {
            const destino = estado.destinos[categoria.clave];
            if (destino === "mixto") return;

            const puesto = obra.categorias.indexOf(categoria.clave);
            if (destino === "todos" && puesto === -1) obra.categorias.push(categoria.clave);
            if (destino === "ninguno" && puesto !== -1) obra.categorias.splice(puesto, 1);
        });
    });

    programarGuardado();
    limpiarSeleccion();
}

function pintarLote() {
    const lista = obrasSeleccionadas();

    lote.hidden = lista.length === 0;
    if (lista.length === 0) return;

    recalcularDestinos();
    loteCuenta.textContent = lista.length + " seleccionado(s)";
    loteDestinos.innerHTML = "";

    let hayCambios = false;

    CATEGORIAS.forEach(function (categoria) {
        const destino = estado.destinos[categoria.clave];
        const dentro = cuantasEn(lista, categoria.clave);

        // Hay algo que confirmar si el nodo quedaría distinto a como está.
        if ((destino === "todos" && dentro < lista.length) ||
            (destino === "ninguno" && dentro > 0)) hayCambios = true;

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "destino" + (destino === "mixto" ? " parcial" : "");
        boton.textContent = categoria.titulo +
            (destino === "mixto" ? " · " + dentro + "/" + lista.length : "");
        boton.setAttribute("aria-pressed", String(destino === "todos"));
        boton.addEventListener("click", function () { alternarDestino(categoria.clave); });
        loteDestinos.appendChild(boton);
    });

    botonConfirmar.disabled = !hayCambios;
}

// No hay modo de selección: las casillas están siempre y la barra de
// acciones aparece sola en cuanto hay algo marcado.
function limpiarSeleccion() {
    estado.seleccion = [];
    estado.destinos = {};
    estado.tocados = [];
    refrescar();   // repinta las fichas sin la marca de elegidas
    pintarLote();
}

function limpiarSeleccion() {
    estado.seleccion = [];
    refrescar();
    pintarLote();
}

/* =========================================================
   10. Teclado y escuchas
   Con un trabajo abierto las flechas mueven trabajos; si no, y
   hay una sección ampliada, mueven secciones.
   ========================================================= */
document.addEventListener("keydown", function (evento) {
    const enVisor = estado.obra !== null;

    if (evento.key === "Escape") {
        if (enVisor) cerrarObra();
        else if (estado.seleccion.length > 0) limpiarSeleccion();
        else volverAGeneral();
        return;
    }

    if (evento.key === "ArrowLeft" || evento.key === "ArrowRight") {
        const paso = evento.key === "ArrowRight" ? 1 : -1;
        if (enVisor) moverObra(paso);
        else moverSeccion(paso);
        evento.preventDefault();
    }
});

telon.addEventListener("click", function (evento) {
    // Clic en el fondo atenuado, fuera del visor: cierra.
    if (evento.target === telon) cerrarObra();
});

document.getElementById("previa").addEventListener("click", function () { moverObra(-1); });
document.getElementById("siguiente").addEventListener("click", function () { moverObra(1); });
document.getElementById("cerrar").addEventListener("click", cerrarObra);
botonVolver.addEventListener("click", volverAGeneral);

document.getElementById("lote-limpiar").addEventListener("click", limpiarSeleccion);
botonConfirmar.addEventListener("click", confirmarSeleccion);

/* =========================================================
   11. Arranque
   ========================================================= */
function mostrarAviso(titulo, texto) {
    document.getElementById("aviso-titulo").textContent = titulo;
    document.getElementById("aviso-texto").textContent = texto;
    document.getElementById("pantalla-aviso").hidden = false;
    tablero.hidden = true;
    lote.hidden = true;
}

function iniciar() {
    if (ARCHIVO.error) {
        mostrarAviso("No pudimos abrir tu archivo", ARCHIVO.error);
        return;
    }

    document.getElementById("estudiante").textContent = ARCHIVO.nombre || ARCHIVO.correo;

    const enlace = document.getElementById("drive");
    if (ARCHIVO.urlCarpeta) enlace.href = ARCHIVO.urlCarpeta;
    else enlace.hidden = true;

    if (OBRAS.length === 0) {
        mostrarAviso("Todavía no hay nada acá",
            "Cuando subas trabajos por el formulario, van a aparecer en esta página.");
        return;
    }

    SECCIONES.forEach(function (seccion, i) {
        tablero.appendChild(crearSeccion(seccion, i));
    });

    refrescar();
    vigilarTamanos();
    aplicarVista();
}

iniciar();
