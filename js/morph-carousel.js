/* ============================================================
   CARRUSEL MORPH — sección fijada al scroll (GSAP + ScrollTrigger).

   Tres estados físicos por imagen:
     miniatura NEXT (abajo-derecha) → imagen PRINCIPAL → miniatura
     PREV (arriba-izquierda). Cada figura vive en una sola capa DOM
     permanente, dimensionada como la caja principal, y viaja entre
     estados con transforms (x / y / scale) calculados estilo FLIP a
     partir de las cajas guía .mc-slot. Nunca se anima layout ni se
     reordenan nodos: el apilado se resuelve con z-index en función
     del progreso, así no hay parpadeos al invertir la dirección.

   El render es una función pura del progreso de scroll, por lo que
   retroceder reproduce la animación exactamente a la inversa.
   ============================================================ */
(function () {
  'use strict';

  var section = document.getElementById('mcarousel');
  if (!section || section.dataset.mcInit) return;
  section.dataset.mcInit = '1';

  /* Contenido separado de la lógica: para sumar, quitar o reordenar
     ítems alcanza con editar este arreglo. */
  var ITEMS = [
    {
      image: 'assets/photos/transporte-agro.png',
      alt: 'Cosechadora trasladada sobre carretón de Rosso Maquinarias por camino rural.',
      title: 'Agrícola',
      desc: 'Cosechadoras, tractores y sembradoras trasladadas de campo a campo o entre provincias.'
    },
    {
      image: 'assets/photos/hero-transporte.png',
      alt: 'Camión de Rosso Maquinarias transportando maquinaria pesada en ruta.',
      title: 'Pesada',
      desc: 'Excavadoras, palas y equipos fuera de gálibo llevados hasta obra con estudio de ruta.'
    },
    {
      image: 'assets/photos/soldador.png',
      alt: 'Soldador trabajando en un montaje industrial.',
      title: 'Montajes',
      desc: 'Armado, traslado interno y puesta en posición de líneas, silos, tanques y estructuras.'
    },
    {
      image: 'assets/photos/izaje-ypf.png',
      alt: 'Grúa de Rosso Maquinarias izando un tótem YPF.',
      title: 'Izaje',
      desc: 'Grúas hidráulicas de 20 a 100 toneladas, con plan de izaje y operadores habilitados.'
    },
    {
      image: 'assets/photos/autoelevador.png',
      alt: 'Autoelevador moviendo carga dentro de planta.',
      title: 'Autoelevador',
      desc: 'Pallets, bobinas y equipos movidos dentro de planta, depósito y playa.'
    }
  ];

  function el(tag, className, parent) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (parent) parent.appendChild(node);
    return node;
  }

  function indexLabel(i, total) {
    var pad = function (v) { return String(v).padStart(2, '0'); };
    return '[ ' + pad(i + 1) + '/' + pad(total) + ' ]';
  }

  function buildCopyItem(parent, item, i) {
    var article = el('article', 'mc-item', parent);
    el('span', 'mc-item__index', article).textContent = indexLabel(i, ITEMS.length);
    el('h3', 'mc-item__title', article).textContent = item.title;
    el('p', 'mc-item__desc', article).textContent = item.desc;
    var cta = el('a', 'btn mc-item__cta', article);
    cta.href = '#contacto';
    cta.textContent = 'Cotizar este servicio';
    return article;
  }

  /* Sin GSAP o con reduced-motion: mismos contenidos como lista
     apilada, sin pin ni morphing. */
  function buildStatic() {
    section.setAttribute('data-mc-static', '');
    var list = el('div', 'mc-static', section);
    ITEMS.forEach(function (item, i) {
      var block = el('div', 'mc-static-item', list);
      var img = el('img', null, block);
      img.src = item.image;
      img.alt = item.alt;
      if (i > 0) img.loading = 'lazy';
      buildCopyItem(block, item, i);
    });
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || !window.ScrollTrigger || reduceMotion) {
    buildStatic();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- DOM ---------- */
  var stage = el('div', 'mc-stage', section);
  var slotPrev = el('div', 'mc-slot mc-slot--prev', stage);
  var slotMain = el('div', 'mc-slot mc-slot--main', stage);
  var slotNext = el('div', 'mc-slot mc-slot--next', stage);

  var figures = ITEMS.map(function (item, i) {
    var fig = el('figure', 'mc-figure', stage);
    var img = el('img', null, fig);
    img.src = item.image;
    img.alt = item.alt;
    img.draggable = false;
    if (i > 1) img.loading = 'lazy';
    return fig;
  });

  var copy = el('div', 'mc-copy', stage);
  var texts = ITEMS.map(function (item, i) {
    return buildCopyItem(copy, item, i);
  });

  /* ---------- Animación ---------- */
  var ctx = gsap.context(function () {
    var N = ITEMS.length;
    var IDENT = { x: 0, y: 0, s: 1 };
    var A = { prev: IDENT, next: IDENT }; // estados FLIP relativos a la caja principal
    var vPrev = { x: 0, y: 0 };           // prolongación de la diagonal más allá de cada miniatura
    var vNext = { x: 0, y: 0 };
    var prox = { p: 0 };                  // progreso continuo: 0 … N-1
    var easeSeg = gsap.parseEase('power2.inOut');

    function anchor(slotRect, mainRect) {
      return {
        x: slotRect.left - mainRect.left,
        y: slotRect.top - mainRect.top,
        s: slotRect.width / mainRect.width
      };
    }

    function mix(a, b, u) {
      return {
        x: a.x + (b.x - a.x) * u,
        y: a.y + (b.y - a.y) * u,
        s: a.s + (b.s - a.s) * u
      };
    }

    /* Las miniaturas quedan opacas en reposo; los ítems que entran o
       salen del recorrido se funden justo antes/después de su lugar
       de miniatura, nunca en la posición principal. */
    function fadeAt(t) {
      var a = Math.abs(t);
      if (a <= 1) return 1;
      if (a >= 1.6) return 0;
      return 1 - (a - 1) / 0.6;
    }

    /* La figura entrante (t negativo) queda por encima de la saliente
       con el mismo |t|, cumpliendo "incoming above outgoing" sin tocar
       el orden del DOM. */
    function zAt(t) {
      var closeness = 2.2 - Math.min(Math.abs(t), 2.2);
      return Math.round(closeness * 40) + (t < -0.02 ? 10 : 0);
    }

    function render() {
      var p = prox.p;
      var i, t, st, e;

      for (i = 0; i < N; i++) {
        t = p - i; // -1: miniatura next · 0: principal · 1: miniatura prev
        var fig = figures[i];

        if (t < -2.05 || t > 2.05) {
          gsap.set(fig, { autoAlpha: 0 });
          continue;
        }

        if (t <= -1) {
          e = Math.min(-(t + 1), 1.05);
          st = { x: A.next.x + vNext.x * e, y: A.next.y + vNext.y * e, s: A.next.s };
        } else if (t < 0) {
          st = mix(A.next, IDENT, easeSeg(t + 1));
        } else if (t <= 1) {
          st = mix(IDENT, A.prev, easeSeg(t));
        } else {
          e = Math.min(t - 1, 1.05);
          st = { x: A.prev.x + vPrev.x * e, y: A.prev.y + vPrev.y * e, s: A.prev.s };
        }

        gsap.set(fig, { x: st.x, y: st.y, scale: st.s, autoAlpha: fadeAt(t) });
        fig.style.zIndex = String(zAt(t));
      }

      /* Texto secundario al morph: opacidad + desplazamiento corto.
         Se apaga hacia la mitad de la transición, donde el contenido
         "cambia", y el entrante vuelve desde abajo (o arriba si se
         retrocede). */
      for (i = 0; i < N; i++) {
        var d = p - i;
        var alpha = 1 - Math.min(Math.max((Math.abs(d) - 0.12) / 0.33, 0), 1);
        gsap.set(texts[i], {
          autoAlpha: alpha,
          y: Math.max(-1, Math.min(1, d)) * -18
        });
        texts[i].style.pointerEvents = alpha > 0.6 ? 'auto' : 'none';
      }
    }

    /* Mide las cajas guía y fija la geometría base de cada figura
       (idéntica a la caja principal). Sólo acá se tocan propiedades
       de layout; el scroll anima únicamente transforms. */
    function measure() {
      /* Primero se publica el alto real del texto: en móvil las cajas
         guía reservan la franja inferior a partir de --mc-copy-h, así
         que tiene que estar puesto antes de leer sus rects. Los ítems
         comparten celda de grid, de modo que el más alto marca la
         franja para todos. Leerlo no es circular: el alto del bloque
         de texto depende del contenido, nunca de la variable. */
      var copyH = 0;
      for (var k = 0; k < texts.length; k++) {
        copyH = Math.max(copyH, texts[k].getBoundingClientRect().height);
      }
      stage.style.setProperty('--mc-copy-h', Math.ceil(copyH) + 'px');

      var m = slotMain.getBoundingClientRect();
      var stageRect = stage.getBoundingClientRect();
      A.prev = anchor(slotPrev.getBoundingClientRect(), m);
      A.next = anchor(slotNext.getBoundingClientRect(), m);
      /* La prolongación de la diagonal se acorta en pantallas chicas:
         ahí el borde del viewport y la franja de texto quedan a pocos
         píxeles de la miniatura, y un ítem en cola —aunque entre casi
         transparente— no debe asomarse a ninguno de los dos. */
      var ext = window.matchMedia('(max-width:860px)').matches ? 0.07 : 0.16;
      vPrev = { x: A.prev.x * ext, y: A.prev.y * ext };
      vNext = { x: A.next.x * ext, y: A.next.y * ext };
      gsap.set(figures, {
        left: m.left - stageRect.left,
        top: m.top - stageRect.top,
        width: m.width,
        height: m.height
      });
      render();
    }

    gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: function () {
          return '+=' + Math.round((N - 1) * window.innerHeight * 1.15);
        },
        pin: true,
        /* <main> es display:flex y en ese caso ScrollTrigger apaga el
           espaciador por defecto, dejando que la sección siguiente se
           monte encima del pin: se fuerza explícito. */
        pinSpacing: true,
        scrub: 0.5,
        /* Ajuste suave hacia el estado completo más cercano; corto y
           con retardo para no pelear contra el scroll del usuario.
           inertia:false ignora la velocidad del gesto: sin eso, un
           golpe fuerte de rueda proyecta el snap varios ítems más
           allá (o hasta los extremos) en vez de asentar el vecino. */
        snap: {
          snapTo: 1 / (N - 1),
          duration: { min: 0.2, max: 0.5 },
          delay: 0.1,
          ease: 'power1.inOut',
          inertia: false
        },
        invalidateOnRefresh: true
      }
    }).to(prox, { p: N - 1, ease: 'none', duration: 1, onUpdate: render });

    ScrollTrigger.addEventListener('refresh', measure);
    measure();

    /* Las tipografías cargan con font-display:swap y pueden asentarse
       después del load: al cambiar el alto del texto hay que rehacer la
       medición o la franja inferior queda con el valor de la fuente
       provisoria. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  }, section);

  /* Sitio estático sin rerenders, pero el contexto queda expuesto por
     si la sección se desmonta dinámicamente en el futuro. */
  section.mcCleanup = function () { ctx.revert(); };
})();
