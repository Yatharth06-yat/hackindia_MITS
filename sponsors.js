/* ============================================================
   HACKINDIA 2026 — SPONSORS SECTION
   sponsors.js — Three.js background, GSAP motion, card physics
   ============================================================ */

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   0. SPONSOR DATA
   ============================================================ */
const SPONSORS = [
  {
    name: "Interview Buddy", cat: "Carrier & AI", level: "Platinum Partner", tech: "Azure AI Platform",
    desc: "Helping HackIndia participants sharpen their interview skills through AI-powered mock interviews, expert feedback, and career preparation resources for internships and full-time opportunities.", url: "https://www.interviewbuddy.net"
  },
  //  ts and MVPs with hosting credits on simple, developer-friendly infrastructure.", url: "https://digitalocean.com" },
];

/* a small rotating set of geometric glyph paths so every card feels bespoke,
   without reproducing any brand's actual logo mark */
const GLYPHS = [
  '<path d="M4 4h7v7H4z"/><path d="M13 4h7v7h-7z"/><path d="M4 13h7v7H4z"/><path d="M13 13h7v7h-7z"/>',
  '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16"/>',
  '<path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
  '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9 9h6v6H9z"/>',
  '<path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="9"/>',
  '<path d="M3 12a9 9 0 1 0 9-9"/><path d="M12 7v5l4 2"/>',
  '<path d="M4 20 12 4l8 16H4Z"/>',
  '<path d="M5 3h14l-3 9 3 9H5l3-9-3-9Z"/>',
  '<circle cx="8" cy="8" r="4"/><circle cx="16" cy="16" r="4"/>',
  '<path d="M2 12h6l2-8 4 16 2-8h6"/>',
  '<rect x="4" y="4" width="16" height="16" rx="8"/>',
  '<path d="M12 3 3 21h18L12 3Z"/><path d="M9 15h6"/>',
];

/* ============================================================
   1. THREE.JS SPACE BACKGROUND
   ============================================================ */
class SpaceScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    this.scroll = 0;
    this.clock = new THREE.Clock();

    this._initCore();
    this._buildStarfield();
    this._buildDust();
    this._buildNebula();
    this._buildAurora();
    this._buildShootingStars();
    this._bindEvents();
    this._tick();
  }

  _initCore() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x030310, 0.00028);

    this.camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 4000);
    this.camera.position.set(0, 0, 620);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // bloom post-processing for glowing highlights
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.85, 0.6, 0.15);
    this.composer.addPass(this.bloom);
  }

  /* thousands of stars, layered at different depths for parallax */
  _buildStarfield() {
    this.starLayers = [];
    const layerConfigs = [
      { count: 3200, spread: 2600, size: 1.4, color: 0xbfb2ff },
      { count: 1800, spread: 1800, size: 2.0, color: 0x8fd3ff },
      { count: 900, spread: 1200, size: 2.8, color: 0xffffff },
    ];

    layerConfigs.forEach((cfg) => {
      const positions = new Float32Array(cfg.count * 3);
      for (let i = 0; i < cfg.count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * cfg.spread;
        positions[i * 3 + 1] = (Math.random() - 0.5) * cfg.spread;
        positions[i * 3 + 2] = (Math.random() - 0.5) * cfg.spread - 200;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.PointsMaterial({
        size: cfg.size,
        color: cfg.color,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geo, mat);
      this.scene.add(points);
      this.starLayers.push(points);
    });
  }

  /* fine space dust drifting close to camera */
  _buildDust() {
    const count = 500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 900;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 900;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 600 + 100;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      size: 1.1,
      color: 0xa78bfa,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.dust = new THREE.Points(geo, mat);
    this.scene.add(this.dust);
  }

  /* soft nebula clouds made from radial-gradient sprite textures */
  _buildNebula() {
    const makeCloudTexture = (colorA, colorB) => {
      const size = 256;
      const cvs = document.createElement("canvas");
      cvs.width = cvs.height = size;
      const ctx = cvs.getContext("2d");
      const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, colorA);
      grad.addColorStop(0.5, colorB);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(cvs);
    };

    const texPurple = makeCloudTexture("rgba(139,92,246,0.55)", "rgba(76,29,149,0.18)");
    const texBlue = makeCloudTexture("rgba(59,130,246,0.5)", "rgba(29,78,216,0.15)");

    this.nebulae = [];
    const placements = [
      { tex: texPurple, pos: [-500, 180, -900], scale: 1400 },
      { tex: texBlue, pos: [520, -160, -1100], scale: 1600 },
      { tex: texPurple, pos: [0, 400, -1400], scale: 1800 },
    ];

    placements.forEach((p) => {
      const mat = new THREE.SpriteMaterial({
        map: p.tex,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(...p.pos);
      sprite.scale.set(p.scale, p.scale, 1);
      this.scene.add(sprite);
      this.nebulae.push(sprite);
    });
  }

  /* animated purple/blue aurora ribbon using a custom shader plane */
  _buildAurora() {
    const geo = new THREE.PlaneGeometry(2600, 700, 120, 1);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color(0x8b5cf6) },
        uColorB: { value: new THREE.Color(0x3b82f6) },
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main(){
          vUv = uv;
          vec3 pos = position;
          float wave = sin(pos.x * 0.01 + uTime * 0.6) * 26.0;
          wave += sin(pos.x * 0.02 - uTime * 0.4) * 14.0;
          pos.y += wave;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform float uTime;
        varying vec2 vUv;
        void main(){
          float mixAmt = sin(vUv.x * 6.0 + uTime * 0.5) * 0.5 + 0.5;
          vec3 color = mix(uColorA, uColorB, mixAmt);
          float alpha = smoothstep(0.0, 0.5, vUv.y) * smoothstep(1.0, 0.5, vUv.y) * 0.35;
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
    this.aurora = new THREE.Mesh(geo, mat);
    this.aurora.position.set(0, -260, -800);
    this.aurora.rotation.x = -0.15;
    this.scene.add(this.aurora);
  }

  /* occasional shooting stars streaking across the scene */
  _buildShootingStars() {
    this.shootingStars = [];
    this.nextShootAt = performance.now() + 1800;
  }

  _spawnShootingStar() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array([0, 0, 0, -60, -18, 0]);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
    });
    const line = new THREE.Line(geo, mat);

    line.position.set(
      (Math.random() - 0.5) * 1400,
      Math.random() * 400 + 100,
      -300 - Math.random() * 400
    );
    const angle = Math.PI * (0.15 + Math.random() * 0.1);
    line.rotation.z = angle;

    this.scene.add(line);
    this.shootingStars.push({
      mesh: line,
      vel: new THREE.Vector3(-Math.cos(angle) * 9, -Math.sin(angle) * 9, 0),
      life: 0,
      maxLife: 60 + Math.random() * 20,
    });
  }

  _bindEvents() {
    addEventListener("resize", () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
      this.composer.setSize(innerWidth, innerHeight);
    });

    addEventListener("mousemove", (e) => {
      this.mouse.tx = (e.clientX / innerWidth - 0.5) * 2;
      this.mouse.ty = (e.clientY / innerHeight - 0.5) * 2;
    });

    // pause heavy background work when the section scrolls out of view
    this.visible = true;
    const observer = new IntersectionObserver(
      (entries) => { this.visible = entries[0].isIntersecting; },
      { threshold: 0.05 }
    );
    const target = document.getElementById("sponsors");
    if (target) observer.observe(target);
  }

  /* called from ScrollTrigger to let the background react to scroll depth */
  setScroll(progress) {
    this.scroll = progress;
  }

  _tick() {
    requestAnimationFrame(() => this._tick());
    if (!this.visible) return;

    const dt = this.clock.getDelta();
    const t = this.clock.elapsedTime;

    // smooth mouse parallax
    this.mouse.x += (this.mouse.tx - this.mouse.x) * 0.04;
    this.mouse.y += (this.mouse.ty - this.mouse.y) * 0.04;
    this.camera.position.x = this.mouse.x * 40;
    this.camera.position.y = -this.mouse.y * 30 - this.scroll * 60;
    this.camera.rotation.y = this.mouse.x * 0.05;
    this.camera.rotation.x = -this.mouse.y * 0.03;
    this.camera.lookAt(0, -this.scroll * 60, 0);

    // slow star rotation (galaxy-drift feel), each layer at a different speed
    this.starLayers.forEach((layer, i) => {
      layer.rotation.y += dt * (0.004 + i * 0.002);
      layer.rotation.x += dt * 0.001;
    });

    this.dust.rotation.y -= dt * 0.01;
    this.dust.position.y = Math.sin(t * 0.15) * 8;

    this.nebulae.forEach((n, i) => {
      n.material.rotation += dt * (0.02 + i * 0.01);
      n.position.x += Math.sin(t * 0.05 + i) * 0.05;
    });

    this.aurora.material.uniforms.uTime.value = t;

    // shooting stars
    if (performance.now() > this.nextShootAt) {
      this._spawnShootingStar();
      this.nextShootAt = performance.now() + 2500 + Math.random() * 4000;
    }
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const s = this.shootingStars[i];
      s.mesh.position.add(s.vel);
      s.life++;
      s.mesh.material.opacity = 1 - s.life / s.maxLife;
      if (s.life >= s.maxLife) {
        this.scene.remove(s.mesh);
        s.mesh.geometry.dispose();
        s.mesh.material.dispose();
        this.shootingStars.splice(i, 1);
      }
    }

    this.composer.render();
  }
}

