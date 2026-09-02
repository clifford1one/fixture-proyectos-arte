/* =========================================================
   Prueba desechable: ¿se puede insertar un video de YouTube
   dentro de un web app de Apps Script?

   Es la única pregunta que no se puede responder abriendo un
   archivo local, porque HtmlService sirve la página dentro de
   su propio iframe y el video queda como iframe dentro de
   iframe. Se responde en cinco minutos y no requiere tocar
   nada del proyecto real.

   CÓMO USARLA
   1. script.google.com → Nuevo proyecto.
   2. Pega esto en Code.gs, reemplazando lo que haya.
   3. Cambia ID_DE_PRUEBA por el video que quieras.
   4. Implementar → Nueva implementación → Aplicación web.
      Ejecutar como: Yo. Acceso: cualquier usuario de tu dominio.
   5. Abre la URL. Si el video se reproduce, la respuesta es sí.

   Cuando termines, borra el proyecto: no tiene nada más adentro.
   ========================================================= */

const ID_DE_PRUEBA = 'A1_u4n5Cz2w';

function doGet() {
  const html =
    '<!DOCTYPE html><html><head><base target="_top">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<style>' +
    'body{margin:0;padding:2rem 1.25rem;background:#f5f5f5;color:#1a1a1a;' +
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}' +
    '.hoja{max-width:44rem;margin:0 auto}' +
    'h1{font-size:1.125rem;margin:0 0 .5rem}' +
    'p{font-size:.875rem;color:#555;margin:0 0 1.5rem}' +
    '.marco{position:relative;aspect-ratio:16/9;border:1px solid #1a1a1a;' +
    'border-radius:3px;overflow:hidden;background:#e4e4e4}' +
    '.marco iframe{position:absolute;inset:0;width:100%;height:100%;border:0}' +
    'ul{font-size:.8125rem;color:#555;line-height:1.7;padding-left:1.1rem}' +
    '</style></head><body><div class="hoja">' +

    '<h1>¿Se ve el video acá adentro?</h1>' +
    '<p>Esta página la sirve Apps Script, así que el video de abajo es un ' +
    'iframe dentro de otro iframe. Es exactamente la situación del ' +
    'visualizador.</p>' +

    '<div class="marco">' +
    '<iframe src="https://www.youtube-nocookie.com/embed/' + ID_DE_PRUEBA + '"' +
    ' allow="autoplay; encrypted-media; picture-in-picture"' +
    ' referrerpolicy="strict-origin-when-cross-origin"' +
    ' allowfullscreen></iframe>' +
    '</div>' +

    '<ul>' +
    '<li><strong>Se ve y se reproduce</strong> → el visualizador puede mostrar ' +
    'videos de YouTube. No hay nada más que revisar.</li>' +
    '<li><strong>Sale un recuadro gris o en blanco</strong> → el dominio está ' +
    'bloqueando el iframe anidado. Habría que abrir el video en pestaña nueva ' +
    'en vez de insertarlo.</li>' +
    '<li><strong>Dice «Video no disponible»</strong> → el problema es del video, ' +
    'no del iframe: está privado, o tiene la inserción desactivada.</li>' +
    '</ul>' +

    '</div></body></html>';

  return HtmlService.createHtmlOutput(html)
    .setTitle('Prueba de inserción')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
