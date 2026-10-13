/* ==========================================================================
   MINNESOTA MADE HOCKEY — Kurt Johnson · Youth hockey coaching
   Page behaviour. Progressive enhancement: all content is readable with no
   JS and no motion; GSAP / ScrollTrigger / Lenis only add the motion layer.
   Recurring device: THE ICE PATH — the hero puck path, the seams between
   sections, the 20-year route, the rink zones, the gallery line and the
   inquiry progress track all share one thin line + puck marker.
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

  /* ---------- Header: rink-line indicator, active link ---------- */
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
  });

  /* ---------- Buttons: a small directional pull toward the pointer (desktop only) ---------- */
  if (fine && motion) {
    $$('[data-magnetic]').forEach((el) => {
      const xTo = G.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      const yTo = G.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.1);
        yTo((e.clientY - r.top - r.height / 2) * 0.15);
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
     HERO — the coach's name types up, the headline masks in, the rink card
     mask-reveals and its lines draw, then a puck skates one path — once — and
     settles on centre ice. The experience counter runs 00 → 20 once.
     Nothing loops.
     ========================================================================== */
  const hero = $('.hero');
  const nameT = $('.hero__name-t');
  if (nameT) {
    const t = nameT.textContent;
    nameT.innerHTML = `<span class="sr-only">${t}</span>${[...t].map((c) => `<span class="ch" aria-hidden="true">${c}</span>`).join('')}`;
  }
  const hStats = $$('.hscore li', hero);
  const hNum = $('.hscore__num', hero);
  const trail = $('.hrink__trail', hero);
  const hPuck = $('.hrink__puck', hero);

  // The trail is revealed through a solid mask path that draws in step with the puck
  const NS = 'http://www.w3.org/2000/svg';
  let trailMask = null;
  if (trail) {
    const svg = trail.ownerSVGElement;
    const mask = d.createElementNS(NS, 'mask');
    mask.setAttribute('id', 'trailMask');
    mask.setAttribute('maskUnits', 'userSpaceOnUse');
    trailMask = d.createElementNS(NS, 'path');
    trailMask.setAttribute('d', trail.getAttribute('d'));
    trailMask.setAttribute('pathLength', '1');
    trailMask.setAttribute('fill', 'none');
    trailMask.setAttribute('stroke', '#fff');
    trailMask.setAttribute('stroke-width', '10');
    trailMask.style.strokeDasharray = '1';
    mask.appendChild(trailMask);
    $('defs', svg).appendChild(mask);
    trail.setAttribute('mask', 'url(#trailMask)');
  }
  const trailL = trail ? trail.getTotalLength() : 0;
  const skateTo = (p) => {
    const pt = trail.getPointAtLength(trailL * p);
    hPuck.setAttribute('cx', pt.x.toFixed(1));
    hPuck.setAttribute('cy', pt.y.toFixed(1));
    trailMask.style.strokeDashoffset = (1 - p).toFixed(4);
  };

  if (motion) {
    if (hNum) hNum.textContent = '00';
    skateTo(0);
    const skate = () => {
      hero.classList.add('is-skated');
      const o = { p: 0 };
      G.to(o, { p: 1, duration: 2.1, ease: 'power2.inOut', onUpdate: () => skateTo(o.p) });
    };
    const countUp = () => {
      if (!hNum) return;
      const o = { n: 0 };
      G.to(o, { n: Number(hNum.dataset.count), duration: 1.6, ease: 'power2.out', onUpdate: () => { hNum.textContent = pad(Math.round(o.n)); }, onComplete: () => { hNum.textContent = `~${hNum.dataset.count}`; } });
    };
    G.timeline({ delay: 0.15 })
      .to('.hero__name-tag .puck', { scale: 1, duration: 0.7, ease: 'back.out(2)' }, 0)
      .to('.hero__name-t .ch', { y: 0, yPercent: 0, duration: 0.8, stagger: 0.022, ease: 'expo.out' }, 0.08)
      .to('.hero__brand', { opacity: 1, x: 0, duration: 0.8, ease: 'expo.out' }, 0.5)
      .to('.hl__in', { y: 0, yPercent: 0, duration: 1.15, stagger: 0.13, ease: 'expo.out' }, 0.35)
      .add(() => hero.classList.add('is-drawn'), 0.7)
      .add(() => hero.classList.add('is-hi'), 1.2)
      .add(() => hero.classList.add('is-ready'), 1.5)
      .add(skate, 1.9)
      .add(() => hStats.forEach((s, i) => setTimeout(() => { s.classList.add('in'); if (i === 0) countUp(); }, i * 120)), 2.2);

    // depth: the rink drifts a little slower than the copy as the hero scrolls away (desktop only)
    G.matchMedia().add('(min-width: 1024px)', () => {
      const tw = G.to('.hrink', { y: -50, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      return () => { tw.scrollTrigger.kill(); tw.kill(); G.set('.hrink', { clearProps: 'y' }); };
    });
  }

  /* ==========================================================================
     Scroll reveals & effects
     ========================================================================== */
  if (motion) {
    const once = (el, fn, start = 'top 86%') => el && ST.create({ trigger: el, start, once: true, onEnter: fn });
    const notHero = (el) => !el.closest('.hero');

    $$('.split').forEach((el) => once(el, () => el.classList.add('in')));
    $$('.fade').filter(notHero).forEach((el) => once(el, () => el.classList.add('in')));
    $$('.reveal-img').filter(notHero).forEach((el) => once(el, () => el.classList.add('in'), 'top 82%'));
    $$('.seam').forEach((el) => once(el, () => el.classList.add('in'), 'top 90%'));
    $$('.zones').forEach((group) => $$('.fade', group).forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 0.08}s`; }));

    // About intro fills in word by word
    const intro = $('.about__intro');
    intro.innerHTML = intro.textContent.trim().split(/\s+/).map((w) => `<span class="fw">${w}</span>`).join(' ');
    G.fromTo($$('.fw', intro), { opacity: 0.18 }, {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: intro, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });

    // Gallery feature opens to full width
    G.fromTo('.reel__feature', { clipPath: 'inset(0% 12% 0% 12% round 26px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 26px)', ease: 'none',
      scrollTrigger: { trigger: '.reel', start: 'top 90%', end: 'center 55%', scrub: true },
    });
    // …and the ice path becomes the gallery's transition line
    G.fromTo('.gline', { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: { trigger: '.grid', start: 'top 88%', end: 'bottom 50%', scrub: true } });

    once($('.fcta__title'), () => G.to('.fcta__title .line__in', { y: 0, yPercent: 0, duration: 1.2, stagger: 0.14, ease: 'expo.out' }), 'top 85%');
    once($('.frink'), () => $('.frink').classList.add('in'), 'top 75%');

    ST.sort();
    d.fonts && d.fonts.ready.then(() => { ST.sort(); ST.refresh(); });
  }

  /* ==========================================================================
     NEARLY 20 YEARS — one development path. The stage nearest the reading
     line becomes active: the ice path draws to its node, the puck travels with
     it, the stage word and tint change. The counter runs to ~20 once, the first
     time the section is reached. On mobile each stage is also an accordion.
     ========================================================================== */
  const story = $('.story');
  const sStops = $$('.sstop', story);
  const sPanel = $('.story__panel');
  const sWord = $('.story__word');
  const sChapter = $('.story__chapter');
  const sDraw = $('.route__draw');
  const sPuck = $('.route__puck');
  const sNodesG = $('.route__nodes');
  const sList = $('.story__list');
  const sNumEl = $('.story__num');
  const sCount = $('.story__count');
  const sIdx = $('.story__idx');
  const sTtl = $('.story__ttl');
  const sPinB = $('.story__pin--b');
  const mqMobile = matchMedia('(max-width: 1023px)');
  story.classList.add('js-story');
  const routeL = sDraw.getTotalLength();
  sDraw.style.strokeDasharray = routeL;
  const sNodes = sStops.map((_, i) => {
    const p = sDraw.getPointAtLength((routeL * i) / (sStops.length - 1));
    const c = d.createElementNS(NS, 'circle');
    c.setAttribute('cx', p.x.toFixed(1));
    c.setAttribute('cy', p.y.toFixed(1));
    c.setAttribute('r', '6');
    c.setAttribute('class', 'route__node');
    sNodesG.appendChild(c);
    return c;
  });
  const swap = (el) => { el.classList.remove('is-swap'); void el.offsetWidth; el.classList.add('is-swap'); };

  let counted = !motion;
  const countYears = () => {
    if (counted) return;
    counted = true;
    const o = { n: 0 };
    G.to(o, { n: 20, duration: 1.6, ease: 'power2.out', onUpdate: () => { sNumEl.textContent = pad(Math.round(o.n)); }, onComplete: () => sCount.classList.add('is-full') });
  };
  if (motion) { sNumEl.textContent = '00'; sCount.classList.remove('is-full'); }

  let sActive = -1;
  const setOpen = (st, open) => {
    st.classList.toggle('is-open', open);
    if (mqMobile.matches) $('.sstop__head', st).setAttribute('aria-expanded', String(open));
  };
  const syncExpanded = () => sStops.forEach((st) => $('.sstop__head', st).setAttribute('aria-expanded', String(!mqMobile.matches || st.classList.contains('is-open'))));
  const setStory = (i) => {
    if (i === sActive) return;
    sActive = i;
    const st = sStops[i];
    const title = $('.sstop__t', st).textContent;
    sStops.forEach((s, k) => { s.classList.toggle('is-active', k === i); s.classList.toggle('is-on', k <= i); });
    if (mqMobile.matches && !st.classList.contains('is-open')) setOpen(st, true);
    sNodes.forEach((n, k) => n.classList.toggle('is-on', k <= i));
    sPanel.dataset.tone = st.dataset.tone;
    $('span', sChapter).textContent = `Stage · ${title}`;
    swap(sChapter);
    sWord.textContent = st.dataset.word;
    swap(sWord);
    sIdx.textContent = pad(i + 1);
    sTtl.textContent = title;
    sPinB.classList.toggle('is-on', i === sStops.length - 1);
  };
  const placeRoute = (p) => {
    sDraw.style.strokeDashoffset = (routeL * (1 - p)).toFixed(2);
    const pt = sDraw.getPointAtLength(routeL * p);
    sPuck.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
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
  sStops.forEach((st) => {
    $('.sstop__head', st).addEventListener('click', () => {
      if (mqMobile.matches) { setOpen(st, !st.classList.contains('is-open')); return; }
      // desktop: bring this stage to the reading line; the scroll sync does the rest
      scrollToY(scrollY + st.getBoundingClientRect().top + 18 - storyLine() + 2);
    });
  });
  mqMobile.addEventListener('change', () => { syncExpanded(); storyScroll(); });
  setStory(0);
  syncExpanded();
  storyScroll();
  new IntersectionObserver(([en]) => { sOn = en.isIntersecting; if (sOn) { storyScroll(); countYears(); } }, { rootMargin: '0px 0px -25% 0px' }).observe(story);
  addEventListener('scroll', () => { if (sOn && !sTick) { sTick = true; requestAnimationFrame(storyScroll); } }, { passive: true });
  addEventListener('resize', () => requestAnimationFrame(storyScroll));

  /* ==========================================================================
     PLAYER DEVELOPMENT — stage selector (ARIA tabs) on one simplified rink.
     Switching lights the stage's rink zone, skates the puck there, wipes in
     the stage's photo slot, staggers in its copy and slides the tab indicator.
     "Ask about training" pre-fills the inquiry (handled in the form section).
     ========================================================================== */
  const plTabs = $$('.pl__tab');
  const plPanels = $$('.pl__panel');
  const plStage = $('.pl__stage');
  const plInd = $('.pl__ind');
  const plImgs = $$('.pl__media img');
  const plPuck = $('.pl__puck');
  const plRinkT = $('.pl__rink-t');
  let plCur = 0;
  root.classList.add('js-pl-ready');
  const plMoveInd = () => {
    const t = plTabs[plCur];
    plInd.style.width = `${t.offsetWidth}px`;
    plInd.style.height = `${t.offsetHeight}px`;
    plInd.style.transform = `translate(${t.offsetLeft}px, ${t.offsetTop - 6}px)`;
  };
  const plRink = (panel, moved) => {
    plPuck.style.setProperty('--px', panel.dataset.px);
    plPuck.style.setProperty('--py', panel.dataset.py);
    $('.pl__zone-t', plRinkT).textContent = panel.dataset.zone;
    $('b', plRinkT).textContent = panel.dataset.focus;
    if (!moved) return;
    swap(plRinkT);
    plPuck.classList.remove('is-moved'); void plPuck.offsetWidth; plPuck.classList.add('is-moved');
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
    plRink(inP, true);
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
  plRink(plPanels[0], false);
  plMoveInd();
  addEventListener('resize', plMoveInd);
  d.fonts && d.fonts.ready.then(plMoveInd);

  /* ==========================================================================
     Gallery viewer — a larger look at any frame that has a .tile__open button
     (added once Kurt's real photos are in place)
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
     TRAINING INQUIRY — four steps. Panels slide along a track, the ice-path
     progress line fills with a puck riding it, the summary on the left fills
     in as you choose, and a confirmation replaces the form on send.
     Without JS it is one ordinary form (Netlify Forms). Inquiry first:
     nothing here books, schedules or takes payment.
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
  const STEP_NAME = ['inquirer', 'player_age', 'experience'];
  const STEP_ERR = ['Please choose who is asking.', "Please choose the player's age (approximate is fine).", 'Please choose an option — "Not sure" is fine.'];
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

  // a development stage chosen above pre-fills the experience step (parents can change it)
  const preset = (name, value) => {
    const inp = $(`input[name="${name}"][value="${value}"]`, lform);
    if (!inp) return;
    inp.checked = true;
    const card = inp.closest('.ocard');
    card.classList.remove('is-flash');
    setTimeout(() => card.classList.add('is-flash'), lenis ? 900 : 200);
    updateSummary();
    if (lform.classList.contains('is-done')) return;
    goStep(bStep, false);
  };
  const LEVEL = { starting: ['experience', 'New to hockey'], developing: ['experience', 'Developing'] };
  d.addEventListener('click', (e) => {
    const lv = e.target.closest('a[data-level]');
    if (lv && LEVEL[lv.dataset.level]) preset(...LEVEL[lv.dataset.level]);
  });

  const showDone = (first, preview) => {
    const rows = [['Asking', checked('inquirer').join(', ')], ['Player age', checked('player_age').join(', ')], ['Experience', checked('experience').join(', ')]].filter((r) => r[1]);
    $('.bdone__p', bDone).textContent = preview
      ? `Thanks, ${first}. (Preview mode — inquiries send for real once the site is live on Netlify.)`
      : `Thanks, ${first}. Your question is on its way to Kurt, and he can follow up with you by email.`;
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
      status.textContent = 'Something went wrong sending your inquiry. Please try again in a moment, or email minnesota.mnmadehockey@gmail.com.';
      status.classList.add('is-error');
    }
    bSubmit.disabled = false;
  });
  updateSummary();

  /* ==========================================================================
     Header & footer extras
     ========================================================================== */

  // Logo: the intro plays on load (header), when the footer logo comes into view,
  // and on hover/focus. Afterwards a calm 7-second loop: line draws → puck travels → MMH locks.
  if (motion) {
    const playLogo = (el) => {
      if (el.dataset.playing) return;
      el.dataset.playing = '1';
      el.classList.remove('is-anim', 'is-idle');
      void el.offsetWidth;
      el.classList.add('is-anim');
      setTimeout(() => { delete el.dataset.playing; el.classList.add('is-idle'); }, 1800);
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
