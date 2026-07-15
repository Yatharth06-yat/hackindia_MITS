gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/* =========================================================
   THREE.JS SPACE SCENE — stars, earth, satellites, shooting stars
   ========================================================= */
const canvas = document.getElementById('footer-canvas');
const footerEl = document.getElementById('cosmic-footer');

let renderer, scene, camera, earth, cloudsMesh, satelliteGroup, starField, nebulaSprite;
let W = footerEl.clientWidth, H = footerEl.clientHeight;

function initScene() {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
  camera.position.set(0, 0, 34);

  // ---- lighting ----
  const sun = new THREE.DirectionalLight(0xbcd9ff, 1.6);
  sun.position.set(-8, 4, 10);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x223355, 0.9));

  // ---- starfield (parallax via 2 layers) ----
  function makeStars(count, size, radius, color) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = radius * (0.4 + Math.random() * 0.6);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi) - 40;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.85, sizeAttenuation: true });
    return new THREE.Points(geo, mat);
  }
  starField = makeStars(900, 0.28, 140, 0xffffff);
  const starField2 = makeStars(400, 0.15, 200, 0x9db4ff);
  scene.add(starField, starField2);

  // ---- nebula / galaxy dust (soft sprite) ----
  const nebCanvas = document.createElement('canvas');
  nebCanvas.width = 512; nebCanvas.height = 512;
  const nctx = nebCanvas.getContext('2d');
  const grad = nctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  grad.addColorStop(0, 'rgba(155,107,255,0.35)');
  grad.addColorStop(0.5, 'rgba(67,140,255,0.15)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  nctx.fillStyle = grad;
  nctx.fillRect(0, 0, 512, 512);
  const nebTex = new THREE.CanvasTexture(nebCanvas);
  const nebMat = new THREE.SpriteMaterial({ map: nebTex, transparent: true, depthWrite: false });
  nebulaSprite = new THREE.Sprite(nebMat);
  nebulaSprite.scale.set(90, 90, 1);
  nebulaSprite.position.set(-25, 10, -60);
  scene.add(nebulaSprite);

  const nebMat2 = nebMat.clone();
  const nebulaSprite2 = new THREE.Sprite(nebMat2);
  nebulaSprite2.scale.set(70, 70, 1);
  nebulaSprite2.position.set(30, -15, -70);
  scene.add(nebulaSprite2);

  // ---- procedural earth texture ----
  function makeEarthTexture() {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 512;
    const ctx = c.getContext('2d');
    // ocean base
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
    oceanGrad.addColorStop(0, '#0a2b5c');
    oceanGrad.addColorStop(1, '#08376f');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 1024, 512);
    // continents (blobby shapes)
    ctx.fillStyle = '#1c6b45';
    function blob(x, y, w, h) {
      ctx.beginPath();
      ctx.ellipse(x, y, w, h, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 26; i++) {
      blob(Math.random() * 1024, Math.random() * 512, 40 + Math.random() * 90, 25 + Math.random() * 55);
    }
    ctx.fillStyle = '#2c8a58';
    for (let i = 0; i < 18; i++) {
      blob(Math.random() * 1024, Math.random() * 512, 20 + Math.random() * 40, 15 + Math.random() * 25);
    }
    // ice caps
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(0, 0, 1024, 26);
    ctx.fillRect(0, 486, 1024, 26);
    // city lights speckles (subtle, only near "land")
    ctx.fillStyle = 'rgba(255,220,140,0.7)';
    for (let i = 0; i < 260; i++) {
      ctx.fillRect(Math.random() * 1024, Math.random() * 512, 1.4, 1.4);
    }
    return new THREE.CanvasTexture(c);
  }

  function makeCloudTexture() {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 512;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 1024, 512);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * 1024, y = Math.random() * 512;
      const r = 20 + Math.random() * 45;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    return new THREE.CanvasTexture(c);
  }

  const earthGeo = new THREE.SphereGeometry(11, 64, 64);
  const earthMat = new THREE.MeshStandardMaterial({
    map: makeEarthTexture(),
    roughness: 0.85,
    metalness: 0.05
  });
  earth = new THREE.Mesh(earthGeo, earthMat);
  earth.position.set(16, -4, -20);
  scene.add(earth);

  // clouds layer
  const cloudGeo = new THREE.SphereGeometry(11.25, 64, 64);
  const cloudMat = new THREE.MeshStandardMaterial({
    map: makeCloudTexture(),
    transparent: true,
    opacity: 0.55,
    depthWrite: false
  });
  cloudsMesh = new THREE.Mesh(cloudGeo, cloudMat);
  cloudsMesh.position.copy(earth.position);
  scene.add(cloudsMesh);

  // atmosphere glow (sprite behind edge)
  const atmoCanvas = document.createElement('canvas');
  atmoCanvas.width = 256; atmoCanvas.height = 256;
  const actx = atmoCanvas.getContext('2d');
  const agrad = actx.createRadialGradient(128, 128, 90, 128, 128, 128);
  agrad.addColorStop(0, 'rgba(80,180,255,0.0)');
  agrad.addColorStop(0.75, 'rgba(80,180,255,0.35)');
  agrad.addColorStop(1, 'rgba(80,180,255,0)');
  actx.fillStyle = agrad;
  actx.fillRect(0, 0, 256, 256);
  const atmoTex = new THREE.CanvasTexture(atmoCanvas);
  const atmoSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: atmoTex, transparent: true, depthWrite: false }));
  atmoSprite.scale.set(30, 30, 1);
  atmoSprite.position.copy(earth.position);
  scene.add(atmoSprite);

  // ---- satellites orbiting earth ----
  satelliteGroup = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const satGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const satMat = new THREE.MeshStandardMaterial({ color: 0xdfe6ff, emissive: 0x2255aa, emissiveIntensity: 0.6 });
    const sat = new THREE.Mesh(satGeo, satMat);
    const panelGeo = new THREE.BoxGeometry(1.4, 0.08, 0.5);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x2266cc, emissive: 0x1144aa, emissiveIntensity: 0.4 });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    sat.add(panel);
    sat.userData = {
      radius: 15 + i * 2.4,
      speed: 0.15 + i * 0.07,
      angle: Math.random() * Math.PI * 2,
      tilt: (Math.random() - 0.5) * 0.6
    };
    satelliteGroup.add(sat);
  }
  satelliteGroup.position.copy(earth.position);
  scene.add(satelliteGroup);

  // ---- lens flare (simple glow sprite near sun direction) ----
  const flareCanvas = document.createElement('canvas');
  flareCanvas.width = 256; flareCanvas.height = 256;
  const fctx = flareCanvas.getContext('2d');
  const fgrad = fctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  fgrad.addColorStop(0, 'rgba(255,255,255,0.9)');
  fgrad.addColorStop(0.3, 'rgba(180,220,255,0.4)');
  fgrad.addColorStop(1, 'rgba(180,220,255,0)');
  fctx.fillStyle = fgrad;
  fctx.fillRect(0, 0, 256, 256);
  const flareTex = new THREE.CanvasTexture(flareCanvas);
  const flare = new THREE.Sprite(new THREE.SpriteMaterial({ map: flareTex, transparent: true, depthWrite: false }));
  flare.scale.set(8, 8, 1);
  flare.position.set(4, 8, -18);
  scene.add(flare);

  animate();
}

