/* ==========================================================
   YATHARTH GUPTA — HACKINDIA 2026 DEVELOPER PAGE — JS
   ========================================================== */

   (function () {
    "use strict";
  
    const $  = (s, ctx = document) => ctx.querySelector(s);
    const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  
    /* ---------------------------------------------------------
       LOADER
    --------------------------------------------------------- */
    const loader       = $("#loader");
    const loaderFill    = $("#loaderFill");
    const loaderPercent = $("#loaderPercent");
    const loaderParticlesWrap = $("#loaderParticles");
  
    for (let i = 0; i < 40; i++) {
      const p = document.createElement("span");
      p.style.left = Math.random() * 100 + "%";
      p.style.animationDuration = 3 + Math.random() * 4 + "s";
      p.style.animationDelay = Math.random() * 4 + "s";
      loaderParticlesWrap.appendChild(p);
    }
  
    let progress = 0;
    const loaderInterval = setInterval(() => {
      progress += Math.random() * 12 + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(loaderInterval);
        loaderFill.style.width = "100%";
        loaderPercent.textContent = "100%";
        setTimeout(() => {
          loader.classList.add("hide");
          document.body.style.overflow = "";
          startEntranceAnimations();
        }, 350);
      } else {
        loaderFill.style.width = progress + "%";
        loaderPercent.textContent = Math.floor(progress) + "%";
      }
    }, 160);
  
    /* ---------------------------------------------------------
       CUSTOM CURSOR
    --------------------------------------------------------- */
    const cursorDot  = $("#cursorDot");
    const cursorRing = $("#cursorRing");
    const spotlight  = $("#spotlight");
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
  
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      cursorDot.style.left = mx + "px";
      cursorDot.style.top  = my + "px";
      spotlight.style.opacity = "1";
      spotlight.style.left = mx + "px";
      spotlight.style.top  = my + "px";
    });
    window.addEventListener("mouseleave", () => { spotlight.style.opacity = "0"; });
  
    function animateCursorRing() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      cursorRing.style.left = rx + "px";
      cursorRing.style.top  = ry + "px";
      requestAnimationFrame(animateCursorRing);
    }
    animateCursorRing();
  
    $$("a, button, [data-magnetic], .skill-card, .project-card, .chip").forEach((el) => {
      el.addEventListener("mouseenter", () => cursorRing.classList.add("active"));
      el.addEventListener("mouseleave", () => cursorRing.classList.remove("active"));
    });
  
    /* ---------------------------------------------------------
       MAGNETIC BUTTONS
    --------------------------------------------------------- */
    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const relX = e.clientX - r.left - r.width / 2;
        const relY = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${relX * 0.25}px, ${relY * 0.35}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = "translate(0,0)"; });
    });
  
    /* ---------------------------------------------------------
       LENIS SMOOTH SCROLL
    --------------------------------------------------------- */
    let lenis;
    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
      if (window.gsap && window.ScrollTrigger) {
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
      }
    }
  
    /* ---------------------------------------------------------
       NAV SCROLL STATE
    --------------------------------------------------------- */
    const nav = $("#nav");
    window.addEventListener("scroll", () => {
      nav.classList.toggle("scrolled", window.scrollY > 40);
    });
  
    /* ---------------------------------------------------------
       TYPING ANIMATION
    --------------------------------------------------------- */
    const typingRoles = [
      "Full Stack Developer",
      "AI Engineer",
      "Frontend Developer",
      "IoT Developer",
      "Problem Solver",
      "Competitive Programmer"
    ];
    const typingEl = $("#typingText");
    let roleIdx = 0, charIdx = 0, deleting = false;
  
    function typeLoop() {
      const word = typingRoles[roleIdx];
      if (!deleting) {
        charIdx++;
        typingEl.textContent = word.slice(0, charIdx);
        if (charIdx === word.length) { deleting = true; setTimeout(typeLoop, 1400); return; }
      } else {
        charIdx--;
        typingEl.textContent = word.slice(0, charIdx);
        if (charIdx === 0) { deleting = false; roleIdx = (roleIdx + 1) % typingRoles.length; }
      }
      setTimeout(typeLoop, deleting ? 40 : 85);
    }
    typeLoop();
  
    /* ---------------------------------------------------------
       HERO BACKGROUND FX: binary rain + floating code
    --------------------------------------------------------- */
    const rainWrap = $("#binaryRain");
    for (let i = 0; i < 26; i++) {
      const s = document.createElement("span");
      s.textContent = Array.from({ length: 12 }, () => (Math.random() > 0.5 ? "1" : "0")).join("");
      s.style.left = Math.random() * 100 + "%";
      s.style.animationDuration = 6 + Math.random() * 8 + "s";
      s.style.animationDelay = Math.random() * -10 + "s";
      rainWrap.appendChild(s);
    }
    const codeSnippets = ["const ai = new Model();", "function build(){}", "npm run dev", "esp32.read(sensor)",
      "git commit -m 'ship'", "for(let i=0;i<n;i++)", "df.predict(X)", "class Solver{}", "<Component/>", "SELECT * FROM ideas"];
    const codeWrap = $("#floatingCode");
    codeSnippets.forEach((txt, i) => {
      const s = document.createElement("span");
      s.textContent = txt;
      s.style.left = (5 + Math.random() * 85) + "%";
      s.style.top  = (5 + Math.random() * 85) + "%";
      s.style.animationDelay = (i * 0.6) + "s";
      codeWrap.appendChild(s);
    });
  
    /* ---------------------------------------------------------
       SKILLS DATA -> RENDER
    --------------------------------------------------------- */
    const skillCategories = [
      { name: "Programming", items: ["C++", "JavaScript", "HTML", "CSS", "Python"] },
      { name: "Frontend", items: ["HTML5", "CSS3", "JavaScript", "Three.js", "GSAP", "Next.js"] },
      { name: "Backend", items: ["Node.js", "Express.js", "Firebase"] },
      { name: "Database", items: ["MongoDB", "Firebase Realtime Database"] },
      { name: "AI & ML", items: ["Machine Learning", "Artificial Intelligence", "Python", "Data Analysis"] },
      { name: "IoT", items: ["ESP32", "Arduino", "DHT11", "Rain Sensor", "Soil Moisture Sensor", "Relay Control", "Firebase IoT"] },
      { name: "Tools", items: ["Git", "GitHub", "VS Code", "Arduino IDE", "Figma"] }
    ];
    const skillsGrid = $("#skillsGrid");
    skillCategories.forEach((cat) => {
      const card = document.createElement("div");
      card.className = "skill-card glass";
      card.innerHTML = `
        <div class="skill-glow"></div>
        <span class="skill-cat">${cat.name}</span>
        <div class="skill-tags">${cat.items.map((i) => `<span>${i}</span>`).join("")}</div>
      `;
      skillsGrid.appendChild(card);
    });
  
    /* ---------------------------------------------------------
       TECH ORBIT ICONS
    --------------------------------------------------------- */
    const orbitTechs = ["HTML","CSS","JS","C++","PY","NODE","GIT","HUB","3JS","FIRE"];
    const orbitWrap = $("#orbitWrap");
    const radius = 230;
    orbitTechs.forEach((label, i) => {
      const angle = (i / orbitTechs.length) * Math.PI * 2;
      const el = document.createElement("div");
      el.className = "tech-icon";
      el.textContent = label;
      el.style.setProperty("--x", Math.cos(angle) * radius + "px");
      el.style.setProperty("--y", Math.sin(angle) * radius + "px");
      el.style.transform = `translate(calc(-50% + ${Math.cos(angle) * radius}px), calc(-50% + ${Math.sin(angle) * radius}px))`;
      orbitWrap.appendChild(el);
  
      // gentle continuous orbit via JS animation
      let t = angle;
      const speed = 0.0025 * (i % 2 === 0 ? 1 : -1);
      (function spin() {
        t += speed;
        const x = Math.cos(t) * radius;
        const y = Math.sin(t) * radius;
        el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        requestAnimationFrame(spin);
      })();
    });
  
    /* ---------------------------------------------------------
       GITHUB CONTRIBUTION GRAPH (generated pattern)
    --------------------------------------------------------- */
    const contribGraph = $("#contribGraph");
    const shades = ["rgba(255,255,255,0.05)", "rgba(6,182,212,0.25)", "rgba(6,182,212,0.5)", "rgba(0,245,255,0.75)", "rgba(0,245,255,1)"];
    for (let i = 0; i < 52 * 7; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      const weight = Math.random();
      const level = weight > 0.82 ? 4 : weight > 0.65 ? 3 : weight > 0.45 ? 2 : weight > 0.28 ? 1 : 0;
      cell.style.background = shades[level];
      if (level > 0) cell.style.boxShadow = `0 0 4px ${shades[level]}`;
      contribGraph.appendChild(cell);
    }
  
    /* ---------------------------------------------------------
       FOOTER STARS
    --------------------------------------------------------- */
    const footerStars = $("#footerStars");
    for (let i = 0; i < 60; i++) {
      const s = document.createElement("span");
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      s.style.animationDelay = Math.random() * 3 + "s";
      footerStars.appendChild(s);
    }
  
    /* ---------------------------------------------------------
       CONTACT FORM (client-side only)
    --------------------------------------------------------- */
    const form = $("#contactForm");
    const formNote = $("#formNote");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btnText = $("#sendBtnText");
      btnText.textContent = "Sending...";
      setTimeout(() => {
        btnText.textContent = "Send Message";
        formNote.textContent = "Message ready — thanks for reaching out! I'll get back to you soon.";
        form.reset();
      }, 900);
    });
  
    /* ---------------------------------------------------------
       ANIMATED COUNTERS
    --------------------------------------------------------- */
    function animateCounters() {
      $$("[data-count]").forEach((el) => {
        const target = parseInt(el.getAttribute("data-count"), 10);
        const suffix = el.getAttribute("data-suffix") || "";
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 1.6,
          ease: "power2.out",
          onUpdate: () => { el.textContent = Math.floor(obj.val) + suffix; },
          scrollTrigger: { trigger: el, start: "top 88%", once: true }
        });
      });
      $$("[data-static]").forEach((el) => {
        ScrollTrigger.create({
          trigger: el, start: "top 88%", once: true,
          onEnter: () => { el.textContent = el.getAttribute("data-static"); }
        });
      });
    }
  
    /* ---------------------------------------------------------
       TILT ON PROJECT CARDS
    --------------------------------------------------------- */
    $$(".project-card.tilt").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rotX = (py - 0.5) * -10;
        const rotY = (px - 0.5) * 10;
        card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(900px) rotateX(0) rotateY(0) translateY(0)";
      });
    });
  
    /* ---------------------------------------------------------
       HOLO STAGE — mouse reactive tilt
    --------------------------------------------------------- */
    const holoStage = $("#holoStage");
    if (holoStage) {
      window.addEventListener("mousemove", (e) => {
        const relX = (e.clientX / window.innerWidth - 0.5);
        const relY = (e.clientY / window.innerHeight - 0.5);
        holoStage.style.transform = `rotateY(${relX * 14}deg) rotateX(${-relY * 10}deg)`;
      });
    }
  
    /* ---------------------------------------------------------
       SCROLL REVEAL (GSAP)
    --------------------------------------------------------- */
    function initScrollReveal() {
      gsap.registerPlugin(ScrollTrigger);
  
      $$(".reveal-up").forEach((el) => {
        gsap.to(el, {
          opacity: 1, y: 0, duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%" }
        });
      });
  
      gsap.utils.toArray(".section-head").forEach((head) => {
        gsap.from(head, {
          opacity: 0, y: 40, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: head, start: "top 88%" }
        });
      });
  
      gsap.utils.toArray(".skill-card").forEach((card, i) => {
        gsap.from(card, {
          opacity: 0, y: 50, duration: 0.7, delay: (i % 4) * 0.06, ease: "power3.out",
          scrollTrigger: { trigger: card, start: "top 92%" }
        });
      });
  
      gsap.utils.toArray(".project-card").forEach((card, i) => {
        gsap.from(card, {
          opacity: 0, y: 60, rotateX: 8, duration: 0.9, delay: i * 0.1, ease: "power3.out",
          scrollTrigger: { trigger: card, start: "top 90%" }
        });
      });
  
      gsap.utils.toArray(".achv-card").forEach((card, i) => {
        gsap.from(card, {
          opacity: 0, y: 30, duration: 0.7, delay: i * 0.08, ease: "power3.out",
          scrollTrigger: { trigger: card, start: "top 92%" }
        });
      });
  
      gsap.utils.toArray(".chip").forEach((chip, i) => {
        gsap.to(chip, {
          opacity: 1, y: 0, duration: 0.6, delay: i * 0.05, ease: "power3.out",
          scrollTrigger: { trigger: chip, start: "top 95%" }
        });
      });
  
      gsap.from(".timeline-card", {
        opacity: 0, x: -40, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: ".timeline-card", start: "top 88%" }
      });
  
      gsap.from(".github-card", {
        opacity: 0, y: 40, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: ".github-card", start: "top 88%" }
      });
  
      gsap.from(".contact-form", {
        opacity: 0, y: 40, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: ".contact-form", start: "top 90%" }
      });
  
      animateCounters();
    }
  
    /* ---------------------------------------------------------
       ENTRANCE (after loader)
    --------------------------------------------------------- */
    function startEntranceAnimations() {
      if (window.gsap) {
        gsap.to(".hero-eyebrow", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.1 });
        gsap.to(".hero-title",   { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", delay: 0.22 });
        gsap.to(".hero-typing",  { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.34 });
        gsap.to(".hero-sub",     { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.46 });
        gsap.to(".hero-cta",     { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.58 });
        gsap.to(".hero-stats",   { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.7 });
        gsap.from(".holo-stage", { opacity: 0, scale: 0.85, duration: 1.2, ease: "power3.out", delay: 0.3 });
        initScrollReveal();
      }
    }
  
    document.body.style.overflow = "hidden";
  
    /* ---------------------------------------------------------
       THREE.JS PARTICLE / STAR BACKGROUND
    --------------------------------------------------------- */
    function initThreeBackground() {
      if (!window.THREE) return;
      const canvas = $("#bgCanvas");
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
  
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 60;
  
      const starCount = 900;
      const positions = new Float32Array(starCount * 3);
      const colorChoices = [
        new THREE.Color(0x00F5FF),
        new THREE.Color(0x8B5CF6),
        new THREE.Color(0x3B82F6),
        new THREE.Color(0xffffff)
      ];
      const colors = new Float32Array(starCount * 3);
  
      for (let i = 0; i < starCount; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 220;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 220;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 160;
        const c = colorChoices[Math.floor(Math.random() * colorChoices.length)];
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.PointsMaterial({
        size: 0.9, vertexColors: true, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
  
      let targetX = 0, targetY = 0;
      window.addEventListener("mousemove", (e) => {
        targetX = (e.clientX / window.innerWidth - 0.5) * 6;
        targetY = (e.clientY / window.innerHeight - 0.5) * 6;
      });
  
      window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
  
      function animate() {
        requestAnimationFrame(animate);
        points.rotation.y += 0.00035;
        points.rotation.x += 0.00012;
        camera.position.x += (targetX - camera.position.x) * 0.02;
        camera.position.y += (-targetY - camera.position.y) * 0.02;
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
      }
      animate();
    }
    initThreeBackground();
  
    /* ---------------------------------------------------------
       NEURAL NETWORK CANVAS (About section)
    --------------------------------------------------------- */
    function initNeuralNet() {
      const wrap = $("#neuralNet");
      if (!wrap) return;
      const canvas = document.createElement("canvas");
      wrap.appendChild(canvas);
      const ctx = canvas.getContext("2d");
      let w, h, nodes = [];
  
      function resize() {
        w = canvas.width = wrap.clientWidth;
        h = canvas.height = wrap.clientHeight;
      }
      resize();
      window.addEventListener("resize", resize);
  
      const layerCounts = [4, 6, 6, 3];
      layerCounts.forEach((count, li) => {
        for (let i = 0; i < count; i++) {
          nodes.push({
            x: (li / (layerCounts.length - 1)) * 0.8 + 0.1,
            y: (i / (count - 1 || 1)) * 0.8 + 0.1,
            layer: li,
            pulse: Math.random() * Math.PI * 2
          });
        }
      });
  
      function draw() {
        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < nodes.length; i++) {
          for (let j = 0; j < nodes.length; j++) {
            if (nodes[j].layer === nodes[i].layer + 1) {
              ctx.beginPath();
              ctx.moveTo(nodes[i].x * w, nodes[i].y * h);
              ctx.lineTo(nodes[j].x * w, nodes[j].y * h);
              ctx.strokeStyle = "rgba(0,245,255,0.10)";
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
        nodes.forEach((n) => {
          n.pulse += 0.02;
          const r = 3 + Math.sin(n.pulse) * 1.4;
          ctx.beginPath();
          ctx.arc(n.x * w, n.y * h, Math.max(r, 1.5), 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(n.x * w, n.y * h, 0, n.x * w, n.y * h, 8);
          grad.addColorStop(0, "rgba(0,245,255,0.9)");
          grad.addColorStop(1, "rgba(139,92,246,0)");
          ctx.fillStyle = grad;
          ctx.fill();
        });
        requestAnimationFrame(draw);
      }
      draw();
    }
    initNeuralNet();
  
    /* ---------------------------------------------------------
       FOOTER WAVE CANVAS
    --------------------------------------------------------- */
    function initFooterWave() {
      const canvas = $("#waveCanvas");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      let w, h;
      function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        w = canvas.width = rect.width;
        h = canvas.height = rect.height;
      }
      resize();
      window.addEventListener("resize", resize);
  
      let t = 0;
      function draw() {
        t += 0.012;
        ctx.clearRect(0, 0, w, h);
        const layers = [
          { amp: 18, freq: 0.012, speed: 1, color: "rgba(124,58,237,0.18)", offset: h * 0.6 },
          { amp: 24, freq: 0.009, speed: 1.4, color: "rgba(6,182,212,0.16)", offset: h * 0.7 },
          { amp: 14, freq: 0.016, speed: 0.7, color: "rgba(0,245,255,0.12)", offset: h * 0.8 }
        ];
        layers.forEach((layer) => {
          ctx.beginPath();
          ctx.moveTo(0, h);
          for (let x = 0; x <= w; x += 8) {
            const y = layer.offset + Math.sin(x * layer.freq + t * layer.speed) * layer.amp;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(w, h);
          ctx.closePath();
          ctx.fillStyle = layer.color;
          ctx.fill();
        });
        requestAnimationFrame(draw);
      }
      draw();
    }
    initFooterWave();
  
  })();