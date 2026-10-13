/* ==========================================================================
   3D COURT VIEWER — used only in the "Why train with Leon" section.
   Broadcast / ball-tracking style: realistic court, position markers,
   tracked ball arcs with bounce marks. Loaded lazily by main.js.
   Units: 1 = 1 ft. Court length runs along X (net at x = 0).
   ========================================================================== */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const C = {
  bg: 0x173F32, court: 0x5F9274, apron: 0xE5E1D8, ground: 0x242824,
  you: 0xD8E64C, mate: 0xF7F5EF, opp: 0xE58148, white: 0xF7F5EF,
};
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function webgl() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}

export function mountCourt(root) {
  if (!webgl()) { root.classList.add('no-webgl'); return null; }
  const canvas = root.querySelector('.viewer__canvas');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = () => root.clientWidth < 760;

  /* ---------- Renderer ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.bg);
  scene.fog = new THREE.Fog(C.bg, 90, 200);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 500);

  scene.add(new THREE.HemisphereLight(0xF7F5EF, C.bg, 0.6));
  const key = new THREE.DirectionalLight(0xF7F5EF, 2.6);
  key.position.set(-26, 48, 22);
  key.castShadow = true;
  key.shadow.mapSize.set(small() ? 1024 : 2048, small() ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -48, right: 48, top: 30, bottom: -30, near: 5, far: 140 });
  key.shadow.radius = 4;
  key.shadow.bias = -0.0004;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x5F9274, 0.7);
  fill.position.set(32, 22, -26);
  scene.add(fill);

  /* ---------- Textures ---------- */
  const grain = (hex, amp = 9, size = 256) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const g = cv.getContext('2d');
    const col = new THREE.Color(hex);
    const img = g.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * amp;
      img.data[i] = Math.min(255, Math.max(0, col.r * 255 + n));
      img.data[i + 1] = Math.min(255, Math.max(0, col.g * 255 + n));
      img.data[i + 2] = Math.min(255, Math.max(0, col.b * 255 + n));
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  };
  const radial = (inner, outer) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const g = cv.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, inner); gr.addColorStop(1, outer);
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(cv);
  };
  const roundRect = (g, x, y, w, h, r) => {
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  };
  const label = (text, accent) => {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 128;
    const g = cv.getContext('2d');
    g.font = '700 44px "Archivo", Arial, sans-serif';
    const w = Math.min(500, g.measureText(text).width + 84);
    const x = (512 - w) / 2;
    g.fillStyle = 'rgba(24,38,51,0.9)';
    roundRect(g, x, 20, w, 88, 44); g.fill();
    g.fillStyle = accent;
    g.beginPath(); g.arc(x + 40, 64, 11, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#F7F5EF';
    g.textBaseline = 'middle';
    g.fillText(text, x + 62, 66);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
    s.scale.set(8, 2, 1);
    s.renderOrder = 10;
    return s;
  };

  /* ---------- Court ---------- */
  const flat = (w, d, mat, y) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  flat(320, 320, new THREE.MeshStandardMaterial({ color: C.ground, roughness: 1 }), 0);
  const apronTex = grain(C.apron, 10); apronTex.repeat.set(10, 6);
  flat(64, 36, new THREE.MeshStandardMaterial({ map: apronTex, roughness: 0.88 }), 0.01);
  const courtTex = grain(C.court, 10); courtTex.repeat.set(8, 4);
  flat(44, 20, new THREE.MeshStandardMaterial({ map: courtTex, roughness: 0.82 }), 0.02);

  const kitchenGlow = new THREE.MeshBasicMaterial({ color: C.you, transparent: true, opacity: 0, depthWrite: false });
  [-3.5, 3.5].forEach((x) => { const k = flat(7, 20, kitchenGlow, 0.03); k.position.x = x; });

  const lineMat = new THREE.MeshStandardMaterial({ color: C.white, roughness: 0.5, emissive: 0x242824 });
  const line = (x1, z1, x2, z2, parent = scene, mat = lineMat, w = 0.17, y = 0.04) => {
    const len = Math.hypot(x2 - x1, z2 - z1) + w;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, w), mat);
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = -Math.atan2(z2 - z1, x2 - x1);
    m.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  line(-22, -10, 22, -10); line(-22, 10, 22, 10); line(-22, -10, -22, 10); line(22, -10, 22, 10);
  line(-7, -10, -7, 10); line(7, -10, 7, 10); line(-22, 0, -7, 0); line(7, 0, 22, 0);

  // Net: metal posts, fine mesh, white headband, centre strap
  const metal = new THREE.MeshStandardMaterial({ color: 0x242824, metalness: 0.7, roughness: 0.35 });
  [-11, 11].forEach((z) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.05, 18), metal);
    post.position.set(0, 1.52, z);
    post.castShadow = true;
    scene.add(post);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.12, 24), metal);
    base.position.set(0, 0.06, z);
    scene.add(base);
  });
  const meshTex = (() => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 32;
    const g = cv.getContext('2d');
    g.strokeStyle = 'rgba(10,12,16,0.95)';
    g.lineWidth = 2;
    g.strokeRect(0, 0, 32, 32);
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(66, 8);
    t.anisotropy = 8;
    return t;
  })();
  const net = new THREE.Mesh(new THREE.PlaneGeometry(22, 2.6), new THREE.MeshStandardMaterial({ map: meshTex, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, color: 0x242824 }));
  net.rotation.y = Math.PI / 2;
  net.position.set(0, 1.55, 0);
  net.castShadow = true;
  scene.add(net);
  const white = new THREE.MeshStandardMaterial({ color: C.white, roughness: 0.6 });
  const tape = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 22), white);
  tape.position.set(0, 2.88, 0);
  tape.castShadow = true;
  scene.add(tape);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.7, 0.18), white);
  strap.position.set(0, 1.5, 0);
  scene.add(strap);

  /* ---------- Ball (textured) + contact shadow ---------- */
  const ballTex = (() => {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 256;
    const g = cv.getContext('2d');
    g.fillStyle = '#D8E64C'; g.fillRect(0, 0, 512, 256);
    g.fillStyle = 'rgba(24,38,51,0.5)';
    for (let row = 1; row < 6; row++) {
      const y = (row / 6) * 256;
      const count = Math.max(4, Math.round(10 * Math.sin((row / 6) * Math.PI)));
      for (let i = 0; i < count; i++) {
        g.beginPath();
        g.ellipse(((i + (row % 2) * 0.5) / count) * 512, y, 13, 10, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 20), new THREE.MeshStandardMaterial({ map: ballTex, roughness: 0.55, emissive: 0xD8E64C, emissiveIntensity: 0.12 }));
  ball.castShadow = true;
  scene.add(ball);
  const ballShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: radial('rgba(0,0,0,0.55)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false }));
  ballShadow.rotation.x = -Math.PI / 2;
  ballShadow.position.y = 0.05;
  scene.add(ballShadow);

  /* ---------- Position markers ---------- */
  const glowTex = radial('rgba(255,255,255,0.55)', 'rgba(255,255,255,0)');
  const marker = (color, text, accent) => {
    const g = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.5, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false }));
    disc.rotation.x = -Math.PI / 2; disc.position.y = 0.06;
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.42, 1.6, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.07;
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ map: glowTex, color, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.rotation.x = -Math.PI / 2; glow.position.y = 0.05;
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 4, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 }));
    pin.position.y = 2;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshBasicMaterial({ color }));
    head.position.y = 4.05;
    const tag = label(text, accent);
    tag.position.y = 5.5;
    g.add(glow, disc, ring, pin, head, tag);
    scene.add(g);
    return { g, ring, pos: new THREE.Vector3(), target: new THREE.Vector3(), vis: 0, visTarget: 0 };
  };
  const P = {
    you: marker(C.you, 'YOU', '#D8E64C'),
    mate: marker(C.mate, 'PARTNER', '#F7F5EF'),
    o1: marker(C.opp, 'OPPONENT', '#E58148'),
    o2: marker(C.opp, 'OPPONENT', '#E58148'),
  };
  const place = (m, x, z, snap) => { m.target.set(x, 0, z); if (snap) m.pos.set(x, 0, z); };

  // Singles: coverage trail + recovery zone
  const trailPts = [];
  const trailLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: C.you, dashSize: 0.6, gapSize: 0.45, transparent: true, opacity: 0.8 }));
  trailLine.position.y = 0.08;
  scene.add(trailLine);
  const recovery = new THREE.Group();
  const recRing = new THREE.Mesh(new THREE.RingGeometry(2.4, 2.55, 64), new THREE.MeshBasicMaterial({ color: C.you, transparent: true, opacity: 0.7, depthWrite: false }));
  recRing.rotation.x = -Math.PI / 2;
  const recTag = label('RECOVERY', '#D8E64C');
  recTag.scale.set(6.4, 1.6, 1);
  recTag.position.set(0, 1.2, 0);
  recovery.add(recRing, recTag);
  recovery.position.set(-19.5, 0.07, 0);
  scene.add(recovery);

  // Doubles: partner spacing line
  const spacing = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineDashedMaterial({ color: C.mate, dashSize: 0.5, gapSize: 0.4, transparent: true, opacity: 0.8 }));
  spacing.position.y = 0.09;
  scene.add(spacing);

  /* ---------- Tennis court overlay (size mode) ---------- */
  const tennis = new THREE.Group();
  const tMat = new THREE.MeshBasicMaterial({ color: C.white, transparent: true, opacity: 0, depthWrite: false });
  const tl = (a, b, c, e) => line(a, b, c, e, tennis, tMat, 0.3, 0.06);
  tl(-39, -18, 39, -18); tl(-39, 18, 39, 18); tl(-39, -18, -39, 18); tl(39, -18, 39, 18);
  tl(-39, -13.5, 39, -13.5); tl(-39, 13.5, 39, 13.5);
  tl(-21, -13.5, -21, 13.5); tl(21, -13.5, 21, 13.5); tl(-21, 0, 21, 0);
  scene.add(tennis);
  const tagTennis = label('TENNIS · 78 × 36 FT', '#F7F5EF');
  const tagPickle = label('PICKLEBALL · 44 × 20 FT', '#D8E64C');
  const tagKitchen = label('KITCHEN · 7 FT', '#D8E64C');
  [tagTennis, tagPickle, tagKitchen].forEach((t) => { t.scale.set(11, 2.75, 1); t.material.opacity = 0; scene.add(t); });
  tagTennis.position.set(-30, 4, -19);
  tagPickle.position.set(-15, 4, -11.5);
  tagKitchen.position.set(-3.5, 3.4, 11.5);

  /* ---------- Tracked shots ---------- */
  const TUBE_SEG = 90, RAD_SEG = 6;
  const shots = [];
  const bounces = [];
  let shot = null;
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  const arc = (a, b, peak) => {
    const c = a.clone().lerp(b, 0.5);
    c.y = 2 * peak - (a.y + b.y) / 2;
    return new THREE.QuadraticBezierCurve3(a, c, b);
  };
  const makeShot = (hitter, receiver, p0, pb, p2, h1, h2, d1, d2, color) => {
    const c1 = arc(p0, pb, h1);
    const c2 = arc(pb, p2, h2);
    const path = new THREE.CurvePath();
    path.add(c1); path.add(c2);
    const geo = new THREE.TubeGeometry(path, TUBE_SEG, 0.075, RAD_SEG, false);
    geo.setDrawRange(0, 0);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, depthWrite: false }));
    scene.add(mesh);
    const L1 = c1.getLength(), L2 = c2.getLength();
    const s = { hitter, receiver, c1, c2, d1, d2, t: 0, mesh, geo, f1: L1 / (L1 + L2), bounced: false, pb, fade: -1 };
    shots.push(s);
    return s;
  };
  const addBounce = (p, color) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.42, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(p.x, 0.09, p.z);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.34, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false }));
    dot.rotation.x = -Math.PI / 2;
    dot.position.set(p.x, 0.085, p.z);
    scene.add(ring, dot);
    bounces.push({ ring, dot, age: 0 });
  };
  const clearShots = () => {
    timers.forEach(clearTimeout); timers.length = 0;
    shots.forEach((s) => { scene.remove(s.mesh); s.geo.dispose(); s.mesh.material.dispose(); });
    shots.length = 0;
    bounces.forEach((b) => { scene.remove(b.ring, b.dot); b.ring.geometry.dispose(); b.dot.geometry.dispose(); });
    bounces.length = 0;
    shot = null;
  };
  const contact = (m, y = 2.6) => new THREE.Vector3(m.pos.x + (m.pos.x < 0 ? 0.9 : -0.9), y, m.pos.z);
  const colorFor = (m) => (m === P.you ? C.you : m === P.mate ? C.mate : C.opp);

  /* ---------- Modes ---------- */
  let mode = 'singles';
  let dinkCount = 0;
  let phaseT = 0;
  const VIEWS = {
    singles: { az: -72, el: 24, r: 66, target: [2, 0, 0] },
    doubles: { az: -52, el: 27, r: 62, target: [0, 0, 0] },
    size: { az: -24, el: 52, r: 112, target: [0, 0, 0] },
  };

  const singlesShot = (from) => {
    const to = from === P.you ? P.o1 : P.you;
    const dir = to.pos.x > 0 ? 1 : -1;
    const pb = new THREE.Vector3(dir * rand(12, 18), 0.25, rand(-8.2, 8.2));
    const p2 = new THREE.Vector3(THREE.MathUtils.clamp(pb.x + dir * 3.2, -24, 24), 2.3, THREE.MathUtils.clamp(pb.z * 1.1, -9.5, 9.5));
    place(to, p2.x + dir * 0.9, p2.z);
    shot = makeShot(from, to, contact(from), pb, p2, rand(5, 7.5), 3.1, 1.15, 0.4, colorFor(from));
    if (from === P.you) later(() => { if (mode === 'singles') place(P.you, -19.5, 0); }, 900); // recover to the middle
  };
  const doublesDrop = () => {
    const pb = new THREE.Vector3(rand(2.5, 5.5), 0.25, rand(-6, 6));
    const recv = pb.z < 0 ? P.o1 : P.o2;
    const p2 = new THREE.Vector3(8.4, 1.9, pb.z * 0.8 + recv.pos.z * 0.2);
    shot = makeShot(P.you, recv, contact(P.you, 2.4), pb, p2, 5.2, 2.2, 1.4, 0.4, C.you);
    // Transition: the team moves up together behind the drop
    later(() => { if (mode === 'doubles') { place(P.you, -8.6, -4.8); place(P.mate, -8.6, 4.8); } }, 250);
  };
  const doublesDink = (from) => {
    const mine = from === P.you || from === P.mate;
    const recv = mine ? pick([P.o1, P.o2]) : pick([P.you, P.mate]);
    const dir = mine ? 1 : -1;
    const left = recv === P.you || recv === P.o1;
    const pb = new THREE.Vector3(dir * rand(2.4, 6), 0.25, THREE.MathUtils.clamp(recv.pos.z + rand(-2.5, 2.5), -9, 9));
    const p2 = new THREE.Vector3(dir * 8.2, 1.6, pb.z);
    place(recv, dir * 8.6, THREE.MathUtils.clamp(pb.z, left ? -9 : 0.5, left ? -0.5 : 9));
    shot = makeShot(from, recv, contact(from, 1.9), pb, p2, 3.3, 1.5, 0.95, 0.32, colorFor(from));
  };

  const drag = { az: 0, el: 0, active: false, x: 0, y: 0, idle: 10 };

  // Reduced motion: one representative, fully drawn rally per mode
  const staticFrame = () => {
    if (mode === 'singles') {
      const s1 = makeShot(P.you, P.o1, contact(P.you), new THREE.Vector3(15, 0.25, 6), new THREE.Vector3(18.5, 2.3, 7), 6.5, 3, 1, 0.4, C.you);
      const s2 = makeShot(P.o1, P.you, new THREE.Vector3(18.6, 2.6, 7), new THREE.Vector3(-14, 0.25, -7), new THREE.Vector3(-17.5, 2.3, -7.5), 6, 3, 1, 0.4, C.opp);
      [s1, s2].forEach((s) => { s.geo.setDrawRange(0, Infinity); addBounce(s.pb, s.mesh.material.color.getHex()); });
    } else if (mode === 'doubles') {
      place(P.you, -8.6, -4.8, true); place(P.mate, -8.6, 4.8, true);
      const s = makeShot(P.you, P.o1, contact(P.you, 2.4), new THREE.Vector3(4, 0.25, -3), new THREE.Vector3(8.4, 1.9, -3.5), 5.2, 2.2, 1, 0.4, C.you);
      s.geo.setDrawRange(0, Infinity);
      addBounce(s.pb, C.you);
    }
    Object.values(P).forEach((p) => { p.pos.copy(p.target); p.vis = p.visTarget; });
    shot = null;
  };

  const setMode = (m) => {
    mode = m;
    clearShots();
    trailPts.length = 0;
    dinkCount = 0;
    phaseT = 0;
    drag.az = 0; drag.el = 0;
    const vis = { you: m !== 'size', mate: m === 'doubles', o1: m !== 'size', o2: m === 'doubles' };
    Object.entries(vis).forEach(([k, v]) => { P[k].visTarget = v ? 1 : 0; });
    if (m === 'singles') {
      place(P.you, -19.5, 0, true); place(P.o1, 19.5, 0, true);
      if (!reduce) later(() => { if (mode === 'singles' && !shot) singlesShot(P.you); }, 500);
    } else if (m === 'doubles') {
      place(P.you, -21, -4.8, true); place(P.mate, -21, 4.8, true); place(P.o1, 8.6, -4.8, true); place(P.o2, 8.6, 4.8, true);
      if (!reduce) later(() => { if (mode === 'doubles' && !shot) doublesDrop(); }, 600);
    }
    if (reduce) staticFrame();
  };

  /* ---------- Camera + drag to rotate ---------- */
  const cam = { az: VIEWS.singles.az, el: VIEWS.singles.el, r: VIEWS.singles.r * (small() ? 0.92 : 1), target: new THREE.Vector3(...VIEWS.singles.target) };
  canvas.addEventListener('pointerdown', (e) => { drag.active = true; drag.x = e.clientX; drag.y = e.clientY; canvas.setPointerCapture(e.pointerId); root.classList.add('is-dragging'); });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag.active) return;
    drag.az = THREE.MathUtils.clamp(drag.az - (e.clientX - drag.x) * 0.25, -75, 75);
    if (e.pointerType === 'mouse') drag.el = THREE.MathUtils.clamp(drag.el + (e.clientY - drag.y) * 0.15, -14, 30);
    drag.x = e.clientX; drag.y = e.clientY; drag.idle = 0;
  });
  const endDrag = () => { drag.active = false; root.classList.remove('is-dragging'); };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  /* ---------- Size / visibility ---------- */
  const resize = () => {
    const w = canvas.clientWidth || root.clientWidth, h = canvas.clientHeight || root.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = small() ? 44 : 32;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
  let sample = 0;
  let visible = false;
  let running = false;

  function tick() {
    if (!visible) { running = false; return; }
    running = true;
    requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    // Camera
    const v = VIEWS[mode];
    if (!drag.active) drag.idle += dt;
    const drift = reduce || drag.idle < 3 ? 0 : Math.sin(time * 0.18) * 6;
    const k = reduce ? 1 : 1 - Math.pow(0.02, dt);
    cam.az += (v.az + drag.az + drift - cam.az) * k;
    cam.el += (v.el + drag.el - cam.el) * k;
    cam.r += (v.r * (small() ? 0.92 : 1) - cam.r) * k;
    cam.target.lerp(tmp.set(...v.target), k);
    const az = THREE.MathUtils.degToRad(cam.az), el = THREE.MathUtils.degToRad(cam.el);
    camera.position.set(cam.target.x + Math.sin(az) * Math.cos(el) * cam.r, cam.target.y + Math.sin(el) * cam.r, cam.target.z + Math.cos(az) * Math.cos(el) * cam.r);
    camera.lookAt(cam.target);

    // Markers
    Object.values(P).forEach((m) => {
      const kk = reduce ? 1 : Math.min(1, dt * (mode === 'singles' ? 2.4 : 2.8));
      m.pos.lerp(m.target, kk);
      m.vis += (m.visTarget - m.vis) * (reduce ? 1 : Math.min(1, dt * 5));
      m.g.position.copy(m.pos);
      m.g.scale.setScalar(Math.max(0.001, m.vis));
      m.g.visible = m.vis > 0.02;
      m.ring.scale.setScalar(reduce ? 1 : 1 + Math.sin(time * 3 + m.pos.x) * 0.04);
    });

    // Singles coverage trail + recovery zone
    const singles = mode === 'singles';
    recovery.visible = singles;
    recRing.scale.setScalar(reduce ? 1 : 1 + Math.sin(time * 2.2) * 0.08);
    sample += dt;
    if (singles && sample > 0.06) {
      sample = 0;
      trailPts.push(new THREE.Vector3(P.you.pos.x, 0, P.you.pos.z));
      if (trailPts.length > 90) trailPts.shift();
      trailLine.geometry.setFromPoints(trailPts);
      trailLine.computeLineDistances();
    }
    trailLine.visible = singles && trailPts.length > 1;

    // Doubles spacing
    const doubles = mode === 'doubles';
    spacing.visible = doubles && P.mate.vis > 0.5;
    if (spacing.visible) {
      spacing.geometry.setFromPoints([P.you.pos, P.mate.pos]);
      spacing.computeLineDistances();
    }

    // Tennis vs pickleball (loops every 8 s)
    const size = mode === 'size';
    tennis.visible = size;
    let kGlow = doubles ? 0.1 : 0;
    if (size) {
      phaseT = reduce ? 5 : (phaseT + dt) % 8;
      const shrink = THREE.MathUtils.smoothstep(phaseT, 1.6, 3.8);
      tennis.scale.set(1 - shrink * (1 - 44 / 78), 1, 1 - shrink * (1 - 20 / 36));
      tMat.opacity = 0.9 * (1 - THREE.MathUtils.smoothstep(phaseT, 3.4, 4.2)) * THREE.MathUtils.smoothstep(phaseT, 0, 0.5);
      tagTennis.material.opacity = tMat.opacity;
      const on = THREE.MathUtils.smoothstep(phaseT, 3.6, 4.4) * (1 - THREE.MathUtils.smoothstep(phaseT, 7.4, 8));
      tagPickle.material.opacity = reduce ? 1 : on;
      tagKitchen.material.opacity = reduce ? 1 : on;
      kGlow = (reduce ? 1 : on) * (0.32 + (reduce ? 0 : Math.sin(time * 3) * 0.05));
    } else {
      [tagTennis, tagPickle, tagKitchen].forEach((t) => { t.material.opacity = 0; });
    }
    kitchenGlow.opacity += (kGlow - kitchenGlow.opacity) * (reduce ? 1 : Math.min(1, dt * 4));

    // Rally
    ball.visible = !size && (!!shot || reduce);
    if (!reduce && shot) {
      shot.t += dt;
      const { c1, c2, d1, d2 } = shot;
      let u;
      if (shot.t < d1) { c1.getPoint(shot.t / d1, ball.position); u = (shot.t / d1) * shot.f1; }
      else {
        if (!shot.bounced) { shot.bounced = true; addBounce(shot.pb, shot.mesh.material.color.getHex()); }
        const f = Math.min(1, (shot.t - d1) / d2);
        c2.getPoint(f, ball.position);
        u = shot.f1 + f * (1 - shot.f1);
      }
      shot.geo.setDrawRange(0, Math.floor(u * TUBE_SEG) * RAD_SEG * 6);
      ball.rotation.z -= dt * 9;
      if (shot.t >= d1 + d2) {
        shot.fade = 0;
        const next = shot.receiver;
        if (mode === 'singles') singlesShot(next);
        else if (mode === 'doubles') {
          dinkCount++;
          if (dinkCount > 11) {
            dinkCount = 0;
            shot = null;
            place(P.you, -21, -4.8); place(P.mate, -21, 4.8);
            later(() => { if (mode === 'doubles' && !shot) doublesDrop(); }, 1600);
          } else doublesDink(next);
        }
      }
    } else if (reduce && !size) {
      ball.position.set(6, 5.5, 2);
    }
    ballShadow.visible = ball.visible;
    ballShadow.position.set(ball.position.x, 0.05, ball.position.z);
    ballShadow.scale.setScalar(1 + ball.position.y * 0.08);
    ballShadow.material.opacity = Math.max(0.15, 1 - ball.position.y * 0.1);

    // Fade old trajectories and bounce marks
    if (!reduce) {
      for (let i = shots.length - 1; i >= 0; i--) {
        const s = shots[i];
        if (s === shot || s.fade < 0) continue;
        s.fade += dt;
        s.mesh.material.opacity = Math.max(0, 0.95 - s.fade * 0.38);
        if (s.mesh.material.opacity <= 0) { scene.remove(s.mesh); s.geo.dispose(); s.mesh.material.dispose(); shots.splice(i, 1); }
      }
      for (let i = bounces.length - 1; i >= 0; i--) {
        const b = bounces[i];
        b.age += dt;
        b.ring.scale.setScalar(1 + b.age * 4);
        b.ring.material.opacity = Math.max(0, 1 - b.age * 1.1);
        b.dot.material.opacity = Math.max(0, 0.85 - b.age * 0.3);
        if (b.age > 3) { scene.remove(b.ring, b.dot); b.ring.geometry.dispose(); b.dot.geometry.dispose(); bounces.splice(i, 1); }
      }
    }

    renderer.render(scene, camera);
    root.classList.add('is-ready');
  }

  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible && !running) { clock.getDelta(); requestAnimationFrame(tick); }
  }, { rootMargin: '100px' }).observe(root);

  setMode('singles');
  return { setMode };
}
