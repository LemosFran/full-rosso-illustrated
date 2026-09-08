/* ============================================================
   REVELADO AL SUBIR — barra fija y botón de WhatsApp.

   Los dos comparten exactamente la misma condición, así que los
   maneja un solo listener: dos acumuladores de dirección separados
   se desincronizan y terminan mostrando uno sin el otro.

   Aparecen cuando:
     1. el movimiento acumulado hacia arriba pasa un umbral, y
     2. la hero ya quedó atrás.

   La segunda condición no es estética solamente. La portada trae su
   propia barra de navegación arriba y su propia tarjeta en la
   esquina inferior derecha —en tablet y mobile, justo donde va el
   botón—, de modo que mientras está en pantalla cualquiera de los
   dos quedaría duplicado o encimado. Se mide contra el borde
   inferior real del bloque de la hero y no contra una cantidad fija
   de píxeles, así vale igual en desktop, donde queda fijada por
   scroll, que en mobile.
   ============================================================ */
(function () {
  'use strict';

  var targets = ['sticky-nav', 'wa-fab']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  if (!targets.length) return;

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
    for (var i = 0; i < targets.length; i++) {
      targets[i].classList.toggle('is-visible', v);
    }
  }

  function overHero() {
    if (!heroWrap) return false;
    /* 80px de tolerancia: no asoman justo sobre el borde. */
    return heroWrap.getBoundingClientRect().bottom > 80;
  }

  function render() {
    ticking = false;

    var y = window.scrollY;
    var d = y - last;
    last = y;
    if (d === 0) return;

    /* Movimiento que no hizo el usuario —el ajuste del carrusel, que
       avisa con window.rmAutoScroll— se descarta sin tocar el
       acumulador: si no, el reacomodo posterior a soltar el scroll
       encendía o apagaba la barra por su cuenta. */
    if (window.rmAutoScroll > 0) return;

    if (overHero() || root.classList.contains('rm-locked')) {
      acc = 0;
      setVisible(false);
      return;
    }

    /* Se acumula el movimiento por dirección y se reinicia al cambiar
       de sentido: un gesto corto de más no alcanza para encenderlos, y
       el temblor del trackpad —o el ajuste del carrusel, que puede
       corregir hacia arriba— tampoco. */
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

  /* En cuanto el usuario vuelve a tomar el control se limpia la marca
     de scroll automático: retoma el mando en el acto aunque haya un
     ajuste a mitad de camino, y de paso evita que la marca quede
     trabada si algún aviso de cierre no llegara a dispararse. */
  ['wheel', 'touchstart', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function () { window.rmAutoScroll = 0; }, { passive: true });
  });
  /* Al cambiar el tamaño cambia el alto de la hero: si quedaron
     visibles sobre ella, se corrige en el siguiente cuadro. */
  window.addEventListener('resize', function () {
    if (visible && overHero()) setVisible(false);
  });

  /* Al tocar un enlace de la barra el destino queda debajo de ella;
     scroll-padding-top (88px, en el CSS base) ya deja ese aire. */
})();
