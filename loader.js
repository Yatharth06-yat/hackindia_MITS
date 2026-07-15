/* =========================================================
   HackIndia 2026 — Cinematic Laptop Loader
   Requires: GSAP (core), Three.js — both loaded before this file.
   Exposes: window.HackIndiaLoader.play() for manual retrigger.
   ========================================================= */
(function () {
  'use strict';

  var ROOT_ID = 'hackindia-loader';
  var SESSION_KEY = 'hi_loader_seen';
  var root = document.getElementById(ROOT_ID);
  if (!root) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var skipEntirely = false;
  try { skipEntirely = sessionStorage.getItem(SESSION_KEY) === '1'; } catch (e) { }

  var siteContent = document.querySelector('[data-hi-site]') || document.body;

  var els = {
    laptop: document.getElementById('hiLaptop'),
    lid: document.getElementById('hiLid'),
    keyboard: document.getElementById('hiKeyboard'),
    powerBtn: document.getElementById('hiPowerBtn'),
    display: document.getElementById('hiDisplay'),
    boot: document.getElementById('hiBoot'),
    bootLogo: document.querySelector('.hi-boot-logo'),
    terminal: document.getElementById('hiTerminal'),
    progressFill: document.getElementById('hiProgressFill'),
    progressPct: document.getElementById('hiProgressPct'),
    progressWrap: document.querySelector('.hi-progress'),
    welcome: document.getElementById('hiWelcome'),
    prompt: document.getElementById('hiPrompt'),
    scene: document.getElementById('hiScene'),
    binaryRain: document.getElementById('hiBinaryRain'),
    soundToggle: document.getElementById('hiSoundToggle'),
    skipBtn: document.getElementById('hiSkip'),
    canvas: document.getElementById('hi-particles') || document.getElementById('hiParticles')
  };

  /* ---------------- Keyboard keys ---------------- */
  (function buildKeys() {
    if (!els.keyboard) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 56; i++) {
      var key = document.createElement('div');
      key.className = 'hi-key';
      var glow = document.createElement('i');
      key.appendChild(glow);
      frag.appendChild(key);
    }
    els.keyboard.appendChild(frag);
  })();

  /* ---------------- Binary rain ---------------- */
  (function buildRain() {
    if (!els.binaryRain) return;
    var cols = 14;
    for (var c = 0; c < cols; c++) {
      var col = document.createElement('div');
      col.className = 'hi-col';
      col.style.animationDuration = (4 + Math.random() * 3).toFixed(2) + 's';
      col.style.animationDelay = (Math.random() * -4).toFixed(2) + 's';
      var rows = 18;
      var str = '';
      for (var r = 0; r < rows; r++) str += (Math.random() > 0.5 ? '1' : '0') + '<br>';
      col.innerHTML = str;
      els.binaryRain.appendChild(col);
    }
  })();

  /* ---------------- Terminal lines ---------------- */
  var BOOT_LINES = ['Initializing...', 'Loading Assets...', 'Connecting AI...', 'Preparing Experience...'];

  function typeLine(text, container, speed) {
    return new Promise(function (resolve) {
      var line = document.createElement('div');
      line.className = 'hi-line';
      container.appendChild(line);
      gsap.to(line, { opacity: 1, duration: 0.15 });
      var i = 0;
      var iv = setInterval(function () {
        line.textContent = text.slice(0, i + 1);
        i++;
        if (i >= text.length) {
          clearInterval(iv);
          setTimeout(resolve, 160);
        }
      }, speed || 26);
    });
  }

  async function runTerminal() {
    for (var i = 0; i < BOOT_LINES.length; i++) {
      await typeLine(BOOT_LINES[i], els.terminal, 22);
      if (i < BOOT_LINES.length - 1) {
        // fade the line up/out to make room, keep it lightweight
        var prev = els.terminal.children[i];
        if (prev) gsap.to(prev, { opacity: 0.35, duration: 0.4 });
      }
    }
  }

  /* ---------------- Audio (synthesized, no files) ---------------- */
  var Audio = (function () {
    var ctx = null, master = null, muted = true;
    function ensure() {
      if (ctx) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.32;
      master.connect(ctx.destination);
    }
    function tone(freq, dur, type, startGain, glideTo) {
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (glideTo) osc.frequency.linearRampToValueAtTime(glideTo, ctx.currentTime + dur);
      gain.gain.setValueAtTime(startGain || 0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.connect(gain).connect(master);
      osc.start();
      osc.stop(ctx.currentTime + dur + 0.05);
    }
    return {
      unlockAndPlayThunk: function () {
        ensure();
        if (ctx && ctx.state === 'suspended') ctx.resume();
        tone(90, 0.22, 'sine', 0.5, 55);
      },
      powerHum: function () { ensure(); tone(120, 0.9, 'triangle', 0.14, 420); },
      keyChirp: function () { ensure(); tone(1500, 0.08, 'sine', 0.05); },
      chime: function () {
        ensure();
        tone(660, 0.3, 'sine', 0.18);
        setTimeout(function () { tone(880, 0.4, 'sine', 0.16); }, 140);
      },
      setMuted: function (m) { muted = m; if (master) master.gain.value = m ? 0 : 0.32; },
      isMuted: function () { return muted; }
    };
  })();

  if (els.soundToggle) {
    els.soundToggle.addEventListener('click', function () {
      var next = !Audio.isMuted();
      Audio.setMuted(next);
      els.soundToggle.setAttribute('aria-pressed', String(!next));
      els.soundToggle.querySelector('.hi-sound-label') &&
        (els.soundToggle.querySelector('.hi-sound-label').textContent = next ? 'Sound off' : 'Sound on');
    });
  }

  /* ---------------- Three.js particle field ---------------- */
  (function initParticles() {
    if (!els.canvas || typeof THREE === 'undefined') return;
    var renderer, scene, camera, points, raf;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: els.canvas, alpha: true, antialias: true });
    } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 12;

    var COUNT = window.innerWidth < 700 ? 260 : 620;
    var positions = new Float32Array(COUNT * 3);
    for (var i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 34;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 24;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({ color: 0x8fd8ff, size: 0.045, transparent: true, opacity: 0.55 });
    points = new THREE.Points(geo, mat);
    scene.add(points);

    var clock = new THREE.Clock();
    function animate() {
      raf = requestAnimationFrame(animate);
      var t = clock.getElapsedTime();
      points.rotation.y = t * 0.015;
      points.rotation.x = Math.sin(t * 0.05) * 0.05;
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    root.addEventListener('hi:teardown', function () {
      cancelAnimationFrame(raf);
      renderer.dispose();
    });
  })();

  /* ---------------- Idle float loop ---------------- */
  var idleTween = null;
  function startIdle() {
    if (reduceMotion) return;
    idleTween = gsap.to(els.scene, {
      rotateY: '-=6', rotateZ: '+=1.2', y: -6,
      duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1
    });
  }
  startIdle();

  /* ---------------- Reveal / finish ---------------- */
  function finish() {
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) { }
    gsap.to(els.display, {
      scale: 1.18, duration: 0.9, ease: 'power2.in'
    });
    gsap.to(root, {
      opacity: 0, duration: 0.85, ease: 'power2.inOut', delay: 0.35,
      onComplete: function () {
        root.setAttribute('hidden', '');
        root.dispatchEvent(new Event('hi:teardown'));
        document.body.classList.remove('hi-lock-scroll');
        document.body.classList.add('hi-loaded');
      }
    });
    if (siteContent) {
      gsap.set(siteContent, { opacity: siteContent === document.body ? 1 : 0, pointerEvents: 'auto' });
      if (siteContent !== document.body) {
        gsap.to(siteContent, { opacity: 1, duration: 1.1, ease: 'power2.out', delay: 0.5 });
      }
    }
  }

  /* ---------------- Master timeline ---------------- */
  var played = false;
  function play() {
    if (played) return;
    played = true;
    if (idleTween) idleTween.kill();
    Audio.unlockAndPlayThunk();

    if (els.prompt) els.prompt.classList.add('hi-fade');
    els.laptop.setAttribute('aria-disabled', 'true');
    els.laptop.style.pointerEvents = 'none';

    if (reduceMotion) {
      // Simplified, motion-safe path: quick fade boot, no 3D hinge.
      var tlr = gsap.timeline({ onComplete: finish });
      tlr.to(els.boot, { opacity: 1, duration: 0.4 });
      tlr.call(function () { els.bootLogo && gsap.to(els.bootLogo, { opacity: 1, scale: 1, duration: 0.4 }); });
      tlr.call(runTerminal);
      tlr.to(els.progressWrap, { opacity: 1, duration: 0.3 }, '+=0.2');
      tlr.to(els.progressFill, { width: '100%', duration: 1.4, ease: 'power1.inOut' });
      tlr.to({ v: 0 }, {
        v: 100, duration: 1.4, onUpdate: function () { els.progressPct.textContent = Math.round(this.targets()[0].v) + '%'; }
      }, '<');
      tlr.to(els.welcome, { opacity: 1, duration: 0.4 }, '+=0.1');
      tlr.to({}, { duration: 0.5 });
      return;
    }

    if (els.skipBtn) els.skipBtn.classList.add('hi-visible');

    var tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onComplete: finish });

    // Camera lowers as lid rises
    tl.to(els.scene, { rotateX: 22, rotateZ: 0, scale: 1.06, y: -10, duration: 3.1, ease: 'power2.out' }, 0);

    // Hinge opens
    tl.to(els.lid, { rotateX: -112, duration: 2.5, ease: 'power3.out' }, 0.1);
    tl.add(function () { els.laptop.classList.add('hi-glow'); }, 0.3);

    // Keyboard + power button light up mid-hinge
    tl.add(function () {
      els.keyboard && els.keyboard.classList.add('hi-lit');
      els.powerBtn && els.powerBtn.classList.add('hi-on');
      Audio.powerHum();
    }, 1.1);

    // Screen power flash + gradient warm-up
    tl.add(function () { els.display.classList.add('hi-powered'); }, 1.7);
    tl.fromTo(els.display, { filter: 'brightness(0.2)' }, { filter: 'brightness(1)', duration: 1.0 }, 1.7);

    // Boot logo + binary rain
    tl.add(function () { els.binaryRain && els.binaryRain.classList.add('hi-visible'); }, 2.0);
    tl.to(els.boot, { opacity: 1, duration: 0.4 }, 2.15);
    tl.to(els.bootLogo, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.6)' }, 2.25);

    // Terminal + progress bar run together
    tl.add(function () { runTerminal(); }, 2.9);
    tl.to(els.progressWrap, { opacity: 1, duration: 0.3 }, 2.9);
    tl.to(els.progressFill, { width: '100%', duration: 2.6, ease: 'power1.inOut' }, 3.0);
    tl.to({ v: 0 }, {
      v: 100, duration: 2.6, ease: 'power1.inOut',
      onUpdate: function () { els.progressPct.textContent = Math.round(this.targets()[0].v) + '%'; }
    }, 3.0);

    // Welcome
    tl.add(function () { Audio.chime(); }, 5.6);
    tl.to(els.terminal, { opacity: 0, duration: 0.35 }, 5.6);
    tl.to(els.progressWrap, { opacity: 0, duration: 0.35 }, 5.6);
    tl.to(els.bootLogo, { opacity: 0, duration: 0.35 }, 5.6);
    tl.to(els.welcome, { opacity: 1, duration: 0.6 }, 5.8);
    tl.to({}, { duration: 0.7 }); // hold
  }

  /* ---------------- Wire up interactions ---------------- */
  function keyGlints() {
    if (!els.keyboard || reduceMotion) return;
    var keys = els.keyboard.querySelectorAll('.hi-key');
    keys.forEach(function (k) {
      k.addEventListener('pointerenter', function () { Audio.keyChirp(); }, { passive: true });
    });
  }
  keyGlints();

  if (els.laptop) {
    els.laptop.addEventListener('click', play);
    els.laptop.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); }
    });
  }
  if (els.prompt) els.prompt.addEventListener('click', play);
  if (els.skipBtn) {
    els.skipBtn.addEventListener('click', function () {
      if (!played) play();
      gsap.globalTimeline.getChildren().forEach(function (t) { t.progress(1); });
    });
  }

  document.body.classList.add('hi-lock-scroll');

  if (skipEntirely) {
    root.setAttribute('hidden', '');
    document.body.classList.remove('hi-lock-scroll');
    document.body.classList.add('hi-loaded');
    if (siteContent && siteContent !== document.body) gsap.set(siteContent, { opacity: 1 });
  }

  window.HackIndiaLoader = { play: play };
})();