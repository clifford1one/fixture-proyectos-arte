# -*- coding: utf-8 -*-
"""
Arma un index.html con todo adentro, listo para pegar en Apps Script.

El editor solo acepta .gs y .html, así que style.css y script.js no se
pueden subir sueltos. En vez de partirlos en tres archivos, se meten
dentro del index: la página servida es idéntica y en Apps Script queda
un archivo en lugar de tres.

Lo único que sigue necesitando la plantilla es <?!= datosJson ?>, que es
por donde doGet() inyecta los trabajos del estudiante.

    python visualizador-v1/preparar-appsscript.py

Deja para-appsscript/index.html. Se copia entero y se pega en el
index.html de Apps Script. code.gs va aparte, tal cual.
"""

import io
import os

BASE = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.join(BASE, 'para-appsscript')


def leer(nombre):
    return io.open(os.path.join(BASE, nombre), encoding='utf-8').read()


# Un "</style>" dentro del CSS, o un "</script>" dentro del JS, cerrarían
# el bloque antes de tiempo y romperían la página en silencio.
def revisar(nombre, contenido, cierre):
    if cierre in contenido:
        raise SystemExit(
            'ERROR: %s contiene "%s" y cerraria el bloque antes de tiempo.\n'
            'Hay que partir esa cadena antes de poder inlinear el archivo.'
            % (nombre, cierre))


css = leer('style.css').rstrip()
js = leer('script.js').rstrip()

revisar('style.css', css, '</style')
revisar('script.js', js, '</script')

html = leer('index.html')

# El <head>: fuera las tres lineas que sirven para abrirlo suelto, y
# adentro el CSS. El <base> hace que los enlaces salgan del iframe de
# Apps Script en vez de abrirse dentro.
local = """  <!-- Así el archivo se puede abrir suelto para revisar la página.
       Al publicar en Apps Script estas tres líneas cambian: ver el
       README, sección "Publicar en Apps Script". -->
  <link rel="stylesheet" href="style.css">
  <script src="datos-ejemplo.js"></script>
  <script src="script.js" defer></script>"""

assert html.count(local) == 1, 'no se encontro el bloque del <head>'
html = html.replace(local, '  <base target="_top">\n\n  <style>\n' + css + '\n  </style>')

# Los datos y la logica van al final del body: asi el script encuentra el
# marcado ya construido y no hace falta defer.
cierre = '\n</body>'
assert html.count(cierre) == 1, 'no se encontro el cierre del <body>'
html = html.replace(
    cierre,
    '\n  <script>const DATOS = <?!= datosJson ?>;</script>\n\n'
    '  <script>\n' + js + '\n  </script>\n\n</body>')

os.makedirs(SALIDA, exist_ok=True)

# Si quedaron los tres archivos de la version anterior, estorban.
for viejo in ('style.html', 'script.html'):
    ruta = os.path.join(SALIDA, viejo)
    if os.path.exists(ruta):
        os.remove(ruta)
        print('  (borrado el %s de la version anterior)' % viejo)

ruta = os.path.join(SALIDA, 'index.html')
io.open(ruta, 'w', encoding='utf-8', newline='\n').write(html)

print('  index.html   %d lineas, %d KB' % (html.count('\n'), len(html) // 1024))

print("""
Listo. En Apps Script son dos archivos:

  index.html   <- para-appsscript/index.html   (todo adentro: CSS, JS y marcado)
  code.gs      <- code.gs                      (tal cual, sin convertir)

No hacen falta style.html ni script.html.""")
