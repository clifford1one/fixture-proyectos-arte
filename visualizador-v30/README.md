# Visualizador v30 · tablero libre

Un tablero tipo pizarra (al estilo Miró) donde cada estudiante ordena sus propios trabajos en los tres nodos de la carrera:

- Forma y materiales
- Nudo conceptual
- Modos de hacer

A diferencia del v20, aquí nada se acomoda solo. El estudiante deja cada trabajo donde quiere, lo une con líneas a otros, escribe encima y pone stickers.

Son dos archivos, los mismos que existen en Apps Script:

- `code.gs`: el servidor. Lee la planilla y guarda el tablero.
- `index.html`: la página. Trae el marcado, el estilo y el script juntos.

Si se abre `index.html` directo en el navegador, sin Apps Script, muestra un tablero de ejemplo. Sirve para revisar el diseño sin publicar nada.

---

## 1. Qué ve el estudiante

- **Los tres nodos.** Cada uno es un círculo con el nombre en el **núcleo** (el centro) y una **atmósfera** difusa alrededor. La atmósfera marca el espacio donde van los trabajos. Bajo el nombre aparece cuántos trabajos tiene.
- **«Mis trabajos»** (arriba a la izquierda). Abre la lista lateral con todos sus trabajos, agrupados por curso en el orden de la malla. El contador `6/27` dice cuántos de sus trabajos ya están en el tablero.
- **Barra de herramientas** (abajo): Mover, Texto, Conectar, Stickers, Deshacer, Rehacer y el zoom.
- **Arriba a la derecha:** Guardar, Paleta y **?**, que abre la ayuda con los atajos.

## 2. Todo lo que se puede hacer

### Moverse por el tablero

| Acción | Cómo |
| --- | --- |
| Desplazarse | Arrastrar el fondo, o la atmósfera de un nodo |
| Desplazarse aunque haya algo debajo | Mantener `Espacio` y arrastrar, o arrastrar con la rueda apretada |
| Acercar o alejar | Rueda del mouse, pellizco en el trackpad, o dos dedos en pantalla táctil |
| Acercar o alejar desde la barra | Botones `−` y `+`, o las teclas `-` y `+` |
| Ver todo el tablero | Tocar el porcentaje de zoom, o `Shift + 1` |

### Trabajos (fichas)

- **Poner uno en el tablero.** Se arrastra desde la lista y queda exactamente donde se suelta. Si se toca en vez de arrastrarlo, aparece en el centro de la vista.
- **Encontrar uno.** En la lista, los que ya están en el tablero se ven tenues y con un ✓. Tocarlos lleva la vista hasta ellos.
- **Mover.** Se arrastra la ficha. Lo que se toma pasa adelante de todo.
- **Cambiar el tamaño.** Se elige la ficha y se arrastra el cuadrado de su esquina. La ficha mantiene la proporción de la imagen.
- **Ver en grande.** Doble clic en la ficha, el botón «Ver en grande» de la barra de opciones, o el botón ⤢ de la lista. En el visor:
  - las flechas `←` `→` pasan de un trabajo a otro;
  - los videos se reproducen ahí mismo;
  - un botón lleva al trabajo en el tablero, o lo pone si todavía no está.
- **Quitar del tablero.** Se elige y se aprieta `Supr`, o «Quitar del tablero», o se suelta la ficha sobre la lista abierta. El trabajo **no se borra**: solo vuelve a la lista.

### Nodos

- **Mover un nodo.** Se arrastra desde el **núcleo**, donde está el nombre. Se lleva consigo todo lo que tiene adentro: trabajos, textos y stickers.
- **Agrandar o achicar.** Se usa el punto que aparece sobre la atmósfera, en diagonal abajo a la derecha. El nodo crece desde su centro y siempre sigue siendo un círculo.
- **Cuándo un trabajo pertenece a un nodo.** Cuando el **centro** de la ficha cae dentro de su atmósfera, hasta el 88% del radio. Si dos atmósferas se superponen, gana la más chica.
- Mientras se arrastra algo encima de un nodo, su atmósfera se abre un poco: indica que lo soltado va a quedar ahí.

### Líneas (conexiones)

- **Crear una línea.** Al pasar el mouse sobre una ficha o un texto aparecen 4 puntos azules. Se arrastra desde uno de ellos hasta otra ficha o texto.
  - La línea se **imanta al centro** del destino, que se marca con un punto.
  - También se puede usar la herramienta Conectar (`L`): con ella se arrastra desde cualquier parte de la ficha.
