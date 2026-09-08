/* ============================================================
   BOTÓN FLOTANTE DE WHATSAPP — visible sólo al subir.

   Dos condiciones para mostrarlo:
     1. que el movimiento acumulado hacia arriba pase un umbral, y
     2. que la hero ya haya quedado atrás.

   La segunda no es un capricho: la tarjeta de la hero se apoya en la
   misma esquina inferior derecha (en tablet y mobile, exactamente
   encima del botón), y mientras la portada está en pantalla todavía
   no hay nada "a lo que volver". Se mide contra el alto real del
   bloque de la hero en vez de un número fijo de píxeles, así vale
   igual en desktop, donde queda fijada por scroll, que en mobile.
   ============================================================ */
(function () {
  'use strict';

  var fab = document.getElementById('wa-fab');
  if (!fab) return;

  var root = document.documentElement;
  var heroWrap = document.getElementById('hero-wrap');
  var THRESHOLD = 48;   // px acumulados en una dirección antes de reaccionar

  var last = window.scrollY;
  var acc = 0;
  var visible = false;
  var ticking = false;

  function setVisible(v) {
    if (v === visible) return;
    visible = v;
    fab.classList.toggle('is-visible', v);
  }

  function overHero() {
    if (!heroWrap) return false;
    /* 80px de tolerancia: el botón no asoma justo en el borde. */
    return heroWrap.getBoundingClientRect().bottom > 80;
  }

  function render() {
    ticking = false;

    var y = window.scrollY;
    var d = y - last;
    last = y;
    if (d === 0) return;

    if (overHero() || root.classList.contains('rm-locked')) {
      acc = 0;
      setVisible(false);
      return;
    }

    /* Se acumula el movimiento por dirección y se reinicia al cambiar
       de sentido: un gesto corto de más no alcanza para encender el
       botón, y el temblor del trackpad —o el ajuste del carrusel, que
       puede corregir hacia arriba— tampoco. */
    if ((d < 0) !== (acc < 0)) acc = 0;
    acc += d;

    if (acc <= -THRESHOLD) setVisible(true);
    else if (acc >= THRESHOLD) setVisible(false);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(render);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  /* Al cambiar el tamaño cambia el alto de la hero: si el botón quedó
     visible sobre ella, se corrige en el siguiente cuadro. */
  window.addEventListener('resize', function () {
    if (visible && overHero()) setVisible(false);
  });
})();
