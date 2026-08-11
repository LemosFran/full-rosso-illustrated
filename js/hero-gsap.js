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

  // Mobile browsers fire resize/scroll jumps as the address bar
  // hides and shows, which a pinned+scrubbed ScrollTrigger otherwise
  // reads as sudden scroll-position changes and jerks/skips. This is
  // GSAP's own fix: it takes over scrolling (still native-feeling,
  // touch included) and smooths that out.
  if (ScrollTrigger.normalizeScroll) ScrollTrigger.normalizeScroll(true);

  /* ---------- Art layer sizing (always fully visible, never cropped) ----------
     The art image is boxed at its real native size (1440x900, set in
     CSS) instead of object-fit:cover, because object-fit clips at
     layout time and no transform can un-clip it afterwards. It's kept
     permanently in a "contain" state — whole drawing on screen, scaled
     down and centered rather than cropped to fill — computed from the
     hero's own measured box (never window.innerWidth/innerHeight,
     which drift from it on mobile) so it never depends on a cover-crop
     stage that could push part of the crane outside the viewport. */
  var ART_W = 1440, ART_H = 900;
  var artImg = hero.querySelector('.layer--art .layer__img');

  function containArtState() {
    var r = hero.getBoundingClientRect();
    var s = Math.min(r.width / ART_W, r.height / ART_H) * 0.92;
    return { x: (r.width - ART_W * s) / 2, y: (r.height - ART_H * s) / 2, scale: s };
  }
  function applyContainArtState() {
    if (artImg) gsap.set(artImg, containArtState());
  }
  applyContainArtState();
  ScrollTrigger.addEventListener('refreshInit', applyContainArtState);

  var tl = gsap.timeline({
    scrollTrigger: {
      trigger: heroWrap,
      start: 'top top',
      // A bare "120%" resolves against window.innerHeight, which on
      // mobile drifts from the hero-wrap's own (stable, svh-based)
      // rendered height as the address bar hides/shows. Deriving it
      // from heroWrap's actual box keeps the reveal+settle timeline
      // exactly matched to the real pin distance (320svh wrap, 100svh
      // pinned hero -> 120/320 of the wrap is the animated portion).
      end: function () { return '+=' + (heroWrap.getBoundingClientRect().height * (120 / 320)); },
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