/* shooting stars */
function spawnShootingStar() {
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(-6, -2.5, 0)
  ]);
  const mat = new THREE.LineBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 1 });
  const line = new THREE.Line(geo, mat);
  const startX = (Math.random() * 60) - 10;
  const startY = 20 + Math.random() * 10;
  line.position.set(startX, startY, -30 - Math.random() * 20);
  scene.add(line);

  gsap.to(line.position, {
    x: startX - 34, y: startY - 16,
    duration: 1.1 + Math.random() * 0.6,
    ease: 'power1.in',
    onComplete: () => scene.remove(line)
  });
  gsap.to(mat, { opacity: 0, duration: 1.1, delay: 0.3, ease: 'power1.in' });
}
setInterval(() => { if (Math.random() > 0.4) spawnShootingStar(); }, 2600);

let clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  if (earth) earth.rotation.y = t * 0.05;
  if (cloudsMesh) cloudsMesh.rotation.y = t * 0.07;

  if (satelliteGroup) {
    satelliteGroup.children.forEach((sat) => {
      const d = sat.userData;
      d.angle += 0.0026 * (d.speed * 4);
      sat.position.x = Math.cos(d.angle) * d.radius;
      sat.position.z = Math.sin(d.angle) * d.radius * 0.4;
      sat.position.y = Math.sin(d.angle * 0.7) * d.tilt * 4;
      sat.rotation.y += 0.01;
    });
  }

  starField.rotation.y = t * 0.005;

  renderer.render(scene, camera);
}

function onResize() {
  W = footerEl.clientWidth; H = footerEl.clientHeight;
  if (!renderer) return;
  renderer.setSize(W, H);
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);

if (window.WebGLRenderingContext) { initScene(); }

/* =========================================================
   MAGNETIC HOVER + RIPPLE FOR SOCIAL BUTTONS
   ========================================================= */
document.querySelectorAll('[data-magnetic]').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    gsap.to(btn, { x: x * 0.35, y: y * 0.35, duration: 0.4, ease: 'power2.out' });
  });
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' });
  });
  btn.addEventListener('click', (e) => {
    const r = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(r.width, r.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - r.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - r.top - size / 2) + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });
});