/* ============================================================
   2. CURSOR GLOW FOLLOWER
   ============================================================ */
function initCursorGlow() {
  const glow = document.getElementById("cursorGlow");
  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
  addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; });
  (function loop() {
    x += (tx - x) * 0.15;
    y += (ty - y) * 0.15;
    glow.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  })();
}

/* ============================================================
   3. HEADLINE — LETTER BY LETTER REVEAL
   ============================================================ */
function buildHeadline() {
  const el = document.getElementById("headline");
  const text = "SPONSORS";
  el.innerHTML = text
    .split("")
    .map((ch) => `<span class="char">${ch}</span>`)
    .join("");

  gsap.to(el.querySelectorAll(".char"), {
    y: 0,
    rotateX: 0,
    opacity: 1,
    duration: 1.1,
    ease: "power4.out",
    stagger: 0.045,
    delay: 0.2,
  });
}

/* ============================================================
   4. SPONSOR CARDS — build DOM
   ============================================================ */
function buildCards() {
  const grid = document.getElementById("sponsorGrid");
  const frag = document.createDocumentFragment();

  SPONSORS.forEach((s, i) => {
    const card = document.createElement("article");
    card.className = "card";
    card.style.setProperty("--float-delay", `${(i % 6) * 0.4}s`);
    card.dataset.index = i;

    card.innerHTML = `
      <div class="card__inner">
        <div class="card__glyph"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[i % GLYPHS.length]}</svg></div>
        <div class="card__mark">${s.name}</div>
        <div class="card__cat">${s.cat}</div>
      </div>
      <div class="card__border"></div>
      <div class="card__light"></div>
      <div class="card__shine"></div>
    `;
    frag.appendChild(card);
  });

  grid.appendChild(frag);
  return Array.from(grid.querySelectorAll(".card"));
}

/* ============================================================
   5. CARD 3D TILT + MOUSE-TRACKING LIGHT + SPARK PARTICLES
   ============================================================ */
function initCardInteractions(cards) {
  cards.forEach((card) => {
    const inner = card.querySelector(".card__inner");
    let rect = null;

    const onEnter = () => {
      rect = card.getBoundingClientRect();
      spawnSparks(card, 6);
    };

    const onMove = (e) => {
      if (!rect) rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      const rotateY = (px - 0.5) * 18;
      const rotateX = -(py - 0.5) * 18;

      gsap.to(card, {
        rotateX,
        rotateY,
        translateY: -10,
        translateZ: 20,
        duration: 0.5,
        ease: "power2.out",
      });

      card.style.setProperty("--mx", `${px * 100}%`);
      card.style.setProperty("--my", `${py * 100}%`);
    };

    const onLeave = () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        translateY: 0,
        translateZ: 0,
        duration: 0.7,
        ease: "elastic.out(1, 0.6)",
      });
      rect = null;
    };

    card.addEventListener("mouseenter", onEnter);
    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", onLeave);
    card.addEventListener("click", () => openModal(SPONSORS[card.dataset.index]));
  });
}

