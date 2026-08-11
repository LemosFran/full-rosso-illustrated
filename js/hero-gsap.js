(function () {
  'use strict';

  /* ---------- Video play/pause toggle (independent of GSAP) ---------- */
  var video = document.getElementById('hero-crane-video');
  var toggle = document.getElementById('hero-crane-toggle');
  if (video && toggle) {
    var updateToggle = function (isPlaying) {
      toggle.classList.toggle('is-playing', isPlaying);
      toggle.setAttribute('aria-pressed', String(isPlaying));
      toggle.setAttribute('aria-label', isPlaying ? 'Pausar video' : 'Reproducir video');
    };
    toggle.addEventListener('click', function () {
      if (video.paused) video.play().catch(function () {});
      else video.pause();
    });
    video.addEventListener('play', function () { updateToggle(true); });
    video.addEventListener('pause', function () { updateToggle(false); });
  }

  /* ---------- Scroll-reveal effect (GSAP + ScrollTrigger) ---------- */
  var html = document.documentElement;
  var heroWrap = document.getElementById('hero-wrap');
  var hero = document.getElementById('top');
  var nav = document.getElementById('site-nav');

  function fallbackToStaticHero() {
    html.classList.remove('hero-gsap');
    // With the reveal never running, the real content has to live on
    // whichever layer stays visible (the photo layer) so it stays
    // reachable for screen readers and keyboard users.
    var photoContent = hero && hero.querySelector('.layer--photo .hero__content');
    var artContent = hero && hero.querySelector('.layer--art .hero__content');
    if (photoContent) {
      photoContent.removeAttribute('aria-hidden');
      var frozen = photoContent.querySelectorAll('[tabindex="-1"]');
      for (var i = 0; i < frozen.length; i++) frozen[i].removeAttribute('tabindex');
    }
    if (artContent) artContent.setAttribute('aria-hidden', 'true');
  }

  if (!heroWrap || !hero) return;

  if (!html.classList.contains('hero-gsap')) {
    // prefers-reduced-motion already opted us out in <head>
    fallbackToStaticHero();
    return;
  }

  if (!window.gsap || !window.ScrollTrigger) {
    fallbackToStaticHero();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Crane registration: art layer <-> photo layer ----------
     Two landmarks (boom pivot, boom mid-joint) measured directly on the
     source PNGs, on the same physical points of the crane in each image.
     From those we derive the exact scale/rotation/translation that makes
     the illustration's boom trace the same line the photo's boom
     occupies, so the clip-path reveal reads as one crane turning into a
     line drawing, not two different cranes swapping places. Recomputed
     on every ScrollTrigger refresh (resize/orientation change), never
     hardcoded to one viewport. */
  var PHOTO_W = 1254, PHOTO_H = 1254;
  var PHOTO_PIVOT = { x: 463, y: 808 }; // boom-to-turret pivot bearing
  var PHOTO_JOINT = { x: 660, y: 450 }; // telescoping-section joint bracket

  var ART_W = 1440, ART_H = 900;
  var ART_PIVOT = { x: 610, y: 575 };   // same pivot bearing, matches CSS transform-origin
  var ART_JOINT = { x: 730, y: 310 };   // same joint bracket

  var artImg = hero.querySelector('.layer--art .layer__img');

  function photoPointToScreen(p, cW, cH) {
    // The photo layer renders with object-fit:contain (whole image, no
    // crop), so this must mirror contain's scale math (min, not cover's
    // max) or the illustration would register against a crop that no
    // longer happens and drift off the photo's actual crane again.
    var s = Math.min(cW / PHOTO_W, cH / PHOTO_H);
    return { x: p.x * s + (cW - PHOTO_W * s) / 2, y: p.y * s + (cH - PHOTO_H * s) / 2 };
  }

  // Where the aligned art image should sit so ART_PIVOT/ART_JOINT land
  // exactly on top of the photo's crane pivot/joint.
  function alignedArtState() {
    var r = hero.getBoundingClientRect();
    var cW = r.width, cH = r.height;
    var targetPivot = photoPointToScreen(PHOTO_PIVOT, cW, cH);
    var targetJoint = photoPointToScreen(PHOTO_JOINT, cW, cH);
    var av = { x: ART_JOINT.x - ART_PIVOT.x, y: ART_JOINT.y - ART_PIVOT.y };
    var tv = { x: targetJoint.x - targetPivot.x, y: targetJoint.y - targetPivot.y };
    var aLen = Math.hypot(av.x, av.y) || 1;
    return {
      x: targetPivot.x - ART_PIVOT.x,
      y: targetPivot.y - ART_PIVOT.y,
      scale: Math.hypot(tv.x, tv.y) / aLen,
      rotation: (Math.atan2(tv.y, tv.x) - Math.atan2(av.y, av.x)) * 180 / Math.PI
    };
  }

  // Where the settled (fully-revealed, "contain"-framed) art image
  // should sit: the whole 1440x900 drawing centered in the hero, with
  // no leftover rotation/offset from the photo-matching alignment.
  function settledArtState() {
    var r = hero.getBoundingClientRect();
    var cW = r.width, cH = r.height;
    var s = Math.min(cW / ART_W, cH / ART_H) * 0.92;
    var pivotX = (cW - ART_W * s) / 2 + ART_PIVOT.x * s;
    var pivotY = (cH - ART_H * s) / 2 + ART_PIVOT.y * s;
    return { x: pivotX - ART_PIVOT.x, y: pivotY - ART_PIVOT.y, scale: s, rotation: 0 };
  }

  function applyAlignedArtState() {
    if (artImg) gsap.set(artImg, alignedArtState());
  }
  applyAlignedArtState();
  // Recompute the starting registration before every refresh (resize,
  // orientation change) — invalidateOnRefresh below handles the settle
  // tween's own end values the same way.
  ScrollTrigger.addEventListener('refreshInit', applyAlignedArtState);

  var tl = gsap.timeline({
    scrollTrigger: {
      trigger: heroWrap,
      start: 'top top',
      end: '+=120%',
      scrub: 0.6,
      invalidateOnRefresh: true
    }
  });

  /* a) the reveal: --reveal drives the photo layer's clip-path */
  tl.to(hero, { '--reveal': 100, ease: 'none', duration: 0.70 }, 0);

  /* b) bottom-up cascade: each element exits just before the clip
     boundary reaches it. Nav sits highest, so it goes last. */
  tl.to(['.hero__lead', '#hero-card'], { autoAlpha: 0, y: 40, ease: 'none', duration: 0.26 }, 0.02);
  tl.to('.hero__title', { autoAlpha: 0, y: -60, ease: 'none', duration: 0.32 }, 0.12);
  if (nav) tl.to(nav, { autoAlpha: 0, ease: 'none', duration: 0.25 }, 0.28);

  /* c) the photo is fully clipped away by now; hide it as a safety net */
  tl.to('.layer--photo', { autoAlpha: 0, ease: 'none', duration: 0.04 }, 0.70);

  /* d) settle: the illustration unwinds from "registered on the photo's
     crane" to fully centered/contained, now that the photo is gone. */
  tl.to('.layer--art .layer__img', {
    x: function () { return settledArtState().x; },
    y: function () { return settledArtState().y; },
    scale: function () { return settledArtState().scale; },
    rotation: 0,
    ease: 'power2.out',
    duration: 0.26
  }, 0.74);

  /* Nav comes back once the next section climbs over the pinned hero. */
  var nextSection = document.querySelector('.stats');
  if (nav && nextSection) {
    gsap.to(nav, {
      autoAlpha: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: nextSection,
        start: 'top bottom',
        end: 'top 40%',
        scrub: true
      }
    });
  }
})();