- **Línea hacia el vacío.** Si se suelta en un espacio vacío, se crea ahí un texto nuevo ya conectado, listo para escribir.
- **Opciones.** Al tocar una línea aparece su barra de opciones:
  - **Flecha:** la muestra o la quita.
  - **Punteada:** cambia la línea a punteada o continua.
  - **Invertir:** cambia el sentido.
  - **Agregar texto:** pone un rótulo en el medio de la línea. Doble clic en la línea hace lo mismo.
- Las líneas siguen a lo que unen cuando se mueve. Si se borra una de las dos puntas, la línea se borra también.

### Textos

- **Crear un texto.** Doble clic en el fondo o en la atmósfera, o la herramienta Texto (`T`) y luego un clic donde va.
- **Editar.** Doble clic en el texto, o elegirlo y apretar `Enter`.
- **Terminar de escribir.** Clic afuera, `Esc` o `Ctrl + Enter`.
- **Tamaños.** Chico, Mediano y Grande, desde la barra de opciones.
- **Ancho.** Se cambia desde la esquina. El alto se ajusta solo al texto.
- **Textos vacíos.** Un texto que queda vacío desaparece al salir de él.

### Stickers

- **Qué hay.** Estrellas de 5 puntas sin borde, en **rosado, celeste, amarillo y negro**.
- **Ponerlas.** Se abren con el botón ☆ de la barra o la tecla `S`. Si se toca una estrella, aparece en el centro de la vista; si se arrastra, queda donde se suelta.
- **Opciones.** Al elegir una estrella se le puede cambiar el color, cambiar el tamaño desde la esquina, o borrarla.
- **Color fijo.** Su color no cambia con la paleta.

### Elegir varias cosas

- `Shift + clic` suma o quita un elemento de la selección.
- `Shift + arrastrar` en el fondo dibuja una caja: elige todo lo que toca.
- `Ctrl + A` elige todas las fichas, textos y stickers.
- Varias cosas elegidas se mueven juntas y se borran juntas. Si todas son del mismo tipo, también se les pueden cambiar las opciones de una vez: tamaño de texto, color de estrella, o flecha y punteada en las líneas.

### Paletas de colores

El botón «Paleta» cambia solo los colores: fondo, paneles, fichas, líneas y el tono de la atmósfera de cada nodo. Las cuatro usan tonos claros y pasteles:

| Paleta | Atmósferas |
| --- | --- |
| **Formal** (la de partida, la más cercana al gris del v20) | gris azulado, beige, salvia |
| **Girlie** | rosado, lila, durazno |
| **Oscura** (fondo oscuro, elementos pastel) | lavanda, menta, rosado |
| **Infantil** | amarillo, celeste, verde menta |

### Deshacer y guardar

- **Deshacer y rehacer:** `Ctrl + Z` deshace. `Ctrl + Shift + Z` o `Ctrl + Y` rehace.
- **Guardar:** el botón Guardar o `Ctrl + S`. El botón se enciende cuando hay cambios. Al lado aparece «Sin guardar», «Guardado» o «No se pudo guardar». Si falla, el motivo aparece al pasar el mouse sobre el aviso, y también en la consola del navegador (F12).
- **Al cerrar la página:** si hay cambios sin guardar, el navegador pregunta antes de salir o recargar.
- **Lo que se recupera al volver a abrir:** el tablero, la paleta y el lugar donde se estaba mirando.

### Todos los atajos

| Tecla | Hace |
| --- | --- |
| `V` · `T` · `L` · `S` | Mover · Texto · Conectar · Stickers |
| `Supr` / `Retroceso` | Borrar lo elegido (los trabajos vuelven a la lista) |
| `Enter` | Editar el texto elegido, el texto de la línea elegida, o ver en grande el trabajo elegido |
| `Esc` | Cerrar menús o stickers → quitar la selección → volver a Mover → cerrar la lista |
| `Ctrl + Z` / `Ctrl + Y` | Deshacer / rehacer |
| `Ctrl + S` | Guardar |
| `Ctrl + A` | Elegir todo |
| `Espacio` + arrastrar | Desplazarse |
| `Shift + 1` | Ver todo |
| `+` / `-` | Acercar / alejar |

---

## 3. Limitaciones

### Qué no hace (por diseño)

