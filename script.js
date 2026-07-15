/* ============================================================
   HackIndia 2026 — Merged Site Script
   Combines:
     1) Landing-page Three.js ambient scenes (starfield/planet/
        drones, About-MITS particles, campus image parallax,
        tracks-section orbit globe)
     2) The Journey timeline (3D backdrop, scroll-synced energy
        road, checkpoint modal) — formerly time.js

   NOTE: a handful of blocks from the original script.js were
   removed during the merge because they referenced elements
   that don't exist in the merged page (an earlier "orbitStage"
   globe experiment, and an earlier non-namespaced timeline/road
   implementation using #track, #fullListInner, #overlay, and
   #panelTag). That functionality is fully superseded by the
   IIFE-scoped timeline logic at the bottom of this file (the
   former time.js), which targets the real element IDs used in
   index.html (#modal-overlay, #road-svg, #nodes-layer, etc).
   Leaving the old blocks in would have thrown runtime errors
   (calling addEventListener on null) and duplicated rendering
   on #bg-canvas.
   ============================================================ */

(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  /* ---------------- Starfield ---------------- */
  const STAR_COUNT = 900;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(STAR_COUNT * 3);
  const starColors = new Float32Array(STAR_COUNT * 3);

  const palette = [
    [0.78, 0.6, 1.0],   // lavender
    [0.55, 0.85, 1.0],  // cyan
    [0.85, 0.55, 1.0],  // magenta-violet
    [1.0, 1.0, 1.0],    // white
  ];

  for (let i = 0; i < STAR_COUNT; i++) {
    const radius = 60 + Math.random() * 140;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.5;
    starPositions[i * 3 + 2] = radius * Math.cos(phi) - 40;

    const c = palette[Math.floor(Math.random() * palette.length)];
    starColors[i * 3] = c[0];
    starColors[i * 3 + 1] = c[1];
    starColors[i * 3 + 2] = c[2];
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 0.9,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  /* ---------------- Glowing wireframe planet ---------------- */
  const planetGroup = new THREE.Group();
  planetGroup.position.set(14, 6, -30);
  scene.add(planetGroup);

  const planetCore = new THREE.Mesh(
    new THREE.SphereGeometry(6, 24, 24),
    new THREE.MeshBasicMaterial({
      color: 0x2a1a55,
      transparent: true,
      opacity: 0.35,
    })
  );
  planetGroup.add(planetCore);

  const planetWire = new THREE.Mesh(
    new THREE.SphereGeometry(6.15, 20, 20),
    new THREE.MeshBasicMaterial({
      color: 0x9a6bff,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    })
  );
  planetGroup.add(planetWire);

  const ringGeo = new THREE.RingGeometry(8.2, 9.4, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x4fd8ff,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2.4;
  planetGroup.add(ring);

  /* ---------------- Floating drone shards ---------------- */
  const drones = new THREE.Group();
  scene.add(drones);

  const droneMat = new THREE.MeshBasicMaterial({
    color: 0xc9a8ff,
    wireframe: true,
    transparent: true,
    opacity: 0.5,
  });

  const droneCount = 6;
  for (let i = 0; i < droneCount; i++) {
    const size = 0.6 + Math.random() * 1.1;
    const shard = new THREE.Mesh(
      new THREE.TetrahedronGeometry(size, 0),
      droneMat
    );
    shard.position.set(
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 24 + 4,
      -10 - Math.random() * 25
    );
    shard.userData.spin = (Math.random() - 0.5) * 0.01;
    shard.userData.floatSpeed = 0.3 + Math.random() * 0.5;
    shard.userData.floatOffset = Math.random() * Math.PI * 2;
    drones.add(shard);
  }

  /* ---------------- Mouse parallax ---------------- */
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  window.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener(
    'touchmove',
    (e) => {
      if (!e.touches || !e.touches.length) return;
      const t = e.touches[0];
      targetX = (t.clientX / window.innerWidth - 0.5) * 2;
      targetY = (t.clientY / window.innerHeight - 0.5) * 2;
    },
    { passive: true }
  );

  /* ---------------- Resize ---------------- */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ---------------- Animate ---------------- */
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    mouseX += (targetX - mouseX) * 0.04;
    mouseY += (targetY - mouseY) * 0.04;

    stars.rotation.y = t * 0.01;
    stars.rotation.x = mouseY * 0.05;

    planetGroup.rotation.y = t * 0.08;
    planetWire.rotation.y = -t * 0.05;
    planetGroup.position.x = 14 + mouseX * 1.5;
    planetGroup.position.y = 6 + mouseY * 1.0;

    drones.children.forEach((shard) => {
      shard.rotation.x += shard.userData.spin;
      shard.rotation.y += shard.userData.spin * 1.4;
      shard.position.y +=
        Math.sin(t * shard.userData.floatSpeed + shard.userData.floatOffset) * 0.003;
    });

    camera.position.x += (mouseX * 2 - camera.position.x) * 0.03;
    camera.position.y += (-mouseY * 1.2 - camera.position.y) * 0.03;
    camera.lookAt(0, 4, -20);

    renderer.render(scene, camera);
  }

  animate();
})();


