(function () {
  'use strict';

  var SECTION_IDS = ['servicios', 'cobertura', 'nosotros'];

  /* ---------- Nav: solid state, active link, logo swap ---------- */
  var nav = document.getElementById('site-nav');
  var navMenu = document.getElementById('nav-menu');
  var navLogo = document.getElementById('nav-logo');
  var heroWrap = document.getElementById('hero-wrap');
  var statsEl = document.querySelector('.stats');

  function updateNav() {
    // Solid once the section after the hero has scrolled far enough to
    // cover it. Reading .stats (rather than hero-wrap) matters in the
    // gsap-enhanced hero: .stats climbs over the pinned hero early via
    // a negative margin, so nav needs to go solid in step with that,
    // not with when the much-taller hero-wrap technically ends.
    var solid = statsEl ? statsEl.getBoundingClientRect().top <= window.innerHeight * 0.6
      : heroWrap ? heroWrap.getBoundingClientRect().bottom <= 100
      : window.scrollY > 80;
    nav.setAttribute('data-solid', String(solid));
    navMenu.setAttribute('data-solid', String(solid));
    navLogo.src = solid ? 'assets/logo-navy.png' : 'assets/logo-white.png';

    var current = '';
    for (var i = 0; i < SECTION_IDS.length; i++) {
      var el = document.getElementById(SECTION_IDS[i]);
      if (el && el.getBoundingClientRect().top <= 140) current = SECTION_IDS[i];
    }
    var links = document.querySelectorAll('[data-nav-link]');
    for (var j = 0; j < links.length; j++) {
      var link = links[j];
      link.setAttribute('aria-current', String(link.getAttribute('data-nav-link') === current));
    }
  }
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });

  /* ---------- Nav: mobile menu toggle ---------- */
  var burger = document.getElementById('nav-burger');
  var burgerBars = burger.querySelector('.rm-nav__burger-bars');
  var burgerClose = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  burgerClose.setAttribute('width', '22');
  burgerClose.setAttribute('height', '22');
  burgerClose.setAttribute('viewBox', '0 0 24 24');
  burgerClose.setAttribute('fill', 'none');
  burgerClose.classList.add('icon');
  burgerClose.innerHTML = '<path d="M6.42072 4.83001C6.20746 4.63129 5.92539 4.52311 5.63393 4.52825C5.34248 4.53339 5.06441 4.65146 4.85829 4.85758C4.65217 5.0637 4.5341 5.34178 4.52896 5.63323C4.52381 5.92468 4.632 6.20675 4.83072 6.42001L10.4107 12L4.83072 17.58C4.72019 17.683 4.63154 17.8072 4.57005 17.9452C4.50856 18.0832 4.4755 18.2322 4.47283 18.3832C4.47017 18.5343 4.49795 18.6843 4.55453 18.8244C4.61112 18.9645 4.69533 19.0917 4.80216 19.1986C4.90899 19.3054 5.03624 19.3896 5.17632 19.4462C5.3164 19.5028 5.46645 19.5306 5.6175 19.5279C5.76856 19.5252 5.91753 19.4922 6.05553 19.4307C6.19352 19.3692 6.31773 19.2805 6.42072 19.17L12.0007 13.59L17.5807 19.17C17.6837 19.2805 17.8079 19.3692 17.9459 19.4307C18.0839 19.4922 18.2329 19.5252 18.3839 19.5279C18.535 19.5306 18.685 19.5028 18.8251 19.4462C18.9652 19.3896 19.0924 19.3054 19.1993 19.1986C19.3061 19.0917 19.3903 18.9645 19.4469 18.8244C19.5035 18.6843 19.5313 18.5343 19.5286 18.3832C19.5259 18.2322 19.4929 18.0832 19.4314 17.9452C19.3699 17.8072 19.2812 17.683 19.1707 17.58L13.5907 12L19.1707 6.42001C19.3694 6.20675 19.4776 5.92468 19.4725 5.63323C19.4673 5.34178 19.3493 5.0637 19.1431 4.85758C18.937 4.65146 18.659 4.53339 18.3675 4.52825C18.076 4.52311 17.794 4.63129 17.5807 4.83001L12.0007 10.41L6.42072 4.83001Z" fill="currentColor"/>';

  function setMenuOpen(open) {
    navMenu.setAttribute('data-open', String(open));
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    burger.innerHTML = '';
    burger.appendChild(open ? burgerClose : burgerBars);
  }
  burger.addEventListener('click', function () {
    setMenuOpen(navMenu.getAttribute('data-open') !== 'true');
  });
  navMenu.querySelectorAll('.rm-nav__menu-link').forEach(function (a) {
    a.addEventListener('click', function () { setMenuOpen(false); });
  });

  /* ---------- Services: interactive tab selector ---------- */
  var serviceTabs = document.querySelectorAll('[data-service-tab]');
  var servicePanels = document.querySelectorAll('[data-service-panel]');
  serviceTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var id = tab.getAttribute('data-service-tab');
      serviceTabs.forEach(function (t) { t.setAttribute('aria-pressed', String(t === tab)); });
      servicePanels.forEach(function (p) {
        p.setAttribute('data-active', String(p.getAttribute('data-service-panel') === id));
      });
    });
  });

  /* ---------- Process: expandable cards (single card open on touch) ---------- */
  var accordionRows = document.querySelectorAll('.process-card');
  accordionRows.forEach(function (row) {
    var head = row.querySelector('.process-card__head');
    head.addEventListener('click', function () {
      var isOpen = row.getAttribute('data-open') === 'true';
      accordionRows.forEach(function (r) {
        r.setAttribute('data-open', 'false');
        r.querySelector('.process-card__head').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        row.setAttribute('data-open', 'true');
        head.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- Contact form ---------- */
  var form = document.getElementById('contact-form');
  var fields = document.getElementById('contact-fields');
  var success = document.getElementById('contact-success');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    fields.hidden = true;
    success.hidden = false;
  });
  document.getElementById('contact-reset').addEventListener('click', function () {
    form.reset();
    success.hidden = true;
    fields.hidden = false;
  });
})();