- **Un trabajo está en un solo lugar.** No puede estar en dos nodos a la vez, como sí podía en el v20. Una ficha entre dos atmósferas pertenece a la más chica, o a ninguna.
- **Los nodos los define la carrera.** El estudiante puede moverlos y cambiarles el tamaño, pero no crearlos, borrarlos ni renombrarlos.
- **Solo se conectan fichas y textos.** No se pueden conectar stickers ni nodos.
- **Las líneas son rectas.** No hay curvas, codos, colores ni grosores. Si dos cosas conectadas se superponen, su línea no se dibuja.
- **Los textos son planos.** No hay negrita, colores ni listas; solo los tres tamaños. Lo que se pega desde otro lado llega sin formato.
- **Hay un solo tipo de sticker:** la estrella, en 4 colores fijos.
- **No hay** copiar y pegar elementos, duplicar, alinear, agrupar, bloquear, ni exportar el tablero como imagen.
- **No hay colaboración.** Cada estudiante ve y edita solo su tablero. La carrera no tiene aquí una vista de todos los tableros: eso se lee en la planilla.

### Guardado

- **No hay guardado automático.** Hay que apretar Guardar. Lo que no se guarda se pierde al cerrar, aunque el navegador avisa antes de salir.
- **Deshacer se pierde al recargar.** El historial guarda hasta 150 pasos. Cambiar la paleta no se deshace con `Ctrl + Z`.
- **Dos pestañas abiertas:** si el mismo estudiante tiene el tablero abierto en dos pestañas, gana la última que guarde y lo de la otra se pierde.
- **Tamaño máximo:** el tablero se guarda en una sola celda de Sheets, que admite hasta 50.000 caracteres. Alcanza para unos cuantos cientos de elementos. Si se pasa, aparece «No se pudo guardar» con el motivo.
- **Topes de lo que acepta el servidor.** Lo que se pasa de estos números se descarta al guardar:

| Qué | Máximo |
| --- | --- |
| Textos | 300 |
| Stickers | 300 |
| Líneas | 600 |
| Largo de un texto | 2.000 caracteres |
| Largo del texto de una línea | 300 caracteres |

- **La paleta en la vista de ejemplo:** el navegador la recuerda, pero el tablero se reinicia en cada recarga, porque ahí no hay guardado.

### Imágenes y videos

- **Las miniaturas vienen de Drive.** Si Drive no las entrega, por permisos o porque el archivo aún se está procesando, la ficha se ve como un rectángulo gris. Sigue funcionando; solo le falta la imagen.
- **Imágenes pesadas.** Pueden tardar en aparecer. Se piden achicadas: 640 px para el tablero y 1600 px para el visor.
- **Videos de Drive.** Se reproducen con el reproductor de Drive. Si no carga, el visor ofrece el enlace «Abrir en Drive».

### Pantallas táctiles y celulares

- **Se puede usar** con los dedos: arrastrar, pellizcar para el zoom, y tocar para elegir.
- **El doble toque no es confiable.** Para escribir se usa la herramienta Texto; para ver en grande, el botón de la barra de opciones.
- **La lista ocupa toda la pantalla.** Al empezar a arrastrar un trabajo se cierra sola para dejar ver el tablero.
- **El mouse no existe.** Los puntos azules para conectar dependen de pasar el mouse por encima, así que en pantallas táctiles conviene usar la herramienta Conectar.

### Técnicas

- **Navegadores:** necesita uno actual (Chrome, Edge, Firefox o Safari de los últimos dos años), porque usa unidades de contenedor y colores con transparencia en CSS.
- **Tamaño del archivo:** `index.html` pesa unos 270 KB. Casi todo es la tipografía Work Sans, que va incrustada porque Apps Script no permite subir archivos sueltos.
- **Ids de trabajos:** el servidor no revisa que los ids guardados sean de trabajos del propio estudiante. No es un riesgo, porque cada uno solo puede escribir su propia fila.
- **Lo guardado por versiones anteriores:** la clasificación del v20 (pestaña `clasificacion`) no se importa: el v30 empieza con el tablero vacío. Un tablero del v30 guardado antes de que los nodos fueran círculos se convierte solo a círculos.

---

## 4. Cómo se publica

1. Crear un proyecto de Apps Script aparte del formulario.
2. Copiar `code.gs` en el archivo `Código.gs` del proyecto.
3. Crear un archivo HTML llamado `index` y pegar ahí `index.html`.
4. Revisar `SPREADSHEET_ID`. Es el id de la planilla donde escribe el formulario: lo que va entre `/d/` y `/edit` en su dirección.
5. **Implementar → Nueva implementación → Aplicación web.** Darle acceso a las cuentas del dominio. Para que cada estudiante vea solo lo suyo, el script tiene que poder leer su correo: los estudiantes tienen que estar en el mismo dominio que el dueño del script.
6. La primera vez que alguien guarda, se crea sola la pestaña `tablero` al final de la planilla.

Para revisar que todo funcione, desde el editor de Apps Script:

- `diagnostico()` muestra el correo detectado, cuántos trabajos encontró y qué tiene guardado.
- `probarGuardado()` lee el tablero guardado y lo vuelve a guardar igual. Prueba la escritura sin cambiar nada.