/* ================= ABOUT MITS SCENE ================= */
const mitsCanvas = document.getElementById('mits-canvas');
const aboutSection = document.querySelector('.about-mits');

if (mitsCanvas && aboutSection && typeof THREE !== 'undefined') {
  const scene2 = new THREE.Scene();
  const camera2 = new THREE.PerspectiveCamera(50, aboutSection.clientWidth / aboutSection.clientHeight, 0.1, 1000);
  camera2.position.set(0, 0, 24);

  const renderer2 = new THREE.WebGLRenderer({ canvas: mitsCanvas, alpha: true, antialias: true });
  renderer2.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer2.setSize(aboutSection.clientWidth, aboutSection.clientHeight);
  renderer2.setClearColor(0x000000, 0);

  const COUNT = 260;
  const geo2 = new THREE.BufferGeometry();
  const positions2 = new Float32Array(COUNT * 3);
  const speeds2 = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    positions2[i * 3] = (Math.random() - 0.5) * 60;
    positions2[i * 3 + 1] = (Math.random() - 0.5) * 30;
    positions2[i * 3 + 2] = (Math.random() - 0.5) * 20;
    speeds2[i] = 0.15 + Math.random() * 0.35;
  }

  geo2.setAttribute('position', new THREE.BufferAttribute(positions2, 3));

  const mat2 = new THREE.PointsMaterial({
    size: 0.28,
    color: 0x9a6bff,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particles2 = new THREE.Points(geo2, mat2);
  scene2.add(particles2);

  const ringGroup2 = new THREE.Group();
  ringGroup2.position.set(12, 8, 0);
  scene2.add(ringGroup2);

  const scanRingGeo = new THREE.RingGeometry(5.6, 5.8, 64);
  const scanRingMat = new THREE.MeshBasicMaterial({ color: 0x4fd8ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
  const scanRing = new THREE.Mesh(scanRingGeo, scanRingMat);
  ringGroup2.add(scanRing);

  const sweepGeo = new THREE.RingGeometry(0.2, 5.6, 32, 1, 0, Math.PI / 8);
  const sweepMat = new THREE.MeshBasicMaterial({ color: 0x4fd8ff, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
  const sweep = new THREE.Mesh(sweepGeo, sweepMat);
  ringGroup2.add(sweep);

  function resizeMits() {
    const w = aboutSection.clientWidth;
    const h = aboutSection.clientHeight;
    camera2.aspect = w / h;
    camera2.updateProjectionMatrix();
    renderer2.setSize(w, h);
  }
  window.addEventListener('resize', resizeMits);

  const clock2 = new THREE.Clock();

  function animateMits() {
    requestAnimationFrame(animateMits);
    const t = clock2.getElapsedTime();
    const posAttr = geo2.attributes.position;

    for (let i = 0; i < COUNT; i++) {
      let y = posAttr.getY(i) + speeds2[i] * 0.02;
      if (y > 15) y = -15;
      posAttr.setY(i, y);
    }
    posAttr.needsUpdate = true;

    ringGroup2.rotation.z = t * 0.3;
    scanRing.material.opacity = 0.25 + Math.sin(t * 1.5) * 0.1;

    renderer2.render(scene2, camera2);
  }

  animateMits();
}

/* ================= 3D CAMPUS IMAGE PARALLAX ================= */
const campusImg = document.getElementById('campusImg3d');
const campusSection = document.getElementById('about');

if (campusImg && campusSection) {
  let imgTiltX = 0, imgTiltY = 0;
  let imgTargetX = 0, imgTargetY = 0;
  const IMG_MAX_TILT = 8;

  campusSection.addEventListener('mousemove', (e) => {
    const rect = campusSection.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    imgTargetY = ((e.clientX - cx) / (rect.width / 2)) * IMG_MAX_TILT;
    imgTargetX = -((e.clientY - cy) / (rect.height / 2)) * IMG_MAX_TILT;
  });

  campusSection.addEventListener('mouseleave', () => {
    imgTargetX = 0;
    imgTargetY = 0;
  });

  // Scroll-based vertical parallax shift
  let scrollShift = 0;
  window.addEventListener('scroll', () => {
    const rect = campusSection.getBoundingClientRect();
    const progress = 1 - (rect.bottom / (rect.height + window.innerHeight));
    scrollShift = progress * 40; // max 40px vertical shift
  }, { passive: true });

  function animateCampusImg() {
    requestAnimationFrame(animateCampusImg);
    imgTiltX += (imgTargetX - imgTiltX) * 0.06;
    imgTiltY += (imgTargetY - imgTiltY) * 0.06;

    campusImg.style.transform =
      `perspective(900px) rotateX(${imgTiltX}deg) rotateY(${imgTargetY * 0.4}deg) scale(1.07) translateY(${scrollShift}px)`;
  }
  animateCampusImg();
}

/* ================= MOBILE NAV TOGGLE (delegated to nav.js) ================= */

/* ================= TRACKS SECTION — ORBIT GLOBE ================= */
(function () {
  const canvas = document.getElementById('globe-canvas');
  if (!canvas || typeof THREE === 'undefined') return;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

  let targetEl = document.getElementById('globeTarget');
  let globeScreen = { x: 0, y: 0, r: 0 };

  function computeTargetGeometry() {
    const rect = targetEl.getBoundingClientRect();
    globeScreen.x = rect.left + rect.width / 2;
    globeScreen.y = rect.top + rect.height / 2;
    globeScreen.r = Math.min(rect.width, rect.height) * 0.42;
  }

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.position.z = 8;
    camera.updateProjectionMatrix();
    computeTargetGeometry();
  }
  window.addEventListener('resize', resize);

  // ---- Group holding the whole globe assembly ----
  const globeGroup = new THREE.Group();
  scene.add(globeGroup);

  // Core sphere - dotted / wire look
  const coreGeo = new THREE.SphereGeometry(2.15, 48, 48);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x2a2560,
    wireframe: true,
    transparent: true,
    opacity: 0.28
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  globeGroup.add(coreMesh);

  // Glow sphere (solid, subtle, gives the "planet" mass like image 1)
  const glowGeo = new THREE.SphereGeometry(2.08, 64, 64);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x0b0f2e,
    transparent: true,
    opacity: 0.55
  });
  globeGroup.add(new THREE.Mesh(glowGeo, glowMat));

  // Scattered "city light" points across the sphere surface (procedural continents)
  function fbm(x, y, z) {
    // cheap layered noise using sines, gives blotchy continent-like clusters
    return Math.sin(x * 2.1 + y * 1.3) * Math.cos(y * 1.7 - z * 2.4) * Math.sin(z * 1.9 + x * 0.7);
  }
  const ptCount = 5200;
  const ptPositions = new Float32Array(ptCount * 3);
  const ptColors = new Float32Array(ptCount * 3);
  let used = 0;
  const colorA = new THREE.Color(0xffb454); // gold city light
  const colorB = new THREE.Color(0x7c5cff); // violet accent
  for (let i = 0; i < ptCount * 4 && used < ptCount; i++) {
    const u = Math.random(), v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = 2.16;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    const n = fbm(x * 1.1, y * 1.1, z * 1.1);
    if (n > 0.18) {
      ptPositions[used * 3] = x;
      ptPositions[used * 3 + 1] = y;
      ptPositions[used * 3 + 2] = z;
      const c = Math.random() > 0.82 ? colorB : colorA;
      ptColors[used * 3] = c.r;
      ptColors[used * 3 + 1] = c.g;
      ptColors[used * 3 + 2] = c.b;
      used++;
    }
  }
  const ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPositions.slice(0, used * 3), 3));
  ptGeo.setAttribute('color', new THREE.BufferAttribute(ptColors.slice(0, used * 3), 3));
  const ptMat = new THREE.PointsMaterial({
    size: 0.028,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    sizeAttenuation: true
  });
  const cityPoints = new THREE.Points(ptGeo, ptMat);
  globeGroup.add(cityPoints);

  // Outer atmosphere rim
  const rimGeo = new THREE.SphereGeometry(2.28, 48, 48);
  const rimMat = new THREE.MeshBasicMaterial({
    color: 0x7c5cff,
    transparent: true,
    opacity: 0.06,
    side: THREE.BackSide
  });
  globeGroup.add(new THREE.Mesh(rimGeo, rimMat));

  // Orbit rings (tilted torus lines like image 1)
  function makeRing(radius, tube, color, opacity, tilt) {
    const geo = new THREE.TorusGeometry(radius, tube, 8, 128);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = tilt.x;
    mesh.rotation.y = tilt.y;
    return mesh;
  }
  const ring1 = makeRing(2.75, 0.004, 0x38e8ff, 0.35, { x: 1.35, y: 0.25 });
  const ring2 = makeRing(3.05, 0.003, 0x7c5cff, 0.22, { x: 1.15, y: -0.4 });
  globeGroup.add(ring1, ring2);

  // Small orbiting satellite nodes on ring1
  const satGroup = new THREE.Group();
  const satCount = 6;
  for (let i = 0; i < satCount; i++) {
    const satGeo = new THREE.SphereGeometry(0.035, 12, 12);
    const satMat = new THREE.MeshBasicMaterial({ color: 0x38e8ff });
    const sat = new THREE.Mesh(satGeo, satMat);
    sat.userData.offset = (i / satCount) * Math.PI * 2;
    satGroup.add(sat);
  }
  ring1.add(satGroup);

  camera.position.z = 8;

  // ---- Track link lines (SVG) from pills to globe rim points ----
  const svg = document.getElementById('linkSvg');
  const railLeft = document.getElementById('railLeft');
  const railRight = document.getElementById('railRight');

  let linkEls = null; // cache of {path, node, core} per pill, built once

  function ensureLinkEls() {
    if (linkEls) return;
    linkEls = [];
    function makeFor(rail, side) {
      const items = rail.querySelectorAll('.track-pill');
      items.forEach(el => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        node.setAttribute('class', 'node');
        node.setAttribute('r', 5);
        const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        core.setAttribute('class', 'node-core');
        core.setAttribute('r', 2);
        svg.appendChild(path);
        svg.appendChild(node);
        svg.appendChild(core);
        linkEls.push({ el, side, path, node, core });
      });
    }
    makeFor(railLeft, 'left');
    makeFor(railRight, 'right');
  }

  function buildLinks() {
    ensureLinkEls();
    const stageRect = document.querySelector('.orbit-wrap').getBoundingClientRect();
    svg.setAttribute('width', stageRect.width);
    svg.setAttribute('height', stageRect.height);
    svg.style.left = '0px';
    svg.style.top = '0px';

    computeTargetGeometry();
    const gx = globeScreen.x - stageRect.left;
    const gy = globeScreen.y - stageRect.top;
    const gr = globeScreen.r;

    const leftCount = railLeft.querySelectorAll('.track-pill').length;
    const rightCount = railRight.querySelectorAll('.track-pill').length;
    let li = 0, ri = 0;

    linkEls.forEach(item => {
      const { el, side, path, node, core } = item;
      const n = side === 'left' ? leftCount : rightCount;
      const i = side === 'left' ? li++ : ri++;

      const r = el.getBoundingClientRect();
      const startX = side === 'left' ? (r.right - stageRect.left) : (r.left - stageRect.left);
      const startY = (r.top + r.height / 2) - stageRect.top;

      const angleSpread = 0.9;
      const t = n > 1 ? (i / (n - 1)) - 0.5 : 0;
      const angle = side === 'left'
        ? Math.PI - (0.15 + t * angleSpread)
        : (0.15 + t * angleSpread);
      const endX = gx + Math.cos(angle) * gr;
      const endY = gy + Math.sin(angle) * gr * 0.92;

      const midX = (startX + endX) / 2;
      const d = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
      path.setAttribute('d', d);
      node.setAttribute('cx', endX);
      node.setAttribute('cy', endY);
      core.setAttribute('cx', endX);
      core.setAttribute('cy', endY);
    });
  }

  function projectGlobeToScreen() {
    // position an invisible 3D anchor so globe visually sits inside globeTarget box
    const rect = targetEl.getBoundingClientRect();
    const vFov = camera.fov * Math.PI / 180;
    const heightAtDist = 2 * Math.tan(vFov / 2) * camera.position.z;
    const worldPerPixel = heightAtDist / window.innerHeight;
    const cx = rect.left + rect.width / 2 - window.innerWidth / 2;
    const cy = rect.top + rect.height / 2 - window.innerHeight / 2;
    globeGroup.position.x = cx * worldPerPixel;
    globeGroup.position.y = -cy * worldPerPixel;
    const scale = Math.min(rect.width, rect.height) / 480;
    globeGroup.scale.setScalar(Math.max(scale, 0.55));
  }

  function initAll() {
    resize();
    projectGlobeToScreen();
    buildLinks();
  }

  window.addEventListener('resize', () => { initAll(); });
  window.addEventListener('scroll', () => { projectGlobeToScreen(); buildLinks(); }, { passive: true });

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // keep the earth locked to its track section as the page scrolls / layout shifts
    projectGlobeToScreen();
    buildLinks();

    globeGroup.rotation.y = t * 0.12;
    cityPoints.rotation.y = t * 0.12;
    coreMesh.rotation.y = t * 0.06;
    ring1.rotation.z = t * 0.18;
    ring2.rotation.z = -t * 0.12;

    satGroup.children.forEach((sat, i) => {
      const a = sat.userData.offset + t * 0.35;
      const r = 2.75;
      sat.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
    });

    renderer.render(scene, camera);
  }

  initAll();
  animate();

  // rebuild links after fonts/layout settle
  window.addEventListener('load', () => setTimeout(buildLinks, 200));
  setTimeout(initAll, 400);
})();


