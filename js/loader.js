/* ============================================================
   LOADER DE ENTRADA — portado de getlayer-prueba.

   La barra no mide la carga real: marca un piso de permanencia
   (MIN_VISIBLE) que arranca recién cuando la página terminó de
   cargar, con un tope por si ese evento tarda o no llega. Así el
   panel nunca parpadea en una conexión rápida ni se eterniza en una
   lenta. Al terminar, todo el panel sube y se descarta.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var loader = document.getElementById('rm-loader');
  if (!loader || !root.classList.contains('rm-loading')) return;

  var fill = document.getElementById('rm-loader__fill');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var EASE = 'cubic-bezier(.65,0,.35,1)';
  var MIN_VISIBLE = reduced ? 200 : 1400;   // piso de permanencia
  var MAX_VISIBLE = 2600;                   // tope: arranca la cuenta aunque load no llegue
  var EXIT = reduced ? 0 : 850;

  /* La marca entra con un fundido corto (lo hace el CSS); la barra
     avanza durante el piso de permanencia, con el mismo retardo que
     el original para que empiece después de la marca. */
  requestAnimationFrame(function () { loader.classList.add('is-in'); });

  fill.style.transition = 'transform ' + Math.max(0, MIN_VISIBLE - 120) + 'ms ' + EASE;
  fill.style.transitionDelay = '120ms';
  requestAnimationFrame(function () { fill.style.transform = 'scaleX(1)'; });

  var done = false;
  function finish() {
    if (done) return;
    done = true;
    clearTimeout(window.rmLoaderFailsafe);

    /* La hero se revela con scroll, así que el sitio tiene que quedar
       arriba de todo cuando el panel se corre. */
    window.scrollTo(0, 0);
    root.classList.remove('rm-locked');

    loader.style.transition = 'transform ' + EXIT + 'ms ' + EASE;
    requestAnimationFrame(function () { loader.style.transform = 'translateY(-105%)'; });

    setTimeout(function () {
      if (loader.parentNode) loader.parentNode.removeChild(loader);
      root.classList.remove('rm-loading');
      /* Los pins se midieron con el scroll bloqueado; recalcularlos
         acá evita arrastrar posiciones tomadas en ese estado. */
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }, EXIT);
  }

  var countdown = null;
  function startCountdown() {
    if (countdown !== null) return;
    countdown = setTimeout(finish, MIN_VISIBLE);
  }

  if (document.readyState === 'complete') startCountdown();
  else window.addEventListener('load', startCountdown);

  setTimeout(startCountdown, MAX_VISIBLE);            // load que tarda de más
  setTimeout(finish, MAX_VISIBLE + MIN_VISIBLE);      // red final
})();
