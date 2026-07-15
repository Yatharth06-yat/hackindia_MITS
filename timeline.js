/* ============================================================
   timeline.js — HackIndia 2026
   Powers the #timeline section embedded in index.html.
   Targets #timeline-canvas (distinct from the hero #bg-canvas).
   Requires: three.js, gsap + ScrollTrigger (loaded before this file)
   ============================================================ */

(function () {
  'use strict';

  // Guard: only run when the timeline section exists on the page
  const timelineSection = document.getElementById('timeline');
  if (!timelineSection) return;

  gsap.registerPlugin(ScrollTrigger);

  /* -------------------------------------------------------
     1. CHECKPOINT DATA
  ------------------------------------------------------- */
  const CHECKPOINTS = [
    { title: 'Registration', date: 'Aug 01', icon: '◆', desc: 'Sign up your team and stake your claim on the road ahead.', schedule: 'Opens Aug 01 · Closes Aug 14', resources: 'Team portal · Rulebook v1' },
    { title: 'Idea Submission', date: 'Aug 18', icon: '✦', desc: 'Pitch your concept in 300 words. Clarity beats complexity.', schedule: 'Deadline Aug 18, 11:59 PM', resources: 'Submission template · Judging rubric' },
    { title: 'Mentorship', date: 'Aug 25', icon: '◈', desc: '1:1 sessions with industry mentors to sharpen your build.', schedule: 'Aug 25 – Sep 05 · rolling slots', resources: 'Mentor directory · Booking calendar' },
    { title: 'Prototype', date: 'Sep 10', icon: '◇', desc: 'Ship a working prototype. Rough edges are welcome.', schedule: 'Due Sep 10, 6:00 PM', resources: 'Starter repo · Deployment guide' },
    { title: 'Hackathon', date: 'Sep 20', icon: '⬡', desc: '36 hours. One room. Everything you\'ve got.', schedule: 'Sep 20, 9 AM – Sep 21, 9 PM', resources: 'Venue map · Wi-Fi + power layout' },
    { title: 'Presentation', date: 'Sep 22', icon: '▲', desc: 'Five minutes on stage to make the case for your build.', schedule: 'Sep 22 · Slots assigned by team ID', resources: 'Slide template · Demo checklist' },
    { title: 'Judging', date: 'Sep 23', icon: '◉', desc: 'A panel of judges scores impact, execution, and polish.', schedule: 'Sep 23, 10 AM – 4 PM', resources: 'Scoring criteria · Judge bios' },
    { title: 'Grand Finale', date: 'Sep 24', icon: '★', desc: 'Winners announced. Prizes awarded. The road ends here.', schedule: 'Sep 24, 6:00 PM onward', resources: 'Livestream link · Prize breakdown' },
  ];

  /* -------------------------------------------------------
     2. THREE.JS STARFIELD — renders into #timeline-canvas
        The canvas is inside #timeline so it scrolls with the
        section and doesn't bleed into other parts of the page.
  ------------------------------------------------------- */
  (function initStarfield() {
    const canvas = document.getElementById('timeline-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    function resize() {
      renderer.setSize(timelineSection.offsetWidth, window.innerHeight);
      camera.aspect = timelineSection.offsetWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 1, 2000);
    camera.position.z = 500;
    resize();

    function makeStars(count, spread, size, color, opacity) {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * spread;
        pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
        pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      return new THREE.Points(geo, new THREE.PointsMaterial({
        color, size, transparent: true, opacity,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
    }

    const starsFar = makeStars(1200, 1800, 1.4, 0xffffff, 0.55);
    const starsMid = makeStars(500, 1200, 2.0, 0x8b5cf6, 0.60);
    const starsNear = makeStars(180, 800, 2.6, 0x33d6ff, 0.70);
    scene.add(starsFar, starsMid, starsNear);

    const nebulaGeo = new THREE.SphereGeometry(1, 8, 8);
    const nebulaCols = [0x8b5cf6, 0x33d6ff, 0xf5c542];
    const nebulae = [];
    for (let i = 0; i < 6; i++) {
      const mesh = new THREE.Mesh(nebulaGeo, new THREE.MeshBasicMaterial({
        color: nebulaCols[i % 3], transparent: true, opacity: 0.035, depthWrite: false
      }));
      const s = 220 + Math.random() * 260;
      mesh.scale.set(s, s, s);
      mesh.position.set((Math.random() - 0.5) * 1400, (Math.random() - 0.5) * 900, -400 - Math.random() * 400);
      scene.add(mesh);
      nebulae.push(mesh);
    }

    let mx = 0, my = 0;
    window.addEventListener('mousemove', e => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    });

    let scrollFrac = 0;
    function updateFrac() {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      scrollFrac = h > 0 ? window.scrollY / h : 0;
    }
    window.addEventListener('scroll', updateFrac, { passive: true });
    updateFrac();

    const clock = new THREE.Clock();
    function tick() {
      const t = clock.getElapsedTime();
      starsFar.rotation.y = t * 0.005;
      starsMid.rotation.y = t * 0.010 + scrollFrac * 0.6;
      starsNear.rotation.y = t * 0.018 + scrollFrac * 1.1;
      camera.position.x += (mx * 40 - camera.position.x) * 0.03;
      camera.position.y += (-my * 30 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);
      nebulae.forEach((n, i) => { n.position.y += Math.sin(t * 0.15 + i) * 0.05; });
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    tick();

    window.addEventListener('resize', resize);
  })();

  /* -------------------------------------------------------
     3. ENERGY ROAD — SVG Bezier path + checkpoint nodes
  ------------------------------------------------------- */
  const svg = document.getElementById('road-svg');
  const nodesLayer = document.getElementById('nodes-layer');
  const tlWrap = document.getElementById('timeline-wrap');
  const traveler = document.getElementById('traveler');

  if (!svg || !nodesLayer || !tlWrap || !traveler) return;

  const VB_W = 1000;
  const SECTION_H = 620;
  const TOP_PAD = 160;
  const BOT_PAD = 160;

  let points = [], pathEl, pathLen = 0;

  function buildRoad() {
    const totalH = TOP_PAD + (CHECKPOINTS.length - 1) * SECTION_H + BOT_PAD;
    tlWrap.style.height = totalH + 'px';
    svg.setAttribute('viewBox', `0 0 ${VB_W} ${totalH}`);
    svg.style.height = totalH + 'px';

    points = CHECKPOINTS.map((cp, i) => ({
      x: i % 2 === 0 ? 260 : 740,
      y: TOP_PAD + i * SECTION_H,
      cp, i
    }));

    let d = `M ${points[0].x} ${Math.max(points[0].y - 100, 20)} L ${points[0].x} ${points[0].y} `;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i], p1 = points[i + 1];
      const midY = (p0.y + p1.y) / 2;
      d += `C ${p0.x} ${midY}, ${p1.x} ${midY}, ${p1.x} ${p1.y} `;
    }
    d += `L ${points[points.length - 1].x} ${points[points.length - 1].y + 100}`;

    svg.innerHTML = `
      <path class="road-base" d="${d}"></path>
      <path class="road-glow" d="${d}"></path>
      <path class="road-fill" d="${d}" id="road-fill-path"></path>
    `;
    pathEl = document.getElementById('road-fill-path');
    pathLen = pathEl.getTotalLength();
    pathEl.style.strokeDasharray = pathLen;
    pathEl.style.strokeDashoffset = pathLen;
  }

  function renderNodes() {
    nodesLayer.innerHTML = '';
    points.forEach((p, i) => {
      const side = i % 2 === 0 ? 'align-left' : 'align-right';
      const el = document.createElement('div');
      el.className = `node ${side} state-upcoming`;
      el.style.left = (p.x / VB_W * 100) + '%';
      el.style.top = p.y + 'px';
      el.tabIndex = 0;
      el.dataset.index = i;
      el.innerHTML = `
        <div class="node-medal">
          <div class="ring-outer"></div>
          <span class="num">${String(i + 1).padStart(2, '0')}</span>
          <div class="icon">${p.cp.icon}</div>
        </div>
        <div class="node-title">${p.cp.title}</div>
        <div class="node-date">${p.cp.date}</div>
        <div class="node-desc">${p.cp.desc}</div>
      `;
      el.addEventListener('click', () => openModal(i));
      el.addEventListener('keydown', e => { if (e.key === 'Enter') openModal(i); });
      nodesLayer.appendChild(el);
    });

    // Fade-in animation for each node
    document.querySelectorAll('#nodes-layer .node').forEach(node => {
      gsap.fromTo(node, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: node, start: 'top 85%' }
      });
    });
  }

  buildRoad();
  renderNodes();
  window.addEventListener('resize', () => {
    buildRoad();
    renderNodes();
    ScrollTrigger.refresh();
  });

  /* -------------------------------------------------------
     4. SCROLL-DRIVEN PROGRESS
  ------------------------------------------------------- */
  const progressFill = document.getElementById('progress-fill');

  ScrollTrigger.create({
    trigger: tlWrap,
    start: 'top 70%',
    end: 'bottom 40%',
    scrub: 0.4,
    onUpdate(self) {
      const p = self.progress;
      pathEl.style.strokeDashoffset = pathLen * (1 - p);

      // Move traveler along the path
      const pt = pathEl.getPointAtLength(pathLen * p);
      const xPct = (pt.x / VB_W) * tlWrap.getBoundingClientRect().width;
      traveler.style.transform = `translate(${xPct}px, ${pt.y}px)`;

      // Update node states
      Array.from(nodesLayer.children).forEach((node, i) => {
        const nodeP = points[i].y / (TOP_PAD + (points.length - 1) * SECTION_H);
        node.classList.remove('state-upcoming', 'state-current', 'state-completed');
        if (p > nodeP + 0.03) node.classList.add('state-completed');
        else if (p > nodeP - 0.06) node.classList.add('state-current');
        else node.classList.add('state-upcoming');
      });
    }
  });

  // Global progress rail (full page scroll)
  if (progressFill) {
    window.addEventListener('scroll', () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progressFill.style.height = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    }, { passive: true });
  }

  // Hero parallax fade
  const timeHero = timelineSection.querySelector('.time-hero');
  if (timeHero) {
    gsap.to(timeHero, {
      opacity: 0.15, ease: 'none',
      scrollTrigger: { trigger: timeHero, start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* -------------------------------------------------------
     5. MODAL
  ------------------------------------------------------- */
  // Create modal if it doesn't exist yet
  let overlay = document.getElementById('modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card" id="modal-card">
        <button class="modal-close" id="modal-close">&times;</button>
        <div class="modal-num" id="modal-num">01</div>
        <h3 class="modal-title" id="modal-title"></h3>
        <div class="modal-date" id="modal-date"></div>
        <p class="modal-desc" id="modal-desc"></p>
        <div class="modal-section"><h4>Schedule</h4><p id="modal-schedule"></p></div>
        <div class="modal-section"><h4>Resources</h4><p id="modal-resources"></p></div>
        <div class="modal-actions">
          <button class="modal-btn primary">Confirm Slot</button>
          <button class="modal-btn" id="modal-cancel">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function openModal(i) {
    const cp = CHECKPOINTS[i];
    document.getElementById('modal-num').textContent = String(i + 1).padStart(2, '00');
    document.getElementById('modal-title').textContent = cp.title;
    document.getElementById('modal-date').textContent = cp.date;
    document.getElementById('modal-desc').textContent = cp.desc;
    document.getElementById('modal-schedule').textContent = cp.schedule;
    document.getElementById('modal-resources').textContent = cp.resources;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  /* -------------------------------------------------------
     6. FOOTER CTA — scroll to first checkpoint
  ------------------------------------------------------- */
  document.getElementById('cta-btn')?.addEventListener('click', () => {
    tlWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

})();