/* ============================================================
   HackIndia — The Journey (timeline)
   3D wormhole backdrop (Three.js) + scroll-driven energy road
   (hand-built SVG spline, GSAP ScrollTrigger) + checkpoint modal.
   Formerly time.js — kept as its own IIFE so its internal
   variable names (CHECKPOINTS, svg builders, etc.) never
   collide with the landing-page code above.
   ============================================================ */

(function () {
  'use strict';

  var MOTION = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- checkpoint data (drives road + modal) ---------------- */

  var CHECKPOINTS = [
    {
      title: 'Registration Opens',
      date: 'Aug 01',
      desc: 'The gates open. Create your team profile and lock in your spot for Season 05 — solo builders welcome, teams up to four.',
      schedule: 'Aug 01, 00:00 IST — Aug 09, 23:59 IST',
      resources: 'Team dashboard, rulebook PDF, Discord invite link.'
    },
    {
      title: 'Idea Submission',
      date: 'Aug 10',
      desc: 'Submit a one-page concept note. No code required yet — we want to know the problem you are chasing and why it matters.',
      schedule: 'Opens Aug 10, closes Aug 17, 23:59 IST',
      resources: 'Concept note template, track list, past winning ideas.'
    },
    {
      title: 'Team Formation & Mentorship',
      date: 'Aug 18',
      desc: 'Solo entrants get matched into teams. Every team is paired with an industry mentor for the rest of the season.',
      schedule: 'Matching runs Aug 18 – Aug 20',
      resources: 'Mentor directory, teammate-matching form.'
    },
    {
      title: 'Workshop Series I',
      date: 'Aug 25',
      desc: 'Three live sessions on system design, API scaffolding, and pitching. Recordings posted within 24 hours for every timezone.',
      schedule: 'Aug 25, 27, 29 — 7:00 PM IST',
      resources: 'Workshop recordings, starter repo, slide decks.'
    },
    {
      title: 'Round 1 Judging',
      date: 'Sep 05',
      desc: 'Push your first working prototype. Judges score on feasibility and problem clarity — this round filters the field to the top 40 teams.',
      schedule: 'Submissions close Sep 05, 23:59 IST',
      resources: 'Submission portal, judging rubric v2.'
    },
    {
      title: 'Workshop Series II',
      date: 'Sep 15',
      desc: 'Deep dives on deployment, demo storytelling, and handling judge Q&A — built for teams heading into the final stretch.',
      schedule: 'Sep 15, 17 — 7:00 PM IST',
      resources: 'Demo-day checklist, deployment guide.'
    },
    {
      title: 'Final Submission',
      date: 'Sep 25',
      desc: 'Full product, source code, and a three-minute demo video. This is the build the finalists will be judged on.',
      schedule: 'Submissions close Sep 25, 23:59 IST',
      resources: 'Final submission portal, video spec sheet.'
    },
    {
      title: 'Grand Finale',
      date: 'Oct 03',
      desc: 'Top 12 teams pitch live to the judging panel. Winners announced the same evening — Season 05 closes here.',
      schedule: 'Oct 03, 10:00 AM IST — doors, 6:00 PM IST — results',
      resources: 'Venue details, livestream link, pitch-deck template.'
    }
  ];

  document.addEventListener('DOMContentLoaded', function () {
    initHeroIntro();
    initBackdrop();
    var road = initRoad();
    initScrollSync(road);
    initProgressRail();
    initModal(road);
    initCTA();
    window.addEventListener('resize', debounce(function () {
      road.rebuild();
    }, 250));
  });

  /* ---------------- hero entrance ---------------- */

  function initHeroIntro() {
    if (!window.gsap) return;
    var tl = gsap.timeline({ delay: 0.2 });
    tl.to('.time-hero-eyebrow', { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0)
      .fromTo('.time-hero-title', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.15)
      .to('.time-hero-sub', { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0.5)
      .to('.scroll-cue', { opacity: MOTION ? 1 : 0.7, duration: 0.8 }, 0.8);
  }

  /* ---------------- 3D time-tunnel backdrop ---------------- */

  function initBackdrop() {
    var canvas = document.getElementById('time-bg');
    if (!canvas || !window.THREE) return;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 400);
    camera.position.z = 22;

    var DEPTH = 260;
    var COUNT = MOTION ? 2200 : 900;
    var positions = new Float32Array(COUNT * 3);
    var colors = new Float32Array(COUNT * 3);
    var speeds = new Float32Array(COUNT);

    var cGold = new THREE.Color(0xE8B85C);
    var cViolet = new THREE.Color(0x7B5CFF);
    var cCyan = new THREE.Color(0x4DDFE8);

    for (var i = 0; i < COUNT; i++) {
      var angle = Math.random() * Math.PI * 2;
      var radius = 3 + Math.random() * 15;
      var z = -Math.random() * DEPTH;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = z;
      speeds[i] = 0.4 + Math.random() * 0.9;

      var t = Math.random();
      var col = t < 0.5 ? cCyan.clone().lerp(cViolet, t * 2) : cViolet.clone().lerp(cGold, (t - 0.5) * 2);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    var material = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    var points = new THREE.Points(geometry, material);
    scene.add(points);

    /* a few slow chrono-gates for depth cues */
    var gates = [];
    for (var g = 0; g < 4; g++) {
      var gGeo = new THREE.TorusGeometry(9 + g * 2.4, 0.04, 8, 48);
      var gMat = new THREE.MeshBasicMaterial({ color: 0xE8B85C, transparent: true, opacity: 0.12 });
      var gate = new THREE.Mesh(gGeo, gMat);
      gate.position.z = -40 - g * 55;
      scene.add(gate);
      gates.push(gate);
    }

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);

    var clock = new THREE.Clock();

    function frame() {
      var dt = Math.min(clock.getDelta(), 0.05);
      var boost = 1 + (window.__scrollProgress || 0) * 1.6;

      var pos = geometry.attributes.position;
      for (var i = 0; i < COUNT; i++) {
        var idx = i * 3 + 2;
        pos.array[idx] += speeds[i] * dt * 14 * boost;
        if (pos.array[idx] > camera.position.z + 4) {
          pos.array[idx] -= DEPTH + 4;
        }
      }
      pos.needsUpdate = true;

      scene.rotation.z += dt * 0.02;
      gates.forEach(function (gate, gi) {
        gate.rotation.z += dt * 0.05 * (gi % 2 === 0 ? 1 : -1);
      });

      renderer.render(scene, camera);
      if (MOTION) requestAnimationFrame(frame);
    }

    if (MOTION) {
      requestAnimationFrame(frame);
    } else {
      frame(); // single static render, respects reduced motion
    }
  }

  /* ---------------- energy road (SVG) ---------------- */

  function initRoad() {
    var wrap = document.getElementById('timeline-wrap');
    var svg = document.getElementById('road-svg');
    var nodesLayer = document.getElementById('nodes-layer');
    var traveler = document.getElementById('traveler');
    var NS = 'http://www.w3.org/2000/svg';

    var state = { pathEl: null, totalLen: 0, nodeFractions: [], height: 0, width: 0 };

    function build() {
      var W = wrap.clientWidth || window.innerWidth;
      var segH = Math.max(window.innerHeight * 0.9, 620);
      var topPad = segH * 0.45;
      var n = CHECKPOINTS.length;
      var totalHeight = topPad * 2 + (n - 1) * segH;
      var centerX = W / 2;
      var amplitude = Math.min(W * 0.26, 260);

      wrap.style.height = totalHeight + 'px';
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + totalHeight);
      svg.setAttribute('width', W);
      svg.setAttribute('height', totalHeight);

      var core = [];
      for (var i = 0; i < n; i++) {
        core.push({
          x: centerX + (i % 2 === 0 ? -amplitude : amplitude),
          y: topPad + i * segH
        });
      }
      var splinePts = [{ x: centerX, y: 0 }].concat(core, [{ x: centerX, y: totalHeight }]);
      var d = buildSmoothPath(splinePts);

      svg.innerHTML = '';
      var defs = document.createElementNS(NS, 'defs');
      defs.innerHTML =
        '<linearGradient id="roadGrad" gradientUnits="userSpaceOnUse" x1="' + centerX + '" y1="0" x2="' + centerX + '" y2="' + totalHeight + '">' +
        '<stop offset="0%" stop-color="#4DDFE8"/>' +
        '<stop offset="55%" stop-color="#7B5CFF"/>' +
        '<stop offset="100%" stop-color="#E8B85C"/>' +
        '</linearGradient>' +
        '<filter id="roadBlur" x="-50%" y="-50%" width="200%" height="200%">' +
        '<feGaussianBlur stdDeviation="10"/>' +
        '</filter>';
      svg.appendChild(defs);

      var glowPath = document.createElementNS(NS, 'path');
      glowPath.setAttribute('d', d);
      glowPath.setAttribute('fill', 'none');
      glowPath.setAttribute('stroke', 'url(#roadGrad)');
      glowPath.setAttribute('stroke-width', '24');
      glowPath.setAttribute('stroke-linecap', 'round');
      glowPath.setAttribute('opacity', '0.18');
      glowPath.setAttribute('filter', 'url(#roadBlur)');
      svg.appendChild(glowPath);

      var basePath = document.createElementNS(NS, 'path');
      basePath.setAttribute('d', d);
      basePath.setAttribute('fill', 'none');
      basePath.setAttribute('stroke', 'url(#roadGrad)');
      basePath.setAttribute('stroke-width', '2.5');
      basePath.setAttribute('stroke-linecap', 'round');
      basePath.setAttribute('opacity', '0.35');
      svg.appendChild(basePath);

      var progressPath = document.createElementNS(NS, 'path');
      progressPath.setAttribute('d', d);
      progressPath.setAttribute('fill', 'none');
      progressPath.setAttribute('stroke', 'url(#roadGrad)');
      progressPath.setAttribute('stroke-width', '3.5');
      progressPath.setAttribute('stroke-linecap', 'round');
      svg.appendChild(progressPath);

      var totalLen = progressPath.getTotalLength();
      progressPath.setAttribute('stroke-dasharray', totalLen);
      progressPath.setAttribute('stroke-dashoffset', totalLen);

      state.pathEl = progressPath;
      state.totalLen = totalLen;
      state.width = W;
      state.height = totalHeight;
      state.nodeFractions = core.map(function (p) { return p.y / totalHeight; });

      nodesLayer.innerHTML = '';
      nodesLayer.style.height = totalHeight + 'px';

      core.forEach(function (p, i) {
        var side = i % 2 === 0 ? 'right' : 'left'; // node sits opposite the road's swing
        var anchor = document.createElement('div');
        anchor.className = 'node-anchor';
        anchor.style.left = p.x + 'px';
        anchor.style.top = p.y + 'px';
        anchor.dataset.index = i;
        nodesLayer.appendChild(anchor);

        var card = document.createElement('div');
        card.className = 'checkpoint-node side-' + side;
        card.dataset.index = i;
        card.style.top = p.y + 'px';
        if (side === 'right') {
          card.style.left = (p.x + 44) + 'px';
        } else {
          card.style.left = (p.x - 44 - Math.min(340, W * 0.42)) + 'px';
        }
        card.innerHTML =
          '<div class="node-index">CHECKPOINT ' + String(i + 1).padStart(2, '0') + '</div>' +
          '<div class="node-title">' + CHECKPOINTS[i].title + '</div>' +
          '<div class="node-date">' + CHECKPOINTS[i].date + '</div>';
        nodesLayer.appendChild(card);
      });
    }

    build();
    return {
      state: state,
      rebuild: build
    };
  }

  function buildSmoothPath(points) {
    if (points.length < 2) return '';
    var p = [points[0]].concat(points, [points[points.length - 1]]);
    var d = 'M ' + points[0].x + ' ' + points[0].y;
    for (var i = 0; i < points.length - 1; i++) {
      var p0 = p[i], p1 = p[i + 1], p2 = p[i + 2], p3 = p[i + 3];
      var cp1x = p1.x + (p2.x - p0.x) / 6;
      var cp1y = p1.y + (p2.y - p0.y) / 6;
      var cp2x = p2.x - (p3.x - p1.x) / 6;
      var cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ' C ' + cp1x + ' ' + cp1y + ', ' + cp2x + ' ' + cp2y + ', ' + p2.x + ' ' + p2.y;
    }
    return d;
  }

  /* ---------------- scroll sync: traveler + node reveal ---------------- */

  function initScrollSync(road) {
    var traveler = document.getElementById('traveler');
    var nodesLayer = document.getElementById('nodes-layer');

    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.create({
      trigger: '#timeline-wrap',
      start: 'top top',
      end: 'bottom bottom',
      scrub: MOTION ? 0.5 : true,
      onUpdate: function (self) {
        var progress = self.progress;
        var st = road.state;
        if (!st.pathEl) return;

        var pt = st.pathEl.getPointAtLength(progress * st.totalLen);
        traveler.style.left = pt.x + 'px';
        traveler.style.top = pt.y + 'px';
        st.pathEl.setAttribute('stroke-dashoffset', st.totalLen * (1 - progress));

        st.nodeFractions.forEach(function (f, i) {
          var reached = progress >= f - 0.015;
          var anchor = nodesLayer.querySelector('.node-anchor[data-index="' + i + '"]');
          var card = nodesLayer.querySelector('.checkpoint-node[data-index="' + i + '"]');
          if (anchor) anchor.classList.toggle('reached', reached);
          if (card) card.classList.toggle('reached', reached);
        });
      }
    });

    ScrollTrigger.refresh();
  }

  /* ---------------- overall progress rail ---------------- */

  function initProgressRail() {
    var fill = document.getElementById('progress-fill');
    if (!fill) return;
    function update() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 0;
      fill.style.height = (pct * 100) + '%';
      window.__scrollProgress = pct;
    }
    window.addEventListener('scroll', throttle(update, 16), { passive: true });
    update();
  }

  /* ---------------- modal ---------------- */

  function initModal(road) {
    var overlay = document.getElementById('modal-overlay');
    var closeBtn = document.getElementById('modal-close');
    var cancelBtn = document.getElementById('modal-cancel');
    var nodesLayer = document.getElementById('nodes-layer');

    function open(index) {
      var data = CHECKPOINTS[index];
      if (!data) return;
      document.getElementById('modal-num').textContent = String(index + 1).padStart(2, '0');
      document.getElementById('modal-title').textContent = data.title;
      document.getElementById('modal-date').textContent = data.date;
      document.getElementById('modal-desc').textContent = data.desc;
      document.getElementById('modal-schedule').textContent = data.schedule;
      document.getElementById('modal-resources').textContent = data.resources;
      overlay.classList.add('active');
    }

    function close() {
      overlay.classList.remove('active');
    }

    nodesLayer.addEventListener('click', function (e) {
      var target = e.target.closest('.checkpoint-node, .node-anchor');
      if (!target) return;
      open(parseInt(target.dataset.index, 10));
    });

    closeBtn.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* ---------------- CTA ---------------- */

  function initCTA() {
    var btn = document.getElementById('cta-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var target = document.getElementById('timeline-wrap');
      if (target) target.scrollIntoView({ behavior: MOTION ? 'smooth' : 'auto', block: 'start' });
    });
  }

  /* ---------------- utils ---------------- */

  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      var args = arguments;
      t = setTimeout(function () { fn.apply(null, args); }, wait);
    };
  }

  function throttle(fn, wait) {
    var last = 0, pending = null;
    return function () {
      var now = Date.now();
      var args = arguments;
      if (now - last >= wait) {
        last = now;
        fn.apply(null, args);
      } else {
        clearTimeout(pending);
        pending = setTimeout(function () { last = Date.now(); fn.apply(null, args); }, wait - (now - last));
      }
    };
  }
})();