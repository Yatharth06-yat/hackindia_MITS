/* ==========================================================================
   HACKINDIA 2026 — FAQ PAGE LOGIC
   Sections: Loader3D · BackgroundField · HeroCube · Typing · SmoothScroll
             Cursor · Search/Filter · Accordion · Magnetic · ScrollReveal
             FooterWave
   ========================================================================== */

   (() => {
    'use strict';
  
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
  
    /* ------------------------------------------------------------------------
       STATE: pointer
    ------------------------------------------------------------------------ */
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, nx: 0, ny: 0 };
    window.addEventListener('pointermove', (e) => {
      pointer.x = e.clientX; pointer.y = e.clientY;
      pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ny = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  
    /* ==========================================================================
       1. LOADER — 3D holographic question mark + progress
       ========================================================================== */
    const Loader = (() => {
      const el = document.getElementById('loader');
      const canvas = document.getElementById('loaderCanvas');
      const barFill = document.getElementById('loaderBarFill');
      const percentEl = document.getElementById('loaderPercent');
      let renderer, scene, camera, glyph, particles, raf;
  
      function initThree() {
        if (typeof THREE === 'undefined') return false;
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
  
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.z = 6;
  
        const key = new THREE.PointLight(0x00f5ff, 3, 20);
        key.position.set(3, 3, 4);
        scene.add(key);
        const fill = new THREE.PointLight(0x7c3aed, 2.4, 20);
        fill.position.set(-3, -2, 3);
        scene.add(fill);
        scene.add(new THREE.AmbientLight(0x1a1a2e, 1));
  
        // Torus-knot stand-in for a "holographic question mark" glyph — reads as an
        // abstract rotating emblem rather than literal text geometry.
        const geo = new THREE.TorusKnotGeometry(1.05, 0.32, 140, 20, 2, 3);
        const mat = new THREE.MeshPhysicalMaterial({
          color: 0x0a0f24, emissive: 0x00f5ff, emissiveIntensity: 0.55,
          metalness: 0.3, roughness: 0.15, transmission: 0.55, thickness: 1.2,
          clearcoat: 1, wireframe: false
        });
        glyph = new THREE.Mesh(geo, mat);
        scene.add(glyph);
  
        const wireGeo = new THREE.TorusKnotGeometry(1.22, 0.02, 100, 8, 2, 3);
        const wireMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff, transparent: true, opacity: 0.5 });
        glyph.add(new THREE.Mesh(wireGeo, wireMat));
  
        // floating particles
        const pGeo = new THREE.BufferGeometry();
        const count = 200;
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          pos[i * 3] = (Math.random() - 0.5) * 14;
          pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const pMat = new THREE.PointsMaterial({ color: 0x9333ea, size: 0.035, transparent: true, opacity: 0.7 });
        particles = new THREE.Points(pGeo, pMat);
        scene.add(particles);
  
        window.addEventListener('resize', onResize);
        return true;
      }
  
      function onResize() {
        if (!renderer) return;
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      }
  
      function tick() {
        raf = requestAnimationFrame(tick);
        if (glyph) { glyph.rotation.y += 0.012; glyph.rotation.x += 0.006; }
        if (particles) particles.rotation.y += 0.0008;
        if (renderer) renderer.render(scene, camera);
      }
  
      function stop() {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        if (renderer) renderer.dispose();
      }
  
      function run(onDone) {
        const ok = initThree();
        if (ok) tick();
  
        let progress = 0;
        const step = () => {
          progress += Math.random() * 14 + 6;
          if (progress >= 100) progress = 100;
          barFill.style.width = progress + '%';
          percentEl.firstChild.textContent = Math.floor(progress);
          if (progress < 100) {
            setTimeout(step, 90 + Math.random() * 120);
          } else {
            setTimeout(finish, 260);
          }
        };
  
        function finish() {
          if (window.gsap) {
            gsap.to(el, {
              opacity: 0, duration: 0.8, ease: 'power2.inOut',
              onComplete: () => { el.classList.add('is-hidden'); el.style.display = 'none'; stop(); onDone(); }
            });
          } else {
            el.style.display = 'none'; stop(); onDone();
          }
        }
  
        step();
      }
  
      return { run };
    })();
  
    /* ==========================================================================
       2. AMBIENT BACKGROUND FIELD — stars, particles, network lines, code rain
       Runs on a single 2D canvas across the whole scrollable page for perf.
       ========================================================================== */
    const BackgroundField = (() => {
      const canvas = document.getElementById('bgCanvas');
      const ctx = canvas.getContext('2d');
      let w, h, dpr;
      let stars = [], dust = [], drops = [];
      let raf;
  
      const GLYPHS = '01アイウエオHACKINDIA<>/{}';
  
      function resize() {
        dpr = Math.min(window.devicePixelRatio, 1.6);
        w = canvas.width = window.innerWidth * dpr;
        h = canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        build();
      }
  
      function build() {
        stars = Array.from({ length: 120 }, () => ({
          x: Math.random() * w, y: Math.random() * h,
          r: Math.random() * 1.4 * dpr + 0.3,
          a: Math.random(), spd: Math.random() * 0.01 + 0.003
        }));
        dust = Array.from({ length: 46 }, () => ({
          x: Math.random() * w, y: Math.random() * h,
          r: Math.random() * 2.2 * dpr + 0.6,
          vx: (Math.random() - 0.5) * 0.15 * dpr,
          vy: (Math.random() - 0.5) * 0.15 * dpr,
          hue: Math.random() > 0.5 ? '124,58,237' : '6,182,212'
        }));
        const cols = Math.floor((window.innerWidth) / 26);
        drops = Array.from({ length: Math.min(cols, 24) }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          spd: (Math.random() * 1.2 + 0.6) * dpr,
          glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          life: Math.random()
        }));
      }
  
      function drawNetwork() {
        ctx.strokeStyle = 'rgba(0,245,255,0.06)';
        ctx.lineWidth = 1;
        for (let i = 0; i < dust.length; i++) {
          for (let j = i + 1; j < dust.length; j++) {
            const dx = dust[i].x - dust[j].x, dy = dust[i].y - dust[j].y;
            const dist = Math.hypot(dx, dy);
            if (dist < 160 * dpr) {
              ctx.globalAlpha = 1 - dist / (160 * dpr);
              ctx.beginPath();
              ctx.moveTo(dust[i].x, dust[i].y);
              ctx.lineTo(dust[j].x, dust[j].y);
              ctx.stroke();
            }
          }
        }
        ctx.globalAlpha = 1;
      }
  
      function frame() {
        raf = requestAnimationFrame(frame);
        ctx.clearRect(0, 0, w, h);
  
        // stars
        stars.forEach(s => {
          s.a += s.spd;
          const tw = 0.4 + Math.abs(Math.sin(s.a)) * 0.6;
          ctx.beginPath();
          ctx.fillStyle = `rgba(245,246,255,${tw * 0.6})`;
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        });
  
        // dust / particles
        dust.forEach(p => {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
          ctx.beginPath();
          ctx.fillStyle = `rgba(${p.hue},0.55)`;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        });
        drawNetwork();
  
        // sparse code rain
        ctx.font = `${11 * dpr}px monospace`;
        drops.forEach(d => {
          d.y += d.spd;
          if (d.y > h) { d.y = -20; d.glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]; }
          ctx.fillStyle = 'rgba(6,182,212,0.16)';
          ctx.fillText(d.glyph, d.x, d.y);
        });
  
        raf = raf; // no-op keep lint calm
      }
  
      function start() {
        resize();
        window.addEventListener('resize', resize);
        if (!reduceMotion) frame(); else { ctx.clearRect(0,0,w,h); }
      }
  
      return { start };
    })();
  
    /* ==========================================================================
       3. HERO 3D CRYSTAL CUBE
       ========================================================================== */
    const HeroCube = (() => {
      const canvas = document.getElementById('heroCanvas');
      const wrap = document.getElementById('heroCanvasWrap');
      let renderer, scene, camera, cubeGroup, glyphMesh, particles, raf;
      let targetRotX = 0, targetRotY = 0;
  
      function init() {
        if (typeof THREE === 'undefined' || !canvas) return false;
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        setSize();
  
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(42, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
        camera.position.set(0, 0, 6.2);
  
        scene.add(new THREE.AmbientLight(0x1a1a2e, 1.1));
        const l1 = new THREE.PointLight(0x00f5ff, 3.2, 20); l1.position.set(3, 2, 4); scene.add(l1);
        const l2 = new THREE.PointLight(0x7c3aed, 2.6, 20); l2.position.set(-3, -2, 3); scene.add(l2);
        const l3 = new THREE.PointLight(0x3b82f6, 1.6, 20); l3.position.set(0, 3, -3); scene.add(l3);
  
        cubeGroup = new THREE.Group();
        scene.add(cubeGroup);
  
        // glass cube shell
        const cubeGeo = new THREE.BoxGeometry(2.1, 2.1, 2.1, 2, 2, 2);
        const cubeMat = new THREE.MeshPhysicalMaterial({
          color: 0x0a0f24, transparent: true, opacity: 0.28,
          metalness: 0.1, roughness: 0.05, transmission: 0.9, thickness: 1.5,
          clearcoat: 1, clearcoatRoughness: 0.1, side: THREE.DoubleSide
        });
        const cube = new THREE.Mesh(cubeGeo, cubeMat);
        cubeGroup.add(cube);
  
        // edge glow wireframe
        const edges = new THREE.EdgesGeometry(cubeGeo);
        const edgeMat = new THREE.LineBasicMaterial({ color: 0x00f5ff, transparent: true, opacity: 0.65 });
        cubeGroup.add(new THREE.LineSegments(edges, edgeMat));
  
        // inner rotating question-mark glyph (torus + sphere, abstracted)
        const glyphGroup = new THREE.Group();
        const bodyGeo = new THREE.TorusGeometry(0.42, 0.11, 24, 60, Math.PI * 1.5);
        const glyphMat = new THREE.MeshStandardMaterial({ color: 0x9333ea, emissive: 0x7c3aed, emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.4 });
        const body = new THREE.Mesh(bodyGeo, glyphMat);
        body.rotation.z = Math.PI * 0.65;
        body.position.y = 0.18;
        glyphGroup.add(body);
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 20), glyphMat);
        dot.position.set(0.02, -0.55, 0);
        glyphGroup.add(dot);
        glyphMesh = glyphGroup;
        cubeGroup.add(glyphGroup);
  
        // orbiting particles around the cube
        const pGeo = new THREE.BufferGeometry();
        const count = 90;
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          const r = 2.6 + Math.random() * 1.6;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          pos[i * 3 + 2] = r * Math.cos(phi);
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const pMat = new THREE.PointsMaterial({ color: 0x06b6d4, size: 0.045, transparent: true, opacity: 0.75 });
        particles = new THREE.Points(pGeo, pMat);
        scene.add(particles);
  
        window.addEventListener('resize', setSize);
        return true;
      }
  
      function setSize() {
        const width = wrap.clientWidth, height = wrap.clientHeight;
        renderer.setSize(width, height);
        if (camera) { camera.aspect = width / height; camera.updateProjectionMatrix(); }
      }
  
      function tick() {
        raf = requestAnimationFrame(tick);
        if (cubeGroup) {
          targetRotY += (pointer.nx * 0.5 - targetRotY) * 0.04;
          targetRotX += (-pointer.ny * 0.35 - targetRotX) * 0.04;
          cubeGroup.rotation.y += 0.0038 + targetRotY * 0.002;
          cubeGroup.rotation.x = targetRotX * 0.4 + Math.sin(Date.now() * 0.0006) * 0.06;
        }
        if (glyphMesh) glyphMesh.rotation.z += 0.01;
        if (particles) particles.rotation.y += 0.0012;
        if (renderer) renderer.render(scene, camera);
      }
  
      function start() {
        const ok = init();
        if (ok && !reduceMotion) tick();
        else if (ok) { renderer.render(scene, camera); }
      }
  
      return { start };
    })();
  
    /* ==========================================================================
       4. TYPING ANIMATION — hero tagline
       ========================================================================== */
    const Typing = (() => {
      const el = document.getElementById('typingText');
      const lines = ["Questions?", "We've Got Answers."];
      let li = 0, ci = 0, deleting = false;
  
      function tick() {
        const current = lines[li];
        if (!deleting) {
          el.textContent = current.slice(0, ++ci);
          if (ci === current.length) {
            deleting = li === 0 ? false : true;
            if (li === 0) { li = 1; ci = 0; setTimeout(tick, 500); return; }
            setTimeout(tick, 1800);
            return;
          }
        } else {
          el.textContent = current.slice(0, --ci);
          if (ci === 0) { deleting = false; li = 0; setTimeout(tick, 400); return; }
        }
        setTimeout(tick, deleting ? 35 : 65);
      }
  
      function start() {
        if (reduceMotion) { el.textContent = "Questions? We've Got Answers."; return; }
        tick();
      }
      return { start };
    })();
  
    /* ==========================================================================
       5. SMOOTH SCROLL (Lenis) + GSAP ScrollTrigger bridge
       ========================================================================== */
    const SmoothScroll = (() => {
      function start() {
        if (typeof Lenis === 'undefined' || reduceMotion) return null;
        const lenis = new Lenis({ duration: 1.1, smoothWheel: true, smoothTouch: false });
        function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
  
        if (window.gsap && window.ScrollTrigger) {
          lenis.on('scroll', ScrollTrigger.update);
          gsap.ticker.add((time) => { lenis.raf(time * 1000); });
          gsap.ticker.lagSmoothing(0);
        }
        return lenis;
      }
      return { start };
    })();
  
    /* ==========================================================================
       6. CURSOR SPOTLIGHT
       ========================================================================== */
    const Cursor = (() => {
      const el = document.getElementById('cursorSpotlight');
      function start() {
        if (isTouch) { el.style.display = 'none'; return; }
        function loop() {
          el.style.transform = `translate(${pointer.x}px, ${pointer.y}px) translate(-50%,-50%)`;
          requestAnimationFrame(loop);
        }
        loop();
      }
      return { start };
    })();
  
    /* ==========================================================================
       7. SEARCH + CATEGORY FILTER
       ========================================================================== */
    const SearchFilter = (() => {
      const input = document.getElementById('searchInput');
      const cards = Array.from(document.querySelectorAll('.faq-card'));
      const filters = Array.from(document.querySelectorAll('.filter-btn'));
      const noResults = document.getElementById('noResults');
      const resetBtn = document.getElementById('resetSearch');
      let activeFilter = 'all';
  
      const placeholderText = 'Search FAQs...';
  
      function typePlaceholder() {
        if (reduceMotion) { input.placeholder = placeholderText; return; }
        let i = 0;
        const step = () => {
          input.placeholder = placeholderText.slice(0, i++);
          if (i <= placeholderText.length) setTimeout(step, 55);
        };
        step();
      }
  
      function apply() {
        const q = input.value.trim().toLowerCase();
        let visible = 0;
        cards.forEach(card => {
          const text = card.querySelector('.faq-q-text').textContent.toLowerCase();
          const answer = card.querySelector('.faq-answer-inner').textContent.toLowerCase();
          const matchesQuery = !q || text.includes(q) || answer.includes(q);
          const matchesFilter = activeFilter === 'all' || card.dataset.category === activeFilter;
          const show = matchesQuery && matchesFilter;
          card.classList.toggle('is-hidden', !show);
          if (show) visible++;
        });
        noResults.classList.toggle('is-visible', visible === 0);
      }
  
      function bind() {
        input.addEventListener('input', apply);
        filters.forEach(btn => {
          btn.addEventListener('click', () => {
            filters.forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            activeFilter = btn.dataset.filter;
            apply();
          });
        });
        resetBtn.addEventListener('click', () => {
          input.value = '';
          filters.forEach(b => b.classList.remove('is-active'));
          filters[0].classList.add('is-active');
          activeFilter = 'all';
          apply();
        });
        window.addEventListener('keydown', (e) => {
          if (e.key === '/' && document.activeElement !== input) {
            e.preventDefault(); input.focus();
          }
        });
      }
  
      function start() { typePlaceholder(); bind(); }
      return { start };
    })();
  
    /* ==========================================================================
       8. ACCORDION — GSAP height animation
       ========================================================================== */
    const Accordion = (() => {
      function start() {
        document.querySelectorAll('.faq-card').forEach(card => {
          const btn = card.querySelector('.faq-question');
          const answer = card.querySelector('.faq-answer');
          const inner = card.querySelector('.faq-answer-inner');
  
          btn.addEventListener('click', () => {
            const isOpen = card.classList.contains('is-open');
  
            // close any other open card (single-open accordion feel, but not enforced strictly)
            if (!isOpen) {
              card.classList.add('is-open');
              btn.setAttribute('aria-expanded', 'true');
              if (window.gsap) {
                gsap.set(answer, { height: 'auto' });
                const h = answer.offsetHeight;
                gsap.fromTo(answer, { height: 0 }, { height: h, duration: 0.55, ease: 'power3.out' });
                gsap.fromTo(inner, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.08, ease: 'power2.out' });
              } else {
                answer.style.height = 'auto';
              }
            } else {
              card.classList.remove('is-open');
              btn.setAttribute('aria-expanded', 'false');
              if (window.gsap) {
                gsap.to(answer, { height: 0, duration: 0.4, ease: 'power3.inOut' });
                gsap.to(inner, { opacity: 0, duration: 0.2 });
              } else {
                answer.style.height = '0px';
              }
            }
          });
  
          // magnetic / tilt hover
          card.addEventListener('mousemove', (e) => {
            if (isTouch || reduceMotion) return;
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            if (window.gsap) {
              gsap.to(card, { rotateY: x * 4, rotateX: -y * 4, duration: 0.4, ease: 'power2.out', transformPerspective: 800 });
            }
          });
          card.addEventListener('mouseleave', () => {
            if (window.gsap) gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'power3.out' });
          });
        });
      }
      return { start };
    })();
  
    /* ==========================================================================
       9. MAGNETIC BUTTONS (filters, help items, nav cta)
       ========================================================================== */
    const Magnetic = (() => {
      function bind(el, strength = 16) {
        el.addEventListener('mousemove', (e) => {
          if (isTouch || reduceMotion || !window.gsap) return;
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left - r.width / 2) / r.width;
          const y = (e.clientY - r.top - r.height / 2) / r.height;
          gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: 'power2.out' });
        });
        el.addEventListener('mouseleave', () => {
          if (window.gsap) gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
        });
      }
      function start() {
        document.querySelectorAll('.filter-btn, .help-item, .nav-cta').forEach(el => bind(el, 10));
      }
      return { start };
    })();
  
    /* ==========================================================================
       10. SCROLL REVEAL — GSAP ScrollTrigger
       ========================================================================== */
    const ScrollReveal = (() => {
      function start() {
        if (!window.gsap || !window.ScrollTrigger) {
          document.querySelectorAll('[data-reveal]').forEach(el => el.style.opacity = 1);
          return;
        }
        gsap.registerPlugin(ScrollTrigger);
  
        gsap.to('[data-reveal]', {
          opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.3
        });
        gsap.set('[data-reveal]', { y: 20 });
  
        gsap.utils.toArray('.faq-card').forEach((card, i) => {
          gsap.from(card, {
            scrollTrigger: { trigger: card, start: 'top 90%' },
            opacity: 0, y: 40, scale: 0.97, filter: 'blur(6px)',
            duration: 0.7, ease: 'power3.out', delay: (i % 4) * 0.05
          });
        });
  
        gsap.from('.search-box', {
          scrollTrigger: { trigger: '.search-section', start: 'top 85%' },
          opacity: 0, y: 24, duration: 0.8, ease: 'power3.out'
        });
  
        gsap.from('.filter-btn', {
          scrollTrigger: { trigger: '.filters-section', start: 'top 90%' },
          opacity: 0, y: 16, stagger: 0.05, duration: 0.5, ease: 'power2.out'
        });
  
        gsap.from('.help-card', {
          scrollTrigger: { trigger: '.help-section', start: 'top 85%' },
          opacity: 0, y: 50, scale: 0.96, duration: 0.9, ease: 'power3.out'
        });
  
        gsap.from('.footer-brand, .footer-links, .footer-social', {
          scrollTrigger: { trigger: '.site-footer', start: 'top 90%' },
          opacity: 0, y: 24, stagger: 0.08, duration: 0.7, ease: 'power2.out'
        });
  
        // hero parallax pin-lite: fade hero content on scroll
        gsap.to('.hero-inner', {
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
          y: 80, opacity: 0.2, ease: 'none'
        });
      }
      return { start };
    })();
  
    /* ==========================================================================
       11. FOOTER WAVE — lightweight canvas
       ========================================================================== */
    const FooterWave = (() => {
      const canvas = document.getElementById('footerCanvas');
      const ctx = canvas.getContext('2d');
      let w, h, dpr, t = 0;
  
      function resize() {
        dpr = Math.min(window.devicePixelRatio, 1.5);
        w = canvas.width = canvas.clientWidth * dpr;
        h = canvas.height = canvas.clientHeight * dpr;
      }
  
      function frame() {
        requestAnimationFrame(frame);
        t += 0.012;
        ctx.clearRect(0, 0, w, h);
        const waves = [
          { color: 'rgba(124,58,237,0.18)', amp: 14, freq: 0.012, speed: 1, offset: 0 },
          { color: 'rgba(6,182,212,0.16)', amp: 10, freq: 0.018, speed: -1.3, offset: 2 },
          { color: 'rgba(0,245,255,0.12)', amp: 7, freq: 0.024, speed: 1.6, offset: 4 }
        ];
        waves.forEach(wv => {
          ctx.beginPath();
          ctx.moveTo(0, h);
          for (let x = 0; x <= w; x += 8) {
            const y = h * 0.5 + Math.sin(x * wv.freq + t * wv.speed + wv.offset) * wv.amp * dpr;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(w, h);
          ctx.closePath();
          ctx.fillStyle = wv.color;
          ctx.fill();
        });
      }
  
      function start() {
        resize();
        window.addEventListener('resize', resize);
        if (!reduceMotion) frame();
      }
      return { start };
    })();
  
    /* ==========================================================================
       BOOT
       ========================================================================== */
    function boot() {
      BackgroundField.start();
      HeroCube.start();
      Typing.start();
      SmoothScroll.start();
      Cursor.start();
      SearchFilter.start();
      Accordion.start();
      Magnetic.start();
      ScrollReveal.start();
      FooterWave.start();
    }
  
    document.addEventListener('DOMContentLoaded', () => {
      Loader.run(boot);
    });
  
  })();