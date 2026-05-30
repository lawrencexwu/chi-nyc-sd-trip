// Constellation route — a faint "ink-on-paper" flight map behind the hero
// title. Warm drifting motes, four city nodes (Chicago · New York · San Diego
// · Los Angeles) joined by a thin breathing line, with a small marker that
// glides along the route and back.
//
// Design intent: quiet and editorial, not neon. Colours come straight from the
// site palette and everything is rendered with normal blending so the specks
// read as warm ink on parchment rather than glowing dots.
//
// It is a progressive enhancement: if WebGL is unavailable, the module fails to
// load, or the visitor prefers reduced motion, the existing hero stands on its
// own (a single static frame is drawn in the reduced-motion case).

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

(function () {
  const canvas = document.getElementById('heroCanvas');
  const hero = document.querySelector('.hero');
  if (!canvas || !hero) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (e) {
    return; // No WebGL context — leave the static hero untouched.
  }
  renderer.setClearAlpha(0);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  camera.position.z = 1;

  const field = new THREE.Group();
  scene.add(field);

  // ---- palette (mirrors the CSS custom properties) ----
  const COLORS = {
    inkMute: new THREE.Color('#8a7a64'),
    rule:    new THREE.Color('#b8a888'),
    ochre:   new THREE.Color('#a98545'),
    clay:    new THREE.Color('#b35a3a'),
    clayDeep:new THREE.Color('#8c4329'),
  };
  const moteColors = [COLORS.inkMute, COLORS.rule, COLORS.ochre, COLORS.clay];

  // ---- soft round point shader (per-point size / alpha / colour) ----
  const VERT = `
    attribute float aSize;
    attribute float aAlpha;
    attribute vec3 aColor;
    uniform float uScale;
    varying float vAlpha;
    varying vec3 vColor;
    void main() {
      vAlpha = aAlpha;
      vColor = aColor;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * uScale;
    }
  `;
  const FRAG = `
    precision mediump float;
    uniform float uOpacity;
    varying float vAlpha;
    varying vec3 vColor;
    void main() {
      float d = distance(gl_PointCoord, vec2(0.5));
      float a = smoothstep(0.5, 0.12, d) * vAlpha * uOpacity;
      if (a < 0.01) discard;
      gl_FragColor = vec4(vColor, a);
    }
  `;
  function pointsMaterial(opacity) {
    return new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 1 }, uOpacity: { value: opacity } },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
  }

  let aspect = 1;

  // ---- motes ----
  const small = window.innerWidth < 600 || Math.min(window.innerWidth, window.innerHeight) < 560;
  const MOTES = small ? 90 : 170;
  const mPos = new Float32Array(MOTES * 3);
  const mSize = new Float32Array(MOTES);
  const mAlpha = new Float32Array(MOTES);
  const mColor = new Float32Array(MOTES * 3);
  const mVel = new Float32Array(MOTES * 2);
  const rand = (a, b) => a + Math.random() * (b - a);
  for (let i = 0; i < MOTES; i++) {
    mPos[i * 3] = rand(-1.6, 1.6);
    mPos[i * 3 + 1] = rand(-1, 1);
    mPos[i * 3 + 2] = 0;
    mSize[i] = rand(1.8, 5.0);
    mAlpha[i] = rand(0.16, 0.46);
    const c = moteColors[(Math.random() * moteColors.length) | 0];
    mColor[i * 3] = c.r; mColor[i * 3 + 1] = c.g; mColor[i * 3 + 2] = c.b;
    mVel[i * 2] = rand(-0.018, 0.018);
    mVel[i * 2 + 1] = rand(-0.014, 0.014);
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  moteGeo.setAttribute('aSize', new THREE.BufferAttribute(mSize, 1));
  moteGeo.setAttribute('aAlpha', new THREE.BufferAttribute(mAlpha, 1));
  moteGeo.setAttribute('aColor', new THREE.BufferAttribute(mColor, 3));
  const moteMat = pointsMaterial(1.0);
  field.add(new THREE.Points(moteGeo, moteMat));

  // ---- city nodes + route line ----
  const NODES = 4;
  const nodeFracX = [-0.74, -0.26, 0.26, 0.74]; // spread across the width
  const nodeY = [0.40, 0.20, 0.32, 0.12];       // a gentle wave, up in the hero band
  const nPos = new Float32Array(NODES * 3);
  const nSize = new Float32Array(NODES);
  const nAlpha = new Float32Array(NODES);
  const nColor = new Float32Array(NODES * 3);
  for (let i = 0; i < NODES; i++) {
    nSize[i] = 7.5;
    nAlpha[i] = 0.92;
    const c = i % 2 === 0 ? COLORS.clay : COLORS.clayDeep;
    nColor[i * 3] = c.r; nColor[i * 3 + 1] = c.g; nColor[i * 3 + 2] = c.b;
  }
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(nPos, 3));
  nodeGeo.setAttribute('aSize', new THREE.BufferAttribute(nSize, 1));
  nodeGeo.setAttribute('aAlpha', new THREE.BufferAttribute(nAlpha, 1));
  nodeGeo.setAttribute('aColor', new THREE.BufferAttribute(nColor, 3));
  const nodeMat = pointsMaterial(0.85);
  field.add(new THREE.Points(nodeGeo, nodeMat));

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NODES * 3), 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: COLORS.inkMute, transparent: true, opacity: 0.40,
  });
  field.add(new THREE.Line(lineGeo, lineMat));

  // ---- traveller (a soft halo + a brighter core that glides the route) ----
  const tPos = new Float32Array(2 * 3);
  const tSize = new Float32Array([16.0, 6.5]);
  const tAlpha = new Float32Array([0.22, 0.95]);
  const tColor = new Float32Array(2 * 3);
  for (let i = 0; i < 2; i++) {
    tColor[i * 3] = COLORS.clay.r; tColor[i * 3 + 1] = COLORS.clay.g; tColor[i * 3 + 2] = COLORS.clay.b;
  }
  const travGeo = new THREE.BufferGeometry();
  travGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
  travGeo.setAttribute('aSize', new THREE.BufferAttribute(tSize, 1));
  travGeo.setAttribute('aAlpha', new THREE.BufferAttribute(tAlpha, 1));
  travGeo.setAttribute('aColor', new THREE.BufferAttribute(tColor, 3));
  const travMat = pointsMaterial(1.0);
  field.add(new THREE.Points(travGeo, travMat));

  // Recompute node/line geometry whenever the aspect changes.
  let segLen = [], routeLen = 0;
  function layoutNodes() {
    const lp = lineGeo.attributes.position.array;
    for (let i = 0; i < NODES; i++) {
      const x = nodeFracX[i] * aspect;
      const y = nodeY[i];
      nPos[i * 3] = x; nPos[i * 3 + 1] = y; nPos[i * 3 + 2] = 0;
      lp[i * 3] = x; lp[i * 3 + 1] = y; lp[i * 3 + 2] = 0;
    }
    nodeGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.position.needsUpdate = true;
    segLen = []; routeLen = 0;
    for (let i = 0; i < NODES - 1; i++) {
      const dx = nPos[(i + 1) * 3] - nPos[i * 3];
      const dy = nPos[(i + 1) * 3 + 1] - nPos[i * 3 + 1];
      const L = Math.hypot(dx, dy);
      segLen.push(L); routeLen += L;
    }
  }

  function setTraveller(u) {
    // u in [0,1] along the polyline; place halo + core at that point.
    let d = u * routeLen, seg = 0;
    while (seg < segLen.length - 1 && d > segLen[seg]) { d -= segLen[seg]; seg++; }
    const f = segLen[seg] > 0 ? d / segLen[seg] : 0;
    const ax = nPos[seg * 3], ay = nPos[seg * 3 + 1];
    const bx = nPos[(seg + 1) * 3], by = nPos[(seg + 1) * 3 + 1];
    const x = ax + (bx - ax) * f, y = ay + (by - ay) * f;
    tPos[0] = x; tPos[1] = y; tPos[3] = x; tPos[4] = y;
    travGeo.attributes.position.needsUpdate = true;
  }

  // ---- sizing (the canvas is a fixed, viewport-sized layer) ----
  let heroH = 1;
  function resize() {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    aspect = w / h;
    camera.left = -aspect; camera.right = aspect;
    camera.top = 1; camera.bottom = -1;
    camera.updateProjectionMatrix();
    moteMat.uniforms.uScale.value = dpr;
    nodeMat.uniforms.uScale.value = dpr;
    travMat.uniforms.uScale.value = dpr;
    heroH = Math.max(1, hero.clientHeight);
    layoutNodes();
    if (!running) renderStatic();
  }

  // ---- scroll fade: route lives in the hero and fades out; motes ease to a
  //      faint ambient level so they whisper on behind the rest of the page ----
  let routeFade = 1, moteFade = 1;
  function smooth(a, b, x) {
    const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
    return t * t * (3 - 2 * t);
  }
  function applyFade() {
    const hp = Math.min((window.scrollY || window.pageYOffset || 0) / (heroH * 0.85), 1);
    routeFade = 1 - smooth(0, 0.5, hp);   // route gone by ~half a screen down
    moteFade = 1 - 0.62 * smooth(0, 1, hp); // motes ease to ~0.38 over content
  }

  // ---- parallax (desktop pointer only; touch keeps the autonomous drift) ----
  let targetX = 0, targetY = 0;
  if (finePointer) {
    window.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      targetX = nx * 0.05;
      targetY = -ny * 0.04;
    }, { passive: true });
  }

  // ---- animation ----
  let tAccum = 0;
  const clock = new THREE.Clock();
  let running = false, rafId = 0;
  const TRAVEL_PERIOD = 22; // seconds for a full there-and-back glide

  function renderOnce() { renderer.render(scene, camera); }

  // Static (paused / reduced-motion) draw — fade-aware, no breathing or drift.
  function renderStatic() {
    applyFade();
    nodeMat.uniforms.uOpacity.value = 0.85 * routeFade;
    lineMat.opacity = 0.40 * routeFade;
    travMat.uniforms.uOpacity.value = routeFade;
    moteMat.uniforms.uOpacity.value = moteFade;
    renderer.render(scene, camera);
  }

  function frame() {
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    tAccum += dt;

    // drift the motes, wrapping at the edges
    for (let i = 0; i < MOTES; i++) {
      let x = mPos[i * 3] + mVel[i * 2] * dt;
      let y = mPos[i * 3 + 1] + mVel[i * 2 + 1] * dt;
      const ax = aspect + 0.05;
      if (x > ax) x = -ax; else if (x < -ax) x = ax;
      if (y > 1.05) y = -1.05; else if (y < -1.05) y = 1.05;
      mPos[i * 3] = x; mPos[i * 3 + 1] = y;
    }
    moteGeo.attributes.position.needsUpdate = true;

    // scroll fade: route anchored to the hero, motes faint over the rest
    applyFade();

    // breathe the route, glide the traveller
    nodeMat.uniforms.uOpacity.value = (0.80 + 0.14 * Math.sin(tAccum * 0.9)) * routeFade;
    lineMat.opacity = (0.34 + 0.10 * Math.sin(tAccum * 0.9 + 0.4)) * routeFade;
    travMat.uniforms.uOpacity.value = routeFade;
    moteMat.uniforms.uOpacity.value = moteFade;
    const tri = 1 - Math.abs(((tAccum / TRAVEL_PERIOD) % 2) - 1); // 0→1→0
    setTraveller(tri);

    // ease parallax
    field.position.x += (targetX - field.position.x) * 0.05;
    field.position.y += (targetY - field.position.y) * 0.05;

    renderer.render(scene, camera);
  }

  function start() {
    if (running) return;
    running = true;
    clock.getDelta(); // discard the gap accumulated while paused
    frame();
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  // ---- lifecycle: animate whenever the tab is visible (the layer now spans the
  //      whole page), pausing only when the tab is hidden to spare the battery ----
  function sync() {
    if (reduceMotion) return;
    if (!document.hidden) start(); else stop();
  }

  resize();
  setTraveller(0);
  renderStatic();
  canvas.classList.add('is-ready');

  if (reduceMotion) {
    // No animation; the scroll handler keeps the fade in step as you read.
    let queued = false;
    window.addEventListener('scroll', () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; renderStatic(); });
    }, { passive: true });
  } else {
    document.addEventListener('visibilitychange', sync);
    sync();
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('orientationchange', resize, { passive: true });
})();