> La pestaña donde escribe el formulario tiene que ser siempre **la primera**. Si `tablero` o `clasificacion` quedan primeras, el visualizador muestra un error que dice cómo arreglarlo.

### Qué queda en la planilla

La pestaña `tablero` tiene una fila por estudiante:

| correo | tablero | clasificacion | actualizado |
| --- | --- | --- | --- |
| quien guardó | todo el tablero en JSON | `{ "idDelTrabajo": ["forma"], ... }` | fecha del último guardado |

La columna `clasificacion` se deduce del tablero: en qué nodo cayó cada trabajo. Está aparte para poder leerla sin abrir el JSON.

---

## 5. Cómo funciona el código

### `code.gs` (servidor)

- **`doGet()` y `reunirArchivo()`** identifican al estudiante por su correo, leen sus filas de la planilla y su tablero guardado, y lo **incrustan todo en la página** como `DATOS`. Así la página no tiene que pedir nada al servidor después de abrir.
- **`guardarTablero()`** recibe el tablero entero. Antes de escribir, lo pasa por **`limpiarTablero()`**, que descarta lo que no tenga la forma esperada y aplica los topes de la sección 3. Escribe la fila del estudiante con un cerrojo, para que dos guardados no se pisen a medio escribir.

### `index.html` (navegador)

El script está dividido en 12 secciones numeradas.

**Los datos mandan.** Todo lo que el estudiante arma vive en un solo objeto:

```js
tablero = {
  nodos:    { forma: {x, y, w, h}, ... }   // círculos: w = h
  fichas:   { idObra: {x, y, w} }          // el alto sale de la proporción de la imagen
  textos:   [{ id, x, y, w, texto, tam }]
  stickers: [{ id, x, y, w, color }]
  lineas:   [{ id, de, a, flecha, punteada, texto }]
}
```

- **Referencias.** Cada elemento se identifica con una referencia de texto: `o:` más el id de la obra, `t:` para un texto, `s:` para un sticker, `l:` para una línea y `n:` para un nodo.
- **Cambios.** Cada acción cambia `tablero` y llama a `pintar()`, que redibuja a partir de los datos. Los elementos de la página se reutilizan, así que mover una ficha no recarga su imagen.
- **Tablero infinito.** Todo está dentro de un div, `mundo`, que se desplaza y se escala con `transform` según `vista = {x, y, z}`. `aMundo()` convierte un punto de la pantalla en un punto del tablero.
- **Gestos.** Al tocar, el `pointerdown` decide un solo gesto según lo que hay debajo y la herramienta elegida: mover, cambiar tamaño, conectar, caja de selección o desplazarse. Cada gesto tiene `mover()` y `soltar()`. Al soltar se llama a `confirmar()`, que hace tres cosas:
  - guarda una foto del tablero para deshacer;
  - actualiza la lista;
  - enciende el aviso «Sin guardar».
- **Líneas imantadas.** Las líneas no guardan coordenadas: solo qué unen. `geometria()` traza la recta entre los centros de los dos elementos y la recorta de borde a borde.
- **Clasificación.** `nodoEn()` decide a qué nodo pertenece cada trabajo, según dónde cae su centro.
- **Paletas.** Son bloques de variables CSS en `:root[data-tema="..."]`. `aplicarTema()` cambia el atributo y el navegador recolorea todo.

---

## 6. Dónde cambiar cosas

| Qué | Dónde |
| --- | --- |
| Nombre y definición de los nodos | `CATEGORIAS` en `code.gs`. La definición, si se escribe, aparece en el núcleo |
| Orden de los cursos en la lista | `LINEAS_CURRICULARES` en `code.gs` |
| Activar o desactivar el guardado | `GUARDAR_TABLERO` en `code.gs` |
| Topes de lo que se guarda | `LIMITES` en `code.gs` |
| Colores de cada paleta | bloques `:root[data-tema=...]` al inicio del `<style>`, más sus muestras en `TEMAS` del script. Si se agrega una paleta, sumarla también a `TEMAS` en `code.gs` |
| Colores de las estrellas | `ESTRELLAS` en el script. Si se agrega un color, sumarlo también a `COLORES_STICKER` en `code.gs` |
| Tamaño de nodos, fichas y stickers nuevos | `NODO.diametro`, `ANCHO_FICHA`, `TAMANO_STICKER` |
| Hasta dónde llega el área de un nodo | `ALCANCE_NODO` (0.88 = 88% del radio) |
| Posición inicial de los nodos | `nodoPorDefecto()` |
| Límites del zoom | `ZOOM_MIN`, `ZOOM_MAX` |
