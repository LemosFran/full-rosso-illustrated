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

  /* d) settle: the illustration goes from COVER framing to CONTAIN so
     the whole line drawing sits on screen once the photo is gone. */
  tl.to('.layer--art .layer__img', {
    scale: function () {
      var rw = window.innerWidth / 1440;
      var rh = window.innerHeight / 900;
      return (Math.min(rw, rh) / Math.max(rw, rh)) * 0.92;
    },
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
