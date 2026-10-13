/* ==========================================================================
   COACH LEON THOMAS — Private Pickleball Coaching · New Jersey
   Page behaviour. The 3D court (court3d.js) is loaded only when its section
   gets close to the viewport.
   Progressive enhancement: all content is readable with no JS and no motion.
   ========================================================================== */
(() => {
  'use strict';

  const d = document;
  const root = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, '0');
  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const G = window.gsap;
  const ST = window.ScrollTrigger;
  const motion = !!(G && ST) && !reduce;

  if (!motion) root.classList.remove('motion');
  if (G && ST) G.registerPlugin(ST);

  /* ---------- Media slots: fall back to the labelled placeholder ---------- */
  $$('.media img').forEach((img) => {
    const fig = img.closest('.media');
    const fail = () => { fig.classList.add('is-empty'); (img.closest('picture') || img).remove(); };
    img.addEventListener('error', fail, { once: true });
    // images that already failed before this script ran (checked once the page has loaded)
    addEventListener('load', () => { if (img.isConnected && img.complete && img.naturalWidth === 0 && img.loading !== 'lazy') fail(); }, { once: true });
  });

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (motion && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ST.update);
    G.ticker.add((t) => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
  }
  const scrollToTarget = (target) => {
    if (lenis) return lenis.scrollTo(target, { offset: -20, duration: 1.2 });
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };
  const scrollToY = (y) => {
    if (lenis) return lenis.scrollTo(y, { duration: 1 });
    scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  };

  /* ---------- Header: court-line indicator, active link, progress ---------- */
  const nav = $('#nav');
  const links = $$('.nav__links a');
  const pill = $('.nav__pill');
  const movePill = (a) => {
    if (!a) { pill.style.opacity = '0'; return; }
    pill.style.width = `${a.offsetWidth - 24}px`;
    pill.style.transform = `translateX(${a.offsetLeft + 12}px)`;
    pill.style.opacity = '1';
  };
  links.forEach((a) => {
    a.addEventListener('pointerenter', () => movePill(a));
    a.addEventListener('focus', () => movePill(a));
  });
  $('.nav__links').addEventListener('pointerleave', () => movePill(null));
  const secIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const id = `#${en.target.id}`;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => secIO.observe(s));

  /* ---------- Menu ---------- */
  const menu = $('#menu');
  const burger = $('.nav__menu');
  $$('.menu__links li').forEach((li, i) => li.style.setProperty('--i', i));
  menu.inert = true;
  const openMenu = () => {
    const br = burger.getBoundingClientRect();
    menu.style.setProperty('--mx', `${br.left + br.width / 2}px`);
    menu.style.setProperty('--my', `${br.top + br.height / 2}px`);
    menu.classList.add('is-open');
    menu.inert = false;
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    nav.classList.remove('is-hidden');
    lenis && lenis.stop();
    setTimeout(() => $('.menu__links a').focus({ preventScroll: true }), 300);
  };
  const closeMenu = (restoreFocus) => {
    if (!menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menu.inert = true;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    lenis && lenis.start();
    if (restoreFocus) burger.focus();
  };
  burger.addEventListener('click', () => (menu.classList.contains('is-open') ? closeMenu(true) : openMenu()));
  d.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(true); });

  d.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id.length > 1 && d.querySelector(id);
    if (!target) return;
    e.preventDefault();
    closeMenu(false);
    scrollToTarget(target);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    const field = a.dataset.focus && d.getElementById(a.dataset.focus);
    if (field) setTimeout(() => field.focus({ preventScroll: true }), lenis ? 1250 : 300);
  });

  /* ---------- Cursor (desktop only) ---------- */
  if (fine) {
    root.classList.add('has-cursor');
    const cur = $('.cursor');
    const label = $('.cursor__label');
    const setPos = G
      ? (() => {
          G.set(cur, { x: -100, y: -100 });
          const xTo = G.quickTo(cur, 'x', { duration: reduce ? 0 : 0.2, ease: 'power3' });
          const yTo = G.quickTo(cur, 'y', { duration: reduce ? 0 : 0.2, ease: 'power3' });
          return (x, y) => { xTo(x); yTo(y); };
        })()
      : (x, y) => { cur.style.transform = `translate(${x}px, ${y}px)`; };
    addEventListener('pointermove', (e) => setPos(e.clientX, e.clientY), { passive: true });
    d.addEventListener('pointerover', (e) => {
      const t = e.target;
      if (t.closest('input, textarea, select')) { cur.classList.add('is-hidden'); return; }
      cur.classList.remove('is-hidden');
      const interactive = t.closest('a, button, label');
      const el = t.closest('[data-cursor]');
      // a label shows over labelled areas, and over controls that carry their own label (gallery "View")
      const text = el && (!interactive || interactive === el || interactive.contains(el)) ? el.dataset.cursor : '';
      label.textContent = text;
      cur.classList.toggle('is-label', !!text);
      cur.classList.toggle('is-hover', !text && !!interactive);
    });
    root.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    root.addEventListener('pointerenter', () => cur.classList.remove('is-hidden'));
  }

  if (fine && motion) {
    $$('[data-magnetic]').forEach((el) => {
      const xTo = G.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.5)' });
      const yTo = G.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.5)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.15);
        yTo((e.clientY - r.top - r.height / 2) * 0.25);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- Split headings into words ---------- */
  const splitWords = (el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(d.createTextNode(' ')); return; }
            const w = d.createElement('span');
            const inner = d.createElement('span');
            w.className = 'w';
            inner.className = 'w__in';
            inner.style.setProperty('--wi', i++);
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  };
  if (motion) $$('.split').forEach(splitWords);

  /* ==========================================================================
     HERO — "live rally". The coach's name types up, the headline masks in,
     the court lines draw, then Coach Leon and "You" play an endless rally on
     the tilted court: serve → return → drop → dinks → reset. Every hit lights
     the next headline line and the next scoreboard stat, each bounce rings
     (kitchen bounces flash the kitchen), and a call pops over the hitter.
     The loop pauses whenever the hero is off screen.
     ========================================================================== */
  const hero = $('.hero');
  const nameT = $('.hero__name-t');
  if (nameT) {
    const t = nameT.textContent;
    nameT.innerHTML = `<span class="sr-only">${t}</span>${[...t].map((c) => `<span class="ch" aria-hidden="true">${c}</span>`).join('')}`;
  }
  const hLines = $$('.hl', hero);
  const hStats = $$('.hscore li', hero);
  const hNum = $('.hscore__num', hero);
  const plane = $('.rally__plane', hero);
  const rBall = $('.rally__ball', hero);
  const rShadow = $('.rally__shadow', hero);
  const rRing = $('.rally__ring', hero);
  const rCall = $('.rally__call', hero);
  const rPlayer = { leon: $('.rally__p--leon', hero), you: $('.rally__p--you', hero) };
  const kitchens = $$('.rally__kitchen', hero);

  // Court units are the SVG viewBox (960 × 440): the 44 × 20 ft court is 880 × 400, net at x = 480,
  // kitchens from 340 to 620. Players and ball start where their inline left/top put them.
  const START = { leon: [110, 110], you: [880, 330] };
  const SHOTS = [
    { call: 'Serve', to: 'leon', bounce: [190, 128], hit: [110, 112], peak: 120, d: 1.05 },
    { call: 'Return', to: 'you', bounce: [770, 300], hit: [850, 290], peak: 110, d: 1 },
    { call: 'Drop', to: 'leon', bounce: [405, 190], hit: [322, 196], peak: 90, d: 1 },
    { call: 'Dink', to: 'you', bounce: [556, 252], hit: [640, 250], peak: 46, d: 0.78 },
    { call: 'Dink', to: 'leon', bounce: [410, 288], hit: [332, 284], peak: 46, d: 0.78 },
    { call: 'Dink', to: 'you', bounce: [560, 196], hit: [636, 204], peak: 42, d: 0.75 },
  ];
  let hitN = 0, rallyTl = null, heroOn = true, counted = false;
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const at = (el, u) => { el.style.left = `${u[0] / 9.6}%`; el.style.top = `${u[1] / 4.4}%`; };
  const lightUp = () => {
    const i = hitN++;
    hLines.forEach((l, k) => l.classList.toggle('is-lit', k === i % hLines.length));
    hStats.forEach((s, k) => s.classList.toggle('is-lit', k === i % hStats.length));
  };
  const callAt = (text, u) => { $('b', rCall).textContent = text; at(rCall, u); restart(rCall, 'is-pop'); };
  const bounceAt = (u) => {
    at(rRing, u);
    restart(rRing, 'is-on');
    if (u[0] < 340 || u[0] > 620) return;
    const k = kitchens[u[0] < 480 ? 0 : 1];
    k.classList.add('is-flash');
    setTimeout(() => k.classList.remove('is-flash'), 280);
  };
  const countUp = () => {
    if (counted || !hNum) return;
    counted = true;
    const o = { n: 0 };
    G.to(o, { n: Number(hNum.dataset.count), duration: 1.3, ease: 'power2.out', onUpdate: () => { hNum.textContent = `~${Math.round(o.n)}`; } });
  };
  const buildRally = () => {
    const k = plane.offsetWidth / 960;
    const off = (from, u) => ({ x: (u[0] - from[0]) * k, y: (u[1] - from[1]) * k });
    const B0 = START.you;
    const tl = G.timeline({ repeat: -1, repeatDelay: 0.4, paused: true });
    tl.set([rBall, rShadow, rPlayer.leon, rPlayer.you], { x: 0, y: 0 }).set(rBall, { z: 0 }).set(rShadow, { scale: 1 });
    let t = 0.2;
    let ball = START.you;
    SHOTS.forEach((s) => {
      const from = ball;
      const hz = s.peak * k;
      const d2 = s.d * 0.45;
      tl.add(() => { lightUp(); callAt(s.call, from); }, t)
        // over the net to the bounce …
        .to([rBall, rShadow], { ...off(B0, s.bounce), duration: s.d, ease: 'none' }, t)
        .to(rBall, { z: hz, duration: s.d / 2, ease: 'power2.out' }, t)
        .to(rBall, { z: 0, duration: s.d / 2, ease: 'power2.in' }, t + s.d / 2)
        .to(rShadow, { scale: 0.5, duration: s.d / 2, ease: 'power2.out' }, t)
        .to(rShadow, { scale: 1, duration: s.d / 2, ease: 'power2.in' }, t + s.d / 2)
        .add(() => bounceAt(s.bounce), t + s.d)
        // … then up off the court to the receiver's paddle
        .to([rBall, rShadow], { ...off(B0, s.hit), duration: d2, ease: 'none' }, t + s.d)
        .to(rBall, { z: hz * 0.32, duration: d2 * 0.6, ease: 'power2.out' }, t + s.d)
        .to(rBall, { z: hz * 0.18, duration: d2 * 0.4, ease: 'sine.in' }, t + s.d + d2 * 0.6)
        .to(rPlayer[s.to], { ...off(START[s.to], s.hit), duration: s.d + d2 * 0.8, ease: 'power2.inOut' }, t);
      ball = s.hit;
      t += s.d + d2;
    });
    tl.add(() => callAt('Nice rally!', ball), t)
      .to([rPlayer.leon, rPlayer.you, rBall, rShadow], { x: 0, y: 0, duration: 1.1, ease: 'power2.inOut' }, t + 0.6)
      .to(rBall, { z: 0, duration: 0.5, ease: 'power2.in' }, t + 0.6);
    return tl;
  };
  const startRally = () => {
    if (rallyTl) rallyTl.kill();
    rallyTl = buildRally();
    if (heroOn) rallyTl.play();
  };

  if (motion) {
    if (hNum) hNum.textContent = '~0';
    hStats.forEach((s) => s.classList.remove('is-lit'));
    G.set(rBall, { z: 0 });
    G.timeline({ delay: 0.15 })
      .to('.hero__name-tag .mball', { scale: 1, duration: 0.7, ease: 'back.out(2.2)' }, 0)
      .to('.hero__name-t .ch', { y: 0, yPercent: 0, duration: 0.8, stagger: 0.025, ease: 'expo.out' }, 0.08)
      .to('.hero__loc', { opacity: 1, x: 0, duration: 0.8, ease: 'expo.out' }, 0.5)
      .to('.hl__in', { y: 0, yPercent: 0, duration: 1.15, stagger: 0.13, ease: 'expo.out' }, 0.35)
      .add(() => hero.classList.add('is-drawn'), 0.85)
      .add(() => hero.classList.add('is-hi'), 1.15)
      .add(() => { hero.classList.add('is-looping'); hitN = 0; startRally(); }, 1.8)
      .add(() => hStats.forEach((s, i) => setTimeout(() => { s.classList.add('in'); if (i === 0) countUp(); }, i * 120)), 2.05)
      .add(() => hero.classList.add('is-ready'), 2.55);

    new IntersectionObserver(([en]) => {
      heroOn = en.isIntersecting;
      if (rallyTl) heroOn ? rallyTl.play() : rallyTl.pause();
    }).observe(hero);
    let rz = 0;
    let lastW = plane.offsetWidth;
    addEventListener('resize', () => {
      clearTimeout(rz);
      rz = setTimeout(() => { if (rallyTl && plane.offsetWidth !== lastW) { lastW = plane.offsetWidth; startRally(); } }, 200);
    });

    // depth: each layer drifts at its own pace while the hero scrolls away
    const drift = (sel, vars) => G.to(sel, { ...vars, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    drift('.hero__stage', { y: -30 });
    // the cards only drift where they sit beside the copy; on smaller screens they share its column
    G.matchMedia().add('(min-width: 1280px)', () => {
      const tweens = [drift('.hero__top', { y: 70 }), drift('.hcard--a', { y: -90 }), drift('.hcard--b', { y: -140 })];
      return () => tweens.forEach((tw) => { tw.scrollTrigger.kill(); tw.kill(); G.set(tw.targets(), { clearProps: 'y' }); });
    });
  } else {
    $$('.mark').forEach((m) => m.classList.add('in'));
  }

  /* ==========================================================================
     Scroll reveals & effects
     ========================================================================== */
  if (motion) {
    const once = (el, fn, start = 'top 86%') => ST.create({ trigger: el, start, once: true, onEnter: fn });
    const notHero = (el) => !el.closest('.hero');

    $$('.split').forEach((el) => once(el, () => { el.classList.add('in'); const m = $('.mark', el); if (m) m.classList.add('in'); }));
    $$('.fade').filter(notHero).forEach((el) => once(el, () => el.classList.add('in')));
    $$('.reveal-img').filter(notHero).forEach((el) => once(el, () => el.classList.add('in'), 'top 82%'));
    $$('.seam').forEach((el) => once(el, () => el.classList.add('in'), 'top 90%'));
    $$('.snap__row').forEach((el) => once(el, () => el.classList.add('in'), 'top 80%'));
    $$('.zones').forEach((group) => $$('.fade', group).forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 0.08}s`; }));

    // Experience snapshot: the court photo drifts inside its frame
    G.fromTo('.snap__media img', { yPercent: 6 }, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.snap', start: 'top bottom', end: 'bottom top', scrub: true } });

    // About intro fills in word by word
    const intro = $('.about__intro');
    intro.innerHTML = intro.textContent.trim().split(/\s+/).map((w) => `<span class="fw">${w}</span>`).join(' ');
    G.fromTo($$('.fw', intro), { opacity: 0.16 }, {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: intro, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });

    // Gallery feature grows to full width
    G.fromTo('.reel__feature', { clipPath: 'inset(0% 14% 0% 14% round 28px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none',
      scrollTrigger: { trigger: '.reel', start: 'top 90%', end: 'center 55%', scrub: true },
    });
    G.fromTo('.reel__feature img', { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.reel', start: 'top bottom', end: 'bottom top', scrub: true } });

    once($('.fcta__title'), () => G.to('.fcta__title .line__in', { y: 0, yPercent: 0, duration: 1.2, stagger: 0.14, ease: 'expo.out' }), 'top 85%');

    ST.sort();
    d.fonts && d.fonts.ready.then(() => { ST.sort(); ST.refresh(); });
  }

  /* ==========================================================================
     Private coaching — the photo follows the focus area nearest the reading
     line as you scroll; each row can also be chosen directly. The booking
     button carries the chosen focus into the form.
     ========================================================================== */
  const focusItems = $$('.focus__item');
  const focusImgs = $$('.focus__photo img');
  const focusLabel = $('.focus__label');
  const focusCta = $('.focus__cta');
  let focusActive = 0, focusNearest = 0, focusOn = false, focusTick = false;
  const setFocus = (i) => {
    if (i === focusActive) return;
    focusActive = i;
    focusItems.forEach((b, k) => { b.classList.toggle('is-active', k === i); b.setAttribute('aria-pressed', String(k === i)); });
    focusImgs.forEach((img, k) => img.classList.toggle('is-on', k === i));
    $('.focus__label-n', focusLabel).textContent = pad(i + 1);
    $('.focus__label-t', focusLabel).textContent = $('.focus__t', focusItems[i]).textContent.trim();
    focusLabel.classList.remove('is-swap'); void focusLabel.offsetWidth; focusLabel.classList.add('is-swap');
    focusCta.dataset.improve = focusItems[i].dataset.improve;
  };
  focusItems.forEach((b, i) => b.addEventListener('click', () => setFocus(i)));
  const focusScroll = () => {
    focusTick = false;
    const line = innerHeight * (innerWidth < 1024 ? 0.7 : 0.5);
    let best = 0, dist = Infinity;
    focusItems.forEach((b, i) => { const r = b.getBoundingClientRect(); const dd = Math.abs(r.top + r.height / 2 - line); if (dd < dist) { dist = dd; best = i; } });
    if (best !== focusNearest) { focusNearest = best; setFocus(best); }
  };
  new IntersectionObserver(([en]) => { focusOn = en.isIntersecting; }).observe($('.focus__list'));
  addEventListener('scroll', () => { if (focusOn && !focusTick) { focusTick = true; requestAnimationFrame(focusScroll); } }, { passive: true });

  /* ==========================================================================
     WHO LEON COACHES — player selector (ARIA tabs). Switching wipes in the
     level's photo, staggers in its copy, moves the court marker, re-tints the
     stage and slides the tab indicator. "Book for this level" pre-fills the
     booking flow (handled in the booking section below).
     ========================================================================== */
  const plTabs = $$('.pl__tab');
  const plPanels = $$('.pl__panel');
  const plStage = $('.pl__stage');
  const plInd = $('.pl__ind');
  const plImgs = $$('.pl__media img');
  const plMarker = $('.pl__marker');
  const plCourtT = $('.pl__court-t');
  let plCur = 0;
  root.classList.add('js-pl-ready');
  const plMoveInd = () => {
    const t = plTabs[plCur];
    plInd.style.width = `${t.offsetWidth}px`;
    plInd.style.height = `${t.offsetHeight}px`;
    plInd.style.transform = `translate(${t.offsetLeft}px, ${t.offsetTop - 6}px)`;
  };
  const plCourt = (panel) => {
    plMarker.style.setProperty('--mx', panel.dataset.mx);
    plMarker.style.setProperty('--my', panel.dataset.my);
    $('b', plCourtT).textContent = panel.dataset.focus;
    plCourtT.classList.remove('is-swap'); void plCourtT.offsetWidth; plCourtT.classList.add('is-swap');
  };
  const plSelect = (i, focus) => {
    if (focus) plTabs[i].focus();
    if (i === plCur) return;
    const prev = plCur;
    plCur = i;
    plTabs.forEach((t, k) => { const on = k === i; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    const inP = plPanels[i];
    inP.classList.add('is-entering');
    void inP.offsetWidth;
    plPanels[prev].classList.remove('is-active');
    inP.classList.remove('is-entering');
    inP.classList.add('is-active');
    plImgs.forEach((img) => img.classList.remove('is-prev'));
    plImgs[prev].classList.remove('is-on');
    plImgs[prev].classList.add('is-prev');
    plImgs[i].classList.add('is-on');
    plStage.dataset.level = String(i);
    plCourt(inP);
    plMoveInd();
  };
  plTabs.forEach((t, i) => {
    t.addEventListener('click', () => plSelect(i));
    t.addEventListener('keydown', (e) => {
      const n = plTabs.length;
      const k = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1 + n, ArrowUp: i - 1 + n, Home: 0, End: n - 1 }[e.key];
      if (k === undefined) return;
      e.preventDefault();
      plSelect(k % n, true);
    });
  });
  plCourt(plPanels[0]);
  plMoveInd();
  addEventListener('resize', plMoveInd);
  d.fonts && d.fonts.ready.then(plMoveInd);

  /* ==========================================================================
     JAMAICA → NEW JERSEY — scroll-driven story. The milestone nearest the
     reading line becomes active: the route line draws to its node, the ball
     travels with it, the chapter image / tint change, and the experience
     counter runs up once "Nearly 10 years" is reached. On mobile each
     milestone is also an accordion.
     ========================================================================== */
  const story = $('.story');
  const sStops = $$('.sstop', story);
  const sPanel = $('.story__panel');
  const sImgs = $$('.story__imgs img');
  const sChapter = $('.story__chapter');
  const sDraw = $('.route__draw');
  const sBallR = $('.route__ball');
  const sNodesG = $('.route__nodes');
  const sList = $('.story__list');
  const sNumEl = $('.story__num');
  const sCount = $('.story__count');
  const sIdx = $('.story__idx');
  const sTtl = $('.story__ttl');
  const sPinNJ = $('.story__pin--nj');
  const CHAPTERS = { ja: 'Chapter · Jamaica', coach: 'Chapter · Coaching', nj: 'Chapter · New Jersey' };
  const yearsAt = sStops.findIndex((s) => s.hasAttribute('data-years'));
  const njAt = sStops.findIndex((s) => s.classList.contains('sstop--nj'));
  const mqMobile = matchMedia('(max-width: 1023px)');
  story.classList.add('js-story');
  const routeL = sDraw.getTotalLength();
  sDraw.style.strokeDasharray = routeL;
  const sNodes = sStops.map((_, i) => {
    const p = sDraw.getPointAtLength((routeL * i) / (sStops.length - 1));
    const c = d.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', p.x.toFixed(1));
    c.setAttribute('cy', p.y.toFixed(1));
    c.setAttribute('r', '6');
    c.setAttribute('class', 'route__node');
    sNodesG.appendChild(c);
    return c;
  });
  let sActive = -1, sYears = 10, sYearsTween = null;
  const setYears = (to) => {
    if (to === sYears) return;
    sYears = to;
    sYearsTween && sYearsTween.kill();
    const show = (v) => { sNumEl.textContent = Math.round(v); sCount.classList.toggle('is-full', v >= 10); };
    if (!motion) { show(to); return; }
    const o = { n: Number(sNumEl.textContent) || 0 };
    sYearsTween = G.to(o, { n: to, duration: to ? 1.4 : 0.5, ease: 'power2.out', onUpdate: () => show(o.n) });
  };
  const setOpen = (st, open) => {
    st.classList.toggle('is-open', open);
    if (mqMobile.matches) $('.sstop__head', st).setAttribute('aria-expanded', String(open));
  };
  const syncExpanded = () => sStops.forEach((st) => $('.sstop__head', st).setAttribute('aria-expanded', String(!mqMobile.matches || st.classList.contains('is-open'))));
  const setStory = (i) => {
    if (i === sActive) return;
    sActive = i;
    const st = sStops[i];
    sStops.forEach((s, k) => { s.classList.toggle('is-active', k === i); s.classList.toggle('is-on', k <= i); });
    if (mqMobile.matches && !st.classList.contains('is-open')) setOpen(st, true);
    sNodes.forEach((n, k) => n.classList.toggle('is-on', k <= i));
    if (sPanel.dataset.tone !== st.dataset.tone) {
      sPanel.dataset.tone = st.dataset.tone;
      $('span', sChapter).textContent = CHAPTERS[st.dataset.tone];
      sChapter.classList.remove('is-swap'); void sChapter.offsetWidth; sChapter.classList.add('is-swap');
    }
    sImgs.forEach((img, k) => img.classList.toggle('is-on', k === Number(st.dataset.img)));
    sIdx.textContent = pad(i + 1);
    sTtl.textContent = $('.sstop__t', st).textContent;
    sPinNJ.classList.toggle('is-on', i >= njAt);
    setYears(i >= yearsAt ? 10 : 0);
  };
  const placeRoute = (p) => {
    sDraw.style.strokeDashoffset = (routeL * (1 - p)).toFixed(2);
    const pt = sDraw.getPointAtLength(routeL * p);
    sBallR.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${(p * 900).toFixed(0)})`);
    sList.style.setProperty('--p', p.toFixed(4));
  };
  const storyLine = () => innerHeight * (mqMobile.matches ? 0.62 : 0.5);
  let sTick = false, sOn = false;
  const storyScroll = () => {
    sTick = false;
    const line = storyLine();
    const tops = sStops.map((s) => s.getBoundingClientRect().top + 18);
    let i = 0;
    tops.forEach((t, k) => { if (t <= line) i = k; });
    const p = clamp01((line - tops[0]) / (tops[tops.length - 1] - tops[0] || 1));
    placeRoute(p);
    setStory(i);
  };
  sStops.forEach((st, i) => {
    $('.sstop__head', st).addEventListener('click', () => {
      if (mqMobile.matches) { setOpen(st, !st.classList.contains('is-open')); return; }
      // desktop: bring this milestone to the reading line; the scroll sync does the rest
      scrollToY(scrollY + st.getBoundingClientRect().top + 18 - storyLine() + 2);
    });
  });
  mqMobile.addEventListener('change', () => { syncExpanded(); storyScroll(); });
  sYears = Number(sNumEl.textContent);
  setStory(0);
  syncExpanded();
  storyScroll();
  new IntersectionObserver(([en]) => { sOn = en.isIntersecting; if (sOn) storyScroll(); }).observe(story);
  addEventListener('scroll', () => { if (sOn && !sTick) { sTick = true; requestAnimationFrame(storyScroll); } }, { passive: true });
  addEventListener('resize', () => requestAnimationFrame(storyScroll));

  /* ==========================================================================
     3D COURT — lazy-loaded, driven by the view tabs
     ========================================================================== */
  const viewer = $('#viewer');
  const tabs = $$('.seg__btn');
  let court = null;
  let viewMode = 'doubles';
  const selectView = (tab, focus) => {
    viewMode = tab.dataset.mode;
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      d.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
    if (court) court.setMode(viewMode);
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectView(t));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      selectView(tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length], true);
    });
  });
  let loading = null;
  const load3D = () => {
    if (loading) return loading;
    loading = import('./court3d.js')
      .then((mod) => { court = mod.mountCourt(viewer); if (court) court.setMode(viewMode); })
      .catch(() => viewer.classList.add('no-webgl'));
    return loading;
  };
  const loadIO = new IntersectionObserver(([en]) => { if (en.isIntersecting) { loadIO.disconnect(); load3D(); } }, { rootMargin: '900px 0px' });
  loadIO.observe(viewer);
  // Warm up three.js in the background once the page is idle
  addEventListener('load', () => (window.requestIdleCallback ? requestIdleCallback(load3D, { timeout: 4000 }) : setTimeout(load3D, 2500)));

  /* ==========================================================================
     Gallery viewer — a larger look at any frame
     ========================================================================== */
  const lb = $('#lightbox');
  if (lb && typeof lb.showModal === 'function') {
    const lbImg = $('img', lb);
    const lbCap = $('.lightbox__cap', lb);
    let opener = null;
    $$('.tile__open').forEach((btn) => btn.addEventListener('click', () => {
      const fig = btn.closest('figure');
      const img = $('img', fig);
      const cap = $('figcaption', fig);
      opener = btn;
      lbImg.src = btn.dataset.full;
      lbImg.alt = img ? img.alt : '';
      lbCap.innerHTML = cap ? cap.innerHTML : '';
      lb.showModal();
      lenis && lenis.stop();
    }));
    $('.lightbox__close', lb).addEventListener('click', () => lb.close());
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
    lb.addEventListener('close', () => { lenis && lenis.start(); opener && opener.focus({ preventScroll: true }); });
  } else {
    $$('.tile__open').forEach((btn) => btn.remove());
  }

  /* ==========================================================================
     BOOKING — four-step lesson request. Panels slide along a track, the
     court-line progress fills with a ball riding it, the summary on the left
     fills in as you choose, and a confirmation replaces the form on send.
     Without JS it is one ordinary form (Netlify Forms).
     ========================================================================== */
  const lform = $('#lessonForm');
  const bSteps = $$('.bstep', lform);
  const bTrack = $('.bflow__track', lform);
  const bView = $('.bflow__viewport', lform);
  const bNodes = $$('.bprog__node', lform);
  const bProg = $('.bprog', lform);
  const bBack = $('.bflow__back', lform);
  const bNext = $('.bflow__next', lform);
  const bSubmit = $('.bflow__submit', lform);
  const bCur = $('.bflow__cur', lform);
  const status = $('#formStatus');
  const bDone = $('.bdone', lform);
  const sumDD = $$('[data-sum]');
  const incl = $$('.incl li[data-v]');
  const last = bSteps.length - 1;
  let bStep = 0, bMax = 0;
  lform.classList.add('is-flow');

  const checked = (name) => $$(`input[name="${name}"]:checked`, lform).map((i) => i.value);
  const updateSummary = () => {
    sumDD.forEach((dd) => {
      const v = checked(dd.dataset.sum).join(', ');
      const before = dd.textContent;
      dd.textContent = v || 'Not chosen yet';
      dd.classList.toggle('is-empty', !v);
      if (v && v !== before) { dd.classList.remove('is-flash'); void dd.offsetWidth; dd.classList.add('is-flash'); }
    });
    const imp = checked('improve');
    incl.forEach((li) => li.classList.toggle('is-hit', imp.includes(li.dataset.v)));
  };

  const MSG = { name: 'Please enter your name.', email: 'Please enter a valid email address.' };
  const validate = (el) => {
    const err = d.getElementById(`${el.id}-err`);
    const ok = el.checkValidity();
    el.setAttribute('aria-invalid', String(!ok));
    if (err) {
      err.textContent = ok ? '' : MSG[el.name] || 'Please check this field.';
      if (!ok) el.setAttribute('aria-describedby', err.id); else el.removeAttribute('aria-describedby');
    }
    return ok;
  };
  const fields = $$('input[required]:not([type="radio"])', lform);
  fields.forEach((el) => {
    el.addEventListener('blur', () => { if (el.value || el.getAttribute('aria-invalid') === 'true') validate(el); });
    el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') validate(el); });
  });
  const STEP_ERR = ['Please choose who the coaching is for.', 'Please choose your current experience.', 'Please choose at least one area to improve.'];
  const STEP_NAME = ['coaching_for', 'experience', 'improve'];
  const stepValid = (k, show) => {
    if (k === last) {
      let ok = true;
      fields.forEach((el) => { if (show ? !validate(el) : !el.checkValidity()) ok = false; });
      return ok;
    }
    const ok = checked(STEP_NAME[k]).length > 0;
    if (show) $('.bstep__err', bSteps[k]).textContent = ok ? '' : STEP_ERR[k];
    return ok;
  };

  const fitStep = () => { if (lform.classList.contains('is-flow')) bView.style.height = `${bSteps[bStep].offsetHeight}px`; };
  const goStep = (i, focus = true) => {
    bStep = i;
    bMax = Math.max(bMax, i);
    bTrack.style.transform = `translateX(${-i * 100}%)`;
    bSteps.forEach((s, k) => { s.inert = k !== i; s.classList.toggle('is-current', k === i); });
    bNodes.forEach((n, k) => {
      n.classList.toggle('is-current', k === i);
      n.classList.toggle('is-done', k !== i && k <= bMax && stepValid(k, false));
      n.disabled = k > bMax;
      if (k === i) n.setAttribute('aria-current', 'step'); else n.removeAttribute('aria-current');
    });
    bProg.style.setProperty('--p', (i / last).toFixed(3));
    bBack.hidden = i === 0;
    bNext.hidden = i === last;
    bSubmit.hidden = i !== last;
    bCur.textContent = i + 1;
    status.textContent = '';
    fitStep();
    if (focus) {
      const s = bSteps[i];
      const first = $('input:checked', s) || $('input:not([type="hidden"]), textarea', s);
      setTimeout(() => first && first.focus({ preventScroll: true }), reduce ? 0 : 450);
    }
  };
  bNext.addEventListener('click', () => {
    if (stepValid(bStep, true)) goStep(bStep + 1);
    else { fitStep(); const f = $('input', bSteps[bStep]); f && f.focus(); }
  });
  bBack.addEventListener('click', () => goStep(Math.max(0, bStep - 1)));
  bNodes.forEach((n, k) => n.addEventListener('click', () => { if (k <= bMax) goStep(k); }));

  // choosing a card with the pointer moves on by itself (keyboard users keep control)
  let pointerPick = 0;
  lform.addEventListener('pointerdown', (e) => { if (e.target.closest('.ocard')) pointerPick = performance.now(); });
  lform.addEventListener('change', (e) => {
    const inp = e.target;
    if (!inp.matches('.ocard input')) return;
    updateSummary();
    const k = bSteps.indexOf(inp.closest('.bstep'));
    if (k > -1 && k < last) { $('.bstep__err', bSteps[k]).textContent = ''; fitStep(); }
    if (inp.type === 'radio' && k === bStep && k < last && performance.now() - pointerPick < 800) {
      setTimeout(() => { if (bStep === k) goStep(k + 1); }, reduce ? 150 : 480);
    }
    bNodes.forEach((n, j) => n.classList.toggle('is-done', j !== bStep && j <= bMax && stepValid(j, false)));
  });
  addEventListener('resize', () => requestAnimationFrame(fitStep));
  d.fonts && d.fonts.ready.then(fitStep);
  goStep(0, false);

  // focus areas and player levels chosen elsewhere on the page pre-fill the flow
  const flash = (inp) => {
    const card = inp.closest('.ocard');
    card.classList.remove('is-flash');
    setTimeout(() => card.classList.add('is-flash'), lenis ? 900 : 200);
  };
  const preset = (name, value) => {
    const inp = $(`input[name="${name}"][value="${value}"]`, lform);
    if (!inp) return;
    inp.checked = true;
    flash(inp);
    updateSummary();
    if (lform.classList.contains('is-done')) return;
    goStep(bStep, false);
  };
  const LEVEL = { beginners: ['experience', 'Beginner'], adults: ['coaching_for', 'Adult'], young: ['coaching_for', 'Young player'], developing: ['experience', 'Developing'] };
  d.addEventListener('click', (e) => {
    const imp = e.target.closest('a[data-improve]');
    if (imp) preset('improve', imp.dataset.improve);
    const lv = e.target.closest('a[data-level]');
    if (lv && LEVEL[lv.dataset.level]) preset(...LEVEL[lv.dataset.level]);
  });

  const showDone = (first, preview) => {
    const rows = [['Coaching for', checked('coaching_for').join(', ')], ['Experience', checked('experience').join(', ')], ['Improve', checked('improve').join(', ')], ['Preferred times', $('#f-times').value.trim()]].filter((r) => r[1]);
    $('.bdone__p', bDone).textContent = preview
      ? `Thanks, ${first}. (Preview mode — requests send for real once the site is live on Netlify.)`
      : `Thanks, ${first}. Your private lesson request is on its way to Coach Leon.`;
    const list = $('.bdone__list', bDone);
    list.replaceChildren(...rows.map(([k, v]) => { const li = d.createElement('li'); const s = d.createElement('span'); s.textContent = k; li.append(s, d.createTextNode(v)); return li; }));
    bView.style.height = '';
    lform.classList.add('is-done');
    bDone.hidden = false;
    bDone.focus({ preventScroll: true });
    if (lform.getBoundingClientRect().top < 0) scrollToTarget(lform);
  };
  $('.bdone__again', bDone).addEventListener('click', () => {
    lform.reset();
    fields.forEach((el) => { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); });
    $$('.field__err, .bstep__err', lform).forEach((e) => { e.textContent = ''; });
    bDone.hidden = true;
    lform.classList.remove('is-done');
    bMax = 0;
    updateSummary();
    goStep(0);
  });

  lform.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bad = bSteps.findIndex((_, k) => !stepValid(k, true));
    status.classList.remove('is-error');
    if (bad > -1) {
      if (bad !== bStep) goStep(bad); else fitStep();
      if (bad === last) { const f = fields.find((el) => !el.checkValidity()); f && f.focus(); }
      return;
    }
    const data = new FormData(lform);
    const first = String(data.get('name') || '').trim().split(/\s+/)[0];
    // On Netlify the form posts to Netlify Forms; opened locally, nothing is sent
    const local = ['localhost', '127.0.0.1', ''].includes(location.hostname) || location.protocol === 'file:';
    bSubmit.disabled = true;
    try {
      if (local) {
        showDone(first, true);
      } else {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(data).toString(),
        });
        if (!res.ok) throw new Error(res.statusText);
        showDone(first, false);
      }
    } catch (err) {
      status.textContent = 'Something went wrong sending your request. Please try again in a moment.';
      status.classList.add('is-error');
    }
    bSubmit.disabled = false;
  });
  updateSummary();

  /* ==========================================================================
     Header & footer extras
     ========================================================================== */

  // Wordmark intro: plays on load (header), when the footer logo comes into view,
  // and again whenever a logo is hovered or focused
  if (motion) {
    const playLogo = (el) => {
      if (el.dataset.playing) return;
      el.dataset.playing = '1';
      el.classList.remove('is-anim', 'is-idle');
      void el.offsetWidth;
      el.classList.add('is-anim');
      // once the intro has settled, the ball starts its occasional dink off the paddle
      setTimeout(() => { delete el.dataset.playing; el.classList.add('is-idle'); }, 2000);
    };
    const navLogo = $('.nav .logo');
    const footLogo = $('.flogo');
    playLogo(navLogo);
    [navLogo, footLogo].forEach((el) => {
      el.addEventListener('pointerenter', () => playLogo(el));
      el.addEventListener('focus', () => playLogo(el));
    });
    const footIO = new IntersectionObserver(([en]) => { if (en.isIntersecting) { footIO.disconnect(); playLogo(footLogo); } }, { threshold: 0.6 });
    footIO.observe(footLogo);
  }

  // Ticker loops seamlessly
  const tickerTrack = $('.nav__ticker-track');
  if (tickerTrack) tickerTrack.innerHTML += tickerTrack.innerHTML;

  // Rolling text on hover
  $$('.nav__links a, .flink').forEach((a) => {
    const t = a.textContent.trim();
    const roll = d.createElement('span');
    const inner = d.createElement('span');
    roll.className = 'roll';
    roll.dataset.text = t;
    inner.textContent = t;
    roll.appendChild(inner);
    a.replaceChildren(roll);
  });

  // Footer wordmark: a spotlight follows the cursor and drifts on its own when idle
  const fword = $('.fword');
  if (fword) {
    let lastMove = 0, on = false;
    const drift = (t) => {
      if (!on) return;
      if (!reduce && t - lastMove > 2000) {
        const r = fword.getBoundingClientRect();
        fword.style.setProperty('--mx', `${r.width * (0.5 + Math.sin(t / 1600) * 0.42)}px`);
        fword.style.setProperty('--my', `${r.height * (0.5 + Math.cos(t / 1100) * 0.25)}px`);
      }
      requestAnimationFrame(drift);
    };
    fword.parentElement.addEventListener('pointermove', (e) => {
      const r = fword.getBoundingClientRect();
      fword.style.setProperty('--mx', `${e.clientX - r.left}px`);
      fword.style.setProperty('--my', `${e.clientY - r.top}px`);
      lastMove = performance.now();
    });
    new IntersectionObserver(([en]) => { on = en.isIntersecting; if (on) requestAnimationFrame(drift); }).observe(fword);
  }

  // Back to top
  const topBtn = $('.ftop');
  if (topBtn) topBtn.addEventListener('click', () => { scrollToTarget($('#top')); $('.logo').focus({ preventScroll: true }); });

  /* ==========================================================================
     Header state
     ========================================================================== */
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY;
    const max = root.scrollHeight - innerHeight;
    nav.style.setProperty('--prog', (max > 0 ? y / max : 0).toFixed(4));
    nav.classList.toggle('is-solid', y > 30);
    if (!menu.classList.contains('is-open')) nav.classList.toggle('is-hidden', y > lastY && y > innerHeight * 0.8);
    lastY = y;
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();
  nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));
})();