/* small glowing spark particles that burst around a card on hover */
function spawnSparks(card, count = 6) {
  const rect = card.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    const spark = document.createElement("div");
    spark.className = "spark";
    document.body.appendChild(spark);

    const startX = rect.left + Math.random() * rect.width;
    const startY = rect.top + rect.height * (0.6 + Math.random() * 0.4);
    spark.style.left = `${startX}px`;
    spark.style.top = `${startY}px`;

    gsap.to(spark, {
      y: -40 - Math.random() * 40,
      x: (Math.random() - 0.5) * 60,
      opacity: 0,
      duration: 1 + Math.random() * 0.6,
      ease: "power1.out",
      onComplete: () => spark.remove(),
    });
  }
}

/* ============================================================
   6. MAGNETIC BUTTON + RIPPLE
   ============================================================ */
function initMagneticButton() {
  const btn = document.getElementById("viewAllBtn");
  const strength = 0.4;

  btn.addEventListener("mousemove", (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(btn, { x: x * strength, y: y * strength, duration: 0.4, ease: "power2.out" });
  });

  btn.addEventListener("mouseleave", () => {
    gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
  });

  btn.addEventListener("click", (e) => {
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });
}

/* ============================================================
   7. SPONSOR DETAIL MODAL
   ============================================================ */
function openModal(sponsor) {
  const modal = document.getElementById("sponsorModal");
  document.getElementById("modalMark").textContent = sponsor.name.slice(0, 2).toUpperCase();
  document.getElementById("modalTier").textContent = sponsor.tech;
  document.getElementById("modalName").textContent = sponsor.name;
  document.getElementById("modalDesc").textContent = sponsor.desc;
  document.getElementById("modalCategory").textContent = sponsor.cat;
  document.getElementById("modalLevel").textContent = sponsor.level;
  document.getElementById("modalLink").href = sponsor.url;

  modal.classList.add("is-open");
  gsap.to("#modalBackdrop", { opacity: 1, duration: 0.35, ease: "power2.out" });
  gsap.to("#modalPanel", { scale: 1, y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.6)" });
}

function closeModal() {
  gsap.to("#modalBackdrop", { opacity: 0, duration: 0.3 });
  gsap.to("#modalPanel", {
    scale: 0.85, y: 30, opacity: 0, duration: 0.35, ease: "power2.in",
    onComplete: () => document.getElementById("sponsorModal").classList.remove("is-open"),
  });
}

function initModal() {
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalBackdrop").addEventListener("click", closeModal);
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

/* ============================================================
   8. SCROLL ANIMATIONS — GSAP + ScrollTrigger
   ============================================================ */
function initScrollAnimations(cards, spaceScene) {
  // simple fade/slide reveal for eyebrow, subtitle, CTA
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 24 },
      {
        opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      }
    );
  });

  // cards: scale + rotation + blur + opacity + slight parallax stagger
  cards.forEach((card, i) => {
    gsap.fromTo(
      card,
      { opacity: 0, scale: 0.8, rotateX: 30, y: 60, filter: "blur(14px)" },
      {
        opacity: 1, scale: 1, rotateX: 0, y: 0, filter: "blur(0px)",
        duration: 1,
        ease: "power3.out",
        delay: (i % 4) * 0.06,
        scrollTrigger: { trigger: card, start: "top 92%" },
      }
    );

    // subtle continuous parallax while scrolling past
    gsap.to(card, {
      y: -18,
      ease: "none",
      scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: 1 },
    });
  });

  // let the Three.js scene react to how far the visitor has scrolled the section
  ScrollTrigger.create({
    trigger: "#sponsors",
    start: "top bottom",
    end: "bottom top",
    scrub: true,
    onUpdate: (self) => spaceScene.setScroll(self.progress),
  });
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const space = new SpaceScene(document.getElementById("bg-canvas"));
  initCursorGlow();
  buildHeadline();

  const cards = buildCards();
  initCardInteractions(cards);
  initMagneticButton();
  initModal();
  initScrollAnimations(cards, space);

  document.getElementById("viewAllBtn").addEventListener("click", () => {
    // placeholder action — hook up to a full sponsors directory page
    console.log("View all sponsors clicked");
  });
});
