/* ==========================================================================
   HACKINDIA 2026 — JUDGES SECTION
   round.js
   Vanilla JS + Three.js. No jQuery, no framework.
   Sections:
     1. Utils (lerp, clamp, map, spring)
     2. Environment flags (reduced motion, touch, low power)
     3. Custom cursor
     4. Three.js background (starfield layers + galaxy swirl + parallax)
     5. Card controller (tilt, flip, shine, particles)
     6. Constellation SVG (draw-on-scroll + pulsing nodes)
     7. Magnetic button + ripple
     8. Scroll reveal (IntersectionObserver)
     9. Boot
   ========================================================================== */

(() => {
  'use strict';

  /* ------------------------------------------------------------------------
     1. UTILS
     ------------------------------------------------------------------------ */
  const lerp  = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const mapRange = (v, inMin, inMax, outMin, outMax) =>
    outMin + ((v - inMin) * (outMax - outMin)) / (inMax - inMin);

  /** Simple critically-damped spring for smooth follow behaviour. */
  class Spring {
    constructor(value = 0, stiffness = 0.12, damping = 0.78){
      this.value = value;
      this.target = value;
      this.velocity = 0;
      this.stiffness = stiffness;
      this.damping = damping;
    }
    set(target){ this.target = target; }
    update(){
      const force = (this.target - this.value) * this.stiffness;
      this.velocity = (this.velocity + force) * this.damping;
      this.value += this.velocity;
      return this.value;
    }
  }

  /* ------------------------------------------------------------------------
     2. ENVIRONMENT FLAGS
     ------------------------------------------------------------------------ */
  const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IS_TOUCH = matchMedia('(hover: none), (pointer: coarse)').matches;
  const LOW_POWER = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || IS_TOUCH;

  if (IS_TOUCH) document.body.classList.add('touch-device', 'no-custom-cursor');
  if (LOW_POWER) document.documentElement.classList.add('low-power');

  /* ------------------------------------------------------------------------
     3. CUSTOM CURSOR
     ------------------------------------------------------------------------ */
  function initCursor(){
    if (IS_TOUCH || REDUCE_MOTION) return;

    const dot = document.getElementById('cursorDot');
    const glow = document.getElementById('cursorGlow');
    if (!dot || !glow) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    const dotPos = { x: mouseX, y: mouseY };
    const glowPos = { x: mouseX, y: mouseY };

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    document.querySelectorAll('a, button, [data-tilt], [data-magnetic]').forEach(el => {
      el.addEventListener('mouseenter', () => glow.classList.add('is-active'));
      el.addEventListener('mouseleave', () => glow.classList.remove('is-active'));
    });

    function raf(){
      dotPos.x = lerp(dotPos.x, mouseX, 0.35);
      dotPos.y = lerp(dotPos.y, mouseY, 0.35);
      glowPos.x = lerp(glowPos.x, mouseX, 0.12);
      glowPos.y = lerp(glowPos.y, mouseY, 0.12);

      dot.style.transform = `translate(${dotPos.x}px, ${dotPos.y}px) translate(-50%,-50%)`;
      glow.style.transform = `translate(${glowPos.x}px, ${glowPos.y}px) translate(-50%,-50%)`;

      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  /* ------------------------------------------------------------------------
     4. THREE.JS BACKGROUND
     ------------------------------------------------------------------------ */
  function initThreeBackground(){
    const canvas = document.getElementById('webgl');
    if (!canvas || typeof THREE === 'undefined') return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, LOW_POWER ? 1.3 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60, window.innerWidth / window.innerHeight, 1, 4000
    );
    camera.position.z = 620;

    /* ---- Starfield: three depth layers, each with its own drift speed ---- */
    const starLayers = [];
    const starLayerConfigs = LOW_POWER
      ? [
          { count: 500, spread: 2200, size: 1.6, color: 0xf6f4ff },
          { count: 220, spread: 1600, size: 2.4, color: 0xa855f7 }
        ]
      : [
          { count: 1100, spread: 2600, size: 1.4, color: 0xf6f4ff },
          { count: 600,  spread: 1900, size: 2.2, color: 0xa855f7 },
          { count: 350,  spread: 1300, size: 2.8, color: 0x38bdf8 }
        ];

    starLayerConfigs.forEach((cfg, i) => {
      const positions = new Float32Array(cfg.count * 3);
      for (let p = 0; p < cfg.count; p++) {
        positions[p * 3]     = (Math.random() - 0.5) * cfg.spread;
        positions[p * 3 + 1] = (Math.random() - 0.5) * cfg.spread;
        positions[p * 3 + 2] = (Math.random() - 0.5) * cfg.spread;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.PointsMaterial({
        color: cfg.color,
        size: cfg.size,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true,
        depthWrite: false
      });

      const points = new THREE.Points(geo, mat);
      scene.add(points);
      starLayers.push({ points, depth: i + 1 });
    });

    /* ---- Galaxy swirl: a slowly rotating disc of particles off to one side ---- */
    const galaxyCount = LOW_POWER ? 300 : 900;
    const galaxyGeo = new THREE.BufferGeometry();
    const galaxyPos = new Float32Array(galaxyCount * 3);
    const galaxyColor = new Float32Array(galaxyCount * 3);
    const colorA = new THREE.Color(0xa855f7);
    const colorB = new THREE.Color(0x38bdf8);

    for (let i = 0; i < galaxyCount; i++) {
      const radius = Math.random() * 500;
      const spin = radius * 0.008;
      const branch = (i % 3) * ((Math.PI * 2) / 3);
      const angle = branch + spin;

      const rx = Math.cos(angle) * radius + (Math.random() - 0.5) * 60;
      const ry = (Math.random() - 0.5) * 40;
      const rz = Math.sin(angle) * radius + (Math.random() - 0.5) * 60;

      galaxyPos[i * 3]     = rx;
      galaxyPos[i * 3 + 1] = ry;
      galaxyPos[i * 3 + 2] = rz;

      const mixed = colorA.clone().lerp(colorB, radius / 500);
      galaxyColor[i * 3] = mixed.r;
      galaxyColor[i * 3 + 1] = mixed.g;
      galaxyColor[i * 3 + 2] = mixed.b;
    }
    galaxyGeo.setAttribute('position', new THREE.BufferAttribute(galaxyPos, 3));
    galaxyGeo.setAttribute('color', new THREE.BufferAttribute(galaxyColor, 3));

    const galaxyMat = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const galaxy = new THREE.Points(galaxyGeo, galaxyMat);
    galaxy.position.set(900, 200, -600);
    galaxy.rotation.x = 0.4;
    scene.add(galaxy);

    /* ---- Nebula: soft glowing sprites using a radial-gradient canvas texture ---- */
    function makeGlowTexture(hex){
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, hex + 'ff');
      g.addColorStop(0.4, hex + '55');
      g.addColorStop(1, hex + '00');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
      return new THREE.CanvasTexture(c);
    }

    const nebulaTexA = makeGlowTexture('#a855f7');
    const nebulaTexB = makeGlowTexture('#38bdf8');
    const nebulaSprites = [];
    const nebulaConfigs = [
      { tex: nebulaTexA, pos: [-700, 150, -900], scale: 900 },
      { tex: nebulaTexB, pos: [750, -200, -1100], scale: 1100 }
    ];
    nebulaConfigs.forEach(cfg => {
      const mat = new THREE.SpriteMaterial({
        map: cfg.tex, transparent: true, opacity: 0.35,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(...cfg.pos);
      sprite.scale.set(cfg.scale, cfg.scale, 1);
      scene.add(sprite);
      nebulaSprites.push(sprite);
    });

    /* ---- Mouse parallax ---- */
    const targetRot = { x: 0, y: 0 };
    const currentRot = { x: 0, y: 0 };

    window.addEventListener('mousemove', (e) => {
      const nx = (e.clientX / window.innerWidth) - 0.5;
      const ny = (e.clientY / window.innerHeight) - 0.5;
      targetRot.x = -ny * 0.18;
      targetRot.y = nx * 0.28;
    }, { passive: true });

    /* ---- Resize ---- */
    function onResize(){
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);

    /* ---- Render loop ---- */
    const clock = new THREE.Clock();
    function animate(){
      const t = clock.getElapsedTime();

      currentRot.x = lerp(currentRot.x, targetRot.x, 0.03);
      currentRot.y = lerp(currentRot.y, targetRot.y, 0.03);

      camera.position.x = currentRot.y * 60;
      camera.position.y = currentRot.x * 60;
      camera.lookAt(0, 0, 0);

      starLayers.forEach((layer) => {
        layer.points.rotation.y = t * 0.008 * layer.depth * 0.4;
        layer.points.rotation.x = currentRot.x * 0.3 * layer.depth;
      });

      galaxy.rotation.y = t * 0.02;
      nebulaSprites.forEach((s, i) => {
        s.material.rotation = t * 0.02 * (i % 2 === 0 ? 1 : -1);
      });

      renderer.render(scene, camera);
      if (!REDUCE_MOTION) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  /* ------------------------------------------------------------------------
     5. CARD CONTROLLER — tilt (spring), flip, shine, ambient particles
     ------------------------------------------------------------------------ */
  function initCards(){
    const cards = Array.from(document.querySelectorAll('[data-card]'));

    cards.forEach((card) => {
      const inner = card.querySelector('[data-tilt]');
      const shines = card.querySelectorAll('[data-shine]');
      const particleHost = card.querySelector('[data-particles]');

      let flipped = false;
      const tiltXSpring = new Spring(0, 0.14, 0.72);
      const tiltYSpring = new Spring(0, 0.14, 0.72);
      let targetTiltX = 0, targetTiltY = 0;
      let raf = null;

      /* --- ambient particles: generated once, animated via CSS --- */
      spawnParticles(particleHost, 10, getComputedStyle(card).getPropertyValue('--accent').trim());

      function loop(){
        const cx = tiltXSpring.update();
        const cy = tiltYSpring.update();
        inner.style.setProperty('--tiltX', `${cx}deg`);
        inner.style.setProperty('--tiltY', `${cy + (flipped ? 180 : 0)}deg`);

        const settled =
          Math.abs(tiltXSpring.target - tiltXSpring.value) < 0.01 &&
          Math.abs(tiltYSpring.target - tiltYSpring.value) < 0.01 &&
          Math.abs(tiltXSpring.velocity) < 0.01 &&
          Math.abs(tiltYSpring.velocity) < 0.01;

        if (!settled) {
          raf = requestAnimationFrame(loop);
        } else {
          raf = null;
        }
      }

      function requestLoop(){
        if (!raf) raf = requestAnimationFrame(loop);
      }

      if (!IS_TOUCH && !REDUCE_MOTION) {
        card.addEventListener('pointermove', (e) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;

          targetTiltX = (0.5 - py) * 16;
          targetTiltY = (px - 0.5) * 16;
          tiltXSpring.set(targetTiltX);
          tiltYSpring.set(targetTiltY);

          shines.forEach(s => {
            s.style.setProperty('--mx', `${px * 100}%`);
            s.style.setProperty('--my', `${py * 100}%`);
          });

          requestLoop();
        });

        card.addEventListener('pointerleave', () => {
          tiltXSpring.set(0);
          tiltYSpring.set(0);
          requestLoop();
        });
      }

      function toggleFlip(){
        flipped = !flipped;
        inner.classList.toggle('is-flipped', flipped);
        tiltXSpring.set(0);
        tiltYSpring.set(0);
        requestLoop();
      }

      inner.addEventListener('click', toggleFlip);
      inner.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleFlip();
        }
      });
    });
  }

  /** Creates small glowing dots that orbit a card using CSS keyframes with randomized paths. */
  function spawnParticles(host, count, accentColor){
    if (!host || LOW_POWER) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'p';
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 20;
      const ex = Math.cos(angle) * dist;
      const ey = Math.sin(angle) * dist;

      p.style.left = `${50 + (Math.random() - 0.5) * 60}%`;
      p.style.top = `${50 + (Math.random() - 0.5) * 60}%`;
      p.style.setProperty('--orbit-end', `translate(${ex}px, ${ey}px)`);
      p.style.animationDuration = `${6 + Math.random() * 6}s`;
      p.style.animationDelay = `${Math.random() * 6}s`;
      host.appendChild(p);
    }
  }

  /* ------------------------------------------------------------------------
     6. CONSTELLATION SVG — connects card centers, draws in on scroll
     ------------------------------------------------------------------------ */
  function initConstellation(){
    const svg = document.getElementById('constellationSvg');
    const stage = document.getElementById('constellationStage');
    const linesGroup = document.getElementById('linesGroup');
    const nodesGroup = document.getElementById('nodesGroup');
    const cards = Array.from(document.querySelectorAll('[data-card]'));
    if (!svg || !stage || cards.length < 2) return;

    let paths = [];

    function build(){
      if (window.innerWidth <= 1080) return; // hidden on tablet/mobile via CSS too
      linesGroup.innerHTML = '';
      nodesGroup.innerHTML = '';
      paths = [];

      const stageRect = stage.getBoundingClientRect();
      const centers = cards.map(card => {
        const r = card.getBoundingClientRect();
        return {
          x: r.left - stageRect.left + r.width / 2,
          y: r.top - stageRect.top + 60
        };
      });

      svg.setAttribute('viewBox', `0 0 ${stageRect.width} ${stageRect.height}`);

      for (let i = 0; i < centers.length - 1; i++) {
        const a = centers[i], b = centers[i + 1];
        const midY = a.y - 40;
        const d = `M${a.x},${a.y} Q${(a.x + b.x) / 2},${midY} ${b.x},${b.y}`;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('class', 'c-line');
        linesGroup.appendChild(path);

        const length = path.getTotalLength();
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${length}`;
        paths.push({ el: path, length });
      }

      centers.forEach(c => {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', c.x);
        dot.setAttribute('cy', c.y);
        dot.setAttribute('r', 3);
        dot.setAttribute('class', 'c-node');
        nodesGroup.appendChild(dot);
      });
    }

    /** Draw progress tied to how far the stage has scrolled through the viewport. */
    function updateDraw(){
      const r = stage.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = clamp(mapRange(r.top, vh * 0.85, vh * 0.25, 0, 1), 0, 1);

      paths.forEach(({ el, length }) => {
        el.style.strokeDashoffset = `${length * (1 - progress)}`;
      });
    }

    build();
    updateDraw();

    window.addEventListener('resize', () => { build(); updateDraw(); });
    window.addEventListener('scroll', () => {
      if (!REDUCE_MOTION) window.requestAnimationFrame(updateDraw);
    }, { passive: true });
  }

  /* ------------------------------------------------------------------------
     7. MAGNETIC BUTTON + RIPPLE
     ------------------------------------------------------------------------ */
  function initMagneticButtons(){
    document.querySelectorAll('[data-magnetic]').forEach((btn) => {
      if (!IS_TOUCH && !REDUCE_MOTION) {
        const strength = 0.35;
        btn.addEventListener('pointermove', (e) => {
          const r = btn.getBoundingClientRect();
          const mx = e.clientX - (r.left + r.width / 2);
          const my = e.clientY - (r.top + r.height / 2);
          btn.style.transform = `translate(${mx * strength}px, ${my * strength}px)`;
        });
        btn.addEventListener('pointerleave', () => {
          btn.style.transform = 'translate(0, 0)';
          btn.style.transition = 'transform 0.5s var(--ease-bounce)';
          setTimeout(() => { btn.style.transition = ''; }, 500);
        });
      }

      btn.addEventListener('click', (e) => {
        const r = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(r.width, r.height) * 1.6;
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - r.left - size / 2}px`;
        ripple.style.top = `${e.clientY - r.top - size / 2}px`;
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    });
  }

  /* ------------------------------------------------------------------------
     8. SCROLL REVEAL
     ------------------------------------------------------------------------ */
  function initScrollReveal(){
    const revealEls = Array.from(document.querySelectorAll('[data-reveal]'));
    const cardEls = Array.from(document.querySelectorAll('[data-card]'));

    cardEls.forEach((el, i) => {
      el.style.transitionDelay = REDUCE_MOTION ? '0s' : `${i * 0.1}s`;
    });

    if (!('IntersectionObserver' in window)) {
      [...revealEls, ...cardEls].forEach(el => el.classList.add('in-view'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    [...revealEls, ...cardEls].forEach(el => io.observe(el));
  }

  /* ------------------------------------------------------------------------
     9. BOOT
     ------------------------------------------------------------------------ */
  function boot(){
    initCursor();
    initThreeBackground();
    initCards();
    initConstellation();
    initMagneticButtons();
    initScrollReveal();

    const viewAllBtn = document.getElementById('viewAllBtn');
    if (viewAllBtn) {
      viewAllBtn.querySelector('.glow-btn-label') &&
        viewAllBtn.addEventListener('click', (e) => {
          // Placeholder action — wire this up to the real judges roster route.
          if (!e.target.classList.contains('ripple')) {
            console.log('Navigate to full judges roster.');
          }
        });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
