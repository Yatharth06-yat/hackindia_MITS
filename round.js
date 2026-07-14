/* ==========================================================================
   HackIndia 2026 — Competition Rounds
   round.js — 3D background, scroll choreography, micro-interactions
   ========================================================================== */
(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;



  /* ------------------------------------------------------------------ */
  /* Cursor glow                                                         */
  /* ------------------------------------------------------------------ */
  const glow = document.getElementById("cursor-glow");
  if (glow && !prefersReducedMotion) {
    let gx = window.innerWidth / 2,
      gy = window.innerHeight / 2,
      cx = gx,
      cy = gy;
    window.addEventListener("mousemove", (e) => {
      gx = e.clientX;
      gy = e.clientY;
    });
    (function loop() {
      cx += (gx - cx) * 0.15;
      cy += (gy - cy) * 0.15;
      glow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ------------------------------------------------------------------ */
  /* Three.js — ambient particle field background                       */
  /* ------------------------------------------------------------------ */
  function initWebGLBackground() {
    const canvas = document.getElementById("webgl-bg");
    if (!canvas || typeof THREE === "undefined") return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.z = 14;

    // Starfield / particle cloud
    const PARTICLE_COUNT = window.innerWidth < 760 ? 500 : 1400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colorChoices = [
      new THREE.Color(0x8b5cf6),
      new THREE.Color(0x00e5ff),
      new THREE.Color(0xffb84d),
    ];
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 6 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
      positions[i * 3 + 2] = radius * Math.cos(phi) - 6;

      const c = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Floating wireframe polyhedra — subtle 3D depth
    const shapes = [];
    const shapeGeos = [
      new THREE.IcosahedronGeometry(1.6, 0),
      new THREE.OctahedronGeometry(1.3, 0),
      new THREE.TorusGeometry(1.1, 0.32, 8, 24),
    ];
    const shapeColors = [0x8b5cf6, 0x00e5ff, 0xffb84d];

    shapeGeos.forEach((geo, i) => {
      const mat = new THREE.MeshBasicMaterial({
        color: shapeColors[i],
        wireframe: true,
        transparent: true,
        opacity: 0.22,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 8,
        -4 - Math.random() * 6
      );
      mesh.userData.spin = {
        x: (Math.random() - 0.5) * 0.002,
        y: (Math.random() - 0.5) * 0.003,
      };
      mesh.userData.floatOffset = Math.random() * Math.PI * 2;
      scene.add(mesh);
      shapes.push(mesh);
    });

    let mouseX = 0,
      mouseY = 0;
    window.addEventListener("mousemove", (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    let scrollFrac = 0;
    window.addEventListener(
      "scroll",
      () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        scrollFrac = max > 0 ? window.scrollY / max : 0;
      },
      { passive: true }
    );

    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      points.rotation.y = t * 0.02 + scrollFrac * 0.6;
      points.rotation.x = scrollFrac * 0.2;

      shapes.forEach((mesh) => {
        mesh.rotation.x += mesh.userData.spin.x * 16;
        mesh.rotation.y += mesh.userData.spin.y * 16;
        mesh.position.y += Math.sin(t * 0.5 + mesh.userData.floatOffset) * 0.002;
      });

      camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.03;
      camera.position.y += (-mouseY * 0.8 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, -4);

      renderer.render(scene, camera);
    }

    if (!prefersReducedMotion) {
      animate();
    } else {
      renderer.render(scene, camera);
    }

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Three.js — rotating trophy in hero                                  */
  /* ------------------------------------------------------------------ */
  function initTrophyCanvas() {
    const canvas = document.getElementById("trophy-canvas");
    if (!canvas || typeof THREE === "undefined") return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.4, 6);

    const key = new THREE.PointLight(0x00e5ff, 3, 20);
    key.position.set(3, 3, 4);
    scene.add(key);
    const rim = new THREE.PointLight(0x8b5cf6, 3, 20);
    rim.position.set(-3, -2, 3);
    scene.add(rim);
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    const group = new THREE.Group();
    scene.add(group);

    // Central gem — icosahedron core
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      metalness: 0.6,
      roughness: 0.15,
      emissive: 0x2a0f5c,
      emissiveIntensity: 0.5,
    });
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 0), coreMat);
    group.add(core);

    // Orbiting ring (cup base echo)
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x004a55,
      emissiveIntensity: 0.6,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.06, 12, 60), ringMat);
    ring.rotation.x = Math.PI / 2.4;
    group.add(ring);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.04, 12, 60), ringMat.clone());
    ring2.material.color.set(0xffb84d);
    ring2.material.emissive.set(0x5c3300);
    ring2.rotation.x = Math.PI / 1.9;
    ring2.rotation.y = 0.6;
    group.add(ring2);

    // Small orbiting shards
    const shardGeo = new THREE.OctahedronGeometry(0.14, 0);
    const shards = [];
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(
        shardGeo,
        new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0x00e5ff : 0x8b5cf6,
          emissive: i % 2 === 0 ? 0x004a55 : 0x2a0f5c,
          emissiveIntensity: 0.7,
          metalness: 0.5,
          roughness: 0.25,
        })
      );
      const a = (i / 10) * Math.PI * 2;
      m.userData.angle = a;
      m.userData.radius = 2.9 + Math.random() * 0.4;
      m.userData.speed = 0.3 + Math.random() * 0.2;
      m.userData.yOff = (Math.random() - 0.5) * 1.4;
      group.add(m);
      shards.push(m);
    }

    function resize() {
      const size = canvas.clientWidth || canvas.parentElement.clientWidth;
      renderer.setSize(size, size, false);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    let mouseX = 0,
      mouseY = 0;
    window.addEventListener("mousemove", (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      core.rotation.x = t * 0.25;
      core.rotation.y = t * 0.35;

      group.rotation.y += (mouseX * 0.4 - group.rotation.y) * 0.04;
      group.rotation.x += (-mouseY * 0.25 - group.rotation.x) * 0.04;

      ring.rotation.z = t * 0.2;
      ring2.rotation.z = -t * 0.15;

      shards.forEach((m) => {
        const a = m.userData.angle + t * m.userData.speed;
        m.position.set(
          Math.cos(a) * m.userData.radius,
          m.userData.yOff + Math.sin(t + m.userData.angle) * 0.15,
          Math.sin(a) * m.userData.radius
        );
        m.rotation.x += 0.02;
        m.rotation.y += 0.03;
      });

      renderer.render(scene, camera);
    }

    if (!prefersReducedMotion) {
      animate();
    } else {
      renderer.render(scene, camera);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Scroll reveals + timeline spine fill (GSAP if present, else IO)     */
  /* ------------------------------------------------------------------ */
  function initScrollChoreography() {
    const reveals = document.querySelectorAll(".reveal");
    const spineFill = document.getElementById("spineFill");
    const timeline = document.querySelector(".timeline");
    const cards = document.querySelectorAll(".round-card");

    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);

      reveals.forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
          },
        });
      });

      if (spineFill && timeline) {
        gsap.to(spineFill, {
          height: "100%",
          ease: "none",
          scrollTrigger: {
            trigger: timeline,
            start: "top 60%",
            end: "bottom 70%",
            scrub: 0.6,
          },
        });
      }

      cards.forEach((card) => {
        ScrollTrigger.create({
          trigger: card,
          start: "top 75%",
          onEnter: () => card.classList.add("in-view"),
        });
      });
    } else {
      // Fallback: IntersectionObserver
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in");
              if (entry.target.classList.contains("round-card")) {
                entry.target.classList.add("in-view");
              }
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2 }
      );
      reveals.forEach((el) => io.observe(el));
      cards.forEach((el) => io.observe(el));

      if (spineFill && timeline) {
        window.addEventListener(
          "scroll",
          () => {
            const rect = timeline.getBoundingClientRect();
            const vh = window.innerHeight;
            const total = rect.height;
            const seen = Math.min(Math.max(vh * 0.6 - rect.top, 0), total);
            spineFill.style.height = `${(seen / total) * 100}%`;
          },
          { passive: true }
        );
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* 3D tilt on round cards                                              */
  /* ------------------------------------------------------------------ */
  function initTilt() {
    if (prefersReducedMotion) return;
    const cards = document.querySelectorAll("[data-tilt]");
    cards.forEach((card) => {
      let rect;
      card.addEventListener("mouseenter", () => {
        rect = card.getBoundingClientRect();
      });
      card.addEventListener("mousemove", (e) => {
        if (!rect) rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        const rx = (-py * 6).toFixed(2);
        const ry = (px * 8).toFixed(2);
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)";
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Magnetic button                                                     */
  /* ------------------------------------------------------------------ */
  function initMagneticButton() {
    const btn = document.getElementById("registerBtn");
    if (!btn || prefersReducedMotion) return;
    const strength = 22;
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${(x / rect.width) * strength}px, ${
        (y / rect.height) * strength
      }px)`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "translate(0,0)";
    });
    btn.addEventListener("click", () => {
      burstConfetti();
      const target = document.querySelector("#register");
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Confetti burst on finale canvas                                     */
  /* ------------------------------------------------------------------ */
  let confettiCtx, confettiCanvas, confettiParticles = [];

  function setupConfettiCanvas() {
    confettiCanvas = document.getElementById("confetti-canvas");
    if (!confettiCanvas) return;
    confettiCtx = confettiCanvas.getContext("2d");

    function resize() {
      const parent = confettiCanvas.parentElement;
      confettiCanvas.width = parent.clientWidth;
      confettiCanvas.height = parent.clientHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function loop() {
      requestAnimationFrame(loop);
      if (!confettiCtx) return;
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      confettiParticles.forEach((p) => {
        p.vy += 0.12;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 1;
        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate(p.rot);
        confettiCtx.globalAlpha = Math.max(p.life / p.maxLife, 0);
        confettiCtx.fillStyle = p.color;
        confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
        confettiCtx.restore();
      });
      confettiParticles = confettiParticles.filter((p) => p.life > 0 && p.y < confettiCanvas.height + 40);
    }
    loop();
  }

  function burstConfetti() {
    if (!confettiCanvas) return;
    const colors = ["#8b5cf6", "#00e5ff", "#ffb84d", "#7dffb0", "#ffffff"];
    const cx = confettiCanvas.width / 2;
    const cy = confettiCanvas.height * 0.35;
    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      confettiParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        size: 6 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 90 + Math.random() * 40,
        maxLife: 130,
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Footer starfield                                                     */
  /* ------------------------------------------------------------------ */
  function initFooterStars() {
    const canvas = document.getElementById("stars-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let stars = [];

    function build() {
      const panel = canvas.closest(".footer-panel");
      const w = panel.clientWidth;
      const h = panel.clientHeight;
      canvas.width = w;
      canvas.height = h;
      const count = Math.round((w * h) / 4500);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.3 + 0.2,
        baseAlpha: Math.random() * 0.6 + 0.2,
        speed: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2,
      }));
    }
    build();
    window.addEventListener("resize", build);

    function draw(t) {
      requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        const twinkle = Math.sin(t * s.speed + s.phase) * 0.5 + 0.5;
        ctx.globalAlpha = s.baseAlpha * twinkle;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    if (!prefersReducedMotion) {
      requestAnimationFrame(draw);
    } else {
      draw(0);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Subscribe form                                                       */
  /* ------------------------------------------------------------------ */
  function initSubscribeForm() {
    const form = document.querySelector(".subscribe-form");
    if (!form) return;
    const note = form.parentElement.querySelector(".subscribe-note");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input[type='email']");
      const valid = input && input.checkValidity() && input.value.trim() !== "";
      if (!note) return;
      if (valid) {
        note.textContent = `Thanks — we'll send updates to ${input.value.trim()}.`;
        note.classList.add("success");
        form.reset();
      } else {
        note.textContent = "Enter a valid email to join the list.";
        note.classList.remove("success");
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Init                                                                 */
  /* ------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", () => {
    initWebGLBackground();
    initTrophyCanvas();
    initScrollChoreography();
    initTilt();
    setupConfettiCanvas();
    initMagneticButton();
    initFooterStars();
    initSubscribeForm();
  });
})();