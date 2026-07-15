/* ============================================================
   HackIndia — The Journey
   3D wormhole backdrop (Three.js) + scroll-driven energy road
   (hand-built SVG spline, GSAP ScrollTrigger) + checkpoint modal.
   ============================================================ */

(function () {
  'use strict';

  var MOTION = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- checkpoint data (drives road + modal) ---------------- */

  var CHECKPOINTS = [
    {
      title: 'Registrations Open',
      date: 'Jul 13',
      desc: 'Team registrations will remain open throughout this period. Teams must consist of 3–4 members.',
      schedule: '13 July 2026 – 23 August 2026',
      resources: 'Team registration portal, rulebook, hackathon brochure.'
    },
    {
      title: 'Round 1: Idea Submission',
      date: 'Aug 01',
      desc: 'Registered teams must submit: Problem Statement & Solution PPT, a 1–2 minute video explaining the idea, GitHub repository link, LinkedIn profile of the Team Leader, and any additional relevant links (portfolio, pre-demo, etc.).',
      schedule: '1 August 2026 – 25 August 2026 (Extended Deadline)',
      resources: 'Submission portal, PPT template, judging rubric.'
    },
    {
      title: 'Round 1 Evaluation & Shortlisting',
      date: 'Aug 25',
      desc: 'All submissions will be evaluated by the panel based on innovation, feasibility, impact, technical approach, and presentation. Shortlisted teams will qualify for the Offline Grand Finale.',
      schedule: '25 August 2026 – 27 August 2026',
      resources: 'Evaluation criteria document, shortlist announcement channel.'
    },
    {
      title: 'Offline Participation Fee Window',
      date: 'Aug 27',
      desc: 'Shortlisted teams must confirm their participation by paying the Offline Hackathon Registration Fee of ₹1,100 per team. Only teams completing the payment within the specified window will be eligible to participate in the offline finale.',
      schedule: '27 August 2026 – 2 September 2026',
      resources: 'Payment portal, confirmation receipt, participation guidelines.'
    },
    {
      title: 'Round 2: Offline Hackathon Finale',
      date: 'Sep 05',
      desc: 'The shortlisted teams will compete in a 24-hour offline hackathon at MITS-DU Gwalior, where they will build, refine, and present their solutions before an esteemed panel of judges. The event will feature mentoring sessions, networking opportunities, evaluation rounds, and the final prize distribution ceremony.',
      schedule: '5 September 2026 – 6 September 2026',
      resources: 'Venue details, schedule booklet, mentor directory, prize structure.'
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