/* =========================================================
   NEWSLETTER FORM
   ========================================================= */
const form = document.getElementById('subscribeForm');
const subBtn = document.getElementById('subscribeBtn');
const hint = document.getElementById('formHint');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (subBtn.classList.contains('loading')) return;
  subBtn.classList.add('loading');
  hint.textContent = 'Transmitting...';

  setTimeout(() => {
    subBtn.classList.remove('loading');
    subBtn.classList.add('success');
    hint.textContent = "You're on the manifest. Welcome aboard.";
    document.getElementById('emailInput').value = '';
    setTimeout(() => {
      subBtn.classList.remove('success');
    }, 2400);
  }, 1400);
});

/* =========================================================
   ROCKET BACK-TO-TOP
   ========================================================= */
const rocketBtn = document.getElementById('rocketBtn');
rocketBtn.addEventListener('click', () => {
  rocketBtn.classList.add('launching');
  gsap.to(window, {
    scrollTo: { y: 0 },
    duration: 1.1,
    ease: 'power3.inOut'
  });
  setTimeout(() => rocketBtn.classList.remove('launching'), 950);
});


/* =========================================================
   GSAP SCROLLTRIGGER — CINEMATIC FOOTER REVEAL
   ========================================================= */
gsap.utils.toArray('.reveal-up').forEach((el, i) => {
  gsap.to(el, {
    opacity: 1, y: 0,
    duration: 1,
    ease: 'power3.out',
    delay: i * 0.08,
    scrollTrigger: {
      trigger: '#cosmic-footer',
      start: 'top 75%',
    }
  });
});

gsap.to(canvas, {
  scrollTrigger: {
    trigger: '#cosmic-footer',
    start: 'top bottom',
    end: 'top 30%',
    scrub: 1
  },
  opacity: 1,
  ease: 'none'
});
gsap.fromTo(canvas, { opacity: 0.4 }, {
  opacity: 1,
  scrollTrigger: { trigger: '#cosmic-footer', start: 'top bottom', end: 'top 40%', scrub: 1 }
});

/* =========================================================
   ASTRONAUT FLIGHT PATH + FOOTER LANDING SEQUENCE
   ========================================================= */
const astro = document.getElementById('astronaut');
const astroMsg = document.getElementById('astroMessage');

// idle ambient float + slow rotation while "in orbit" above footer
gsap.to(astro, {
  y: '+=18',
  rotation: 4,
  duration: 3.2,
  ease: 'sine.inOut',
  yoyo: true,
  repeat: -1
});

// Curved patrol path across the footer before landing, triggered on scroll
const patrolTl = gsap.timeline({
  scrollTrigger: {
    trigger: '#cosmic-footer',
    start: 'top 85%',
    end: 'top 20%',
    scrub: 1.2
  }
});
patrolTl
  .to(astro, { left: '55%', top: '10%', rotate: -8, duration: 1, ease: 'none' })
  .to(astro, { left: '70%', top: '22%', rotate: 6, duration: 1, ease: 'none' })
  .to(astro, { left: '38%', top: '46%', rotate: -4, duration: 1, ease: 'none' });

// Landing beside newsletter + wave + hologram message + fly away
const landTl = gsap.timeline({
  scrollTrigger: {
    trigger: '#newsletterCol',
    start: 'top 60%',
    once: true
  }
});
landTl
  .to(astro, {
    left: '44%', top: '34%', rotate: 0,
    duration: 1.1, ease: 'power3.out'
  })
  .to(astro, { y: '-=6', duration: 0.4, ease: 'power1.out' })
  .to(astro, { rotate: -12, duration: 0.25, ease: 'sine.inOut' })
  .to(astro, { rotate: 10, duration: 0.25, ease: 'sine.inOut' })
  .to(astro, { rotate: -8, duration: 0.25, ease: 'sine.inOut' })
  .to(astro, { rotate: 0, duration: 0.25, ease: 'sine.inOut' })
  .to(astroMsg, { opacity: 1, y: -8, duration: 0.5, ease: 'power2.out' }, '-=0.2')
  .to({}, { duration: 1.6 }) // hold message
  .to(astroMsg, { opacity: 0, duration: 0.4 })
  .to(astro, { left: '85%', top: '6%', rotate: 14, duration: 1.4, ease: 'power2.inOut' });

/* cursor-follow subtle parallax for astronaut when idle (footer only) */
footerEl.addEventListener('mousemove', (e) => {
  const r = footerEl.getBoundingClientRect();
  const relX = (e.clientX - r.left) / r.width - 0.5;
  const relY = (e.clientY - r.top) / r.height - 0.5;
  gsap.to(astro, { rotationZ: relX * 6, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
});