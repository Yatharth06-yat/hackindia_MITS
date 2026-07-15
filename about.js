/* ================= 3D HACKATHON TRACK CONSTELLATION ================= */
/* Requires a <canvas id="hackathon-canvas"></canvas> inside .about-hackathon.
   If it isn't in the HTML yet, this script creates and inserts one automatically. */

const hackathonSection = document.querySelector('.about-hackathon');

if (hackathonSection && typeof THREE !== 'undefined') {

  // Ensure the canvas exists — create it if the HTML hasn't been updated yet
  let hackCanvas = document.getElementById('hackathon-canvas');
  if (!hackCanvas) {
    hackCanvas = document.createElement('canvas');
    hackCanvas.id = 'hackathon-canvas';
    hackCanvas.style.position = 'absolute';
    hackCanvas.style.inset = '0';
    hackCanvas.style.width = '100%';
    hackCanvas.style.height = '100%';
    hackCanvas.style.zIndex = '1';
    hackCanvas.style.pointerEvents = 'none';
    hackathonSection.insertBefore(hackCanvas, hackathonSection.firstChild);
  }

  const scene3 = new THREE.Scene();
  const camera3 = new THREE.PerspectiveCamera(
    50,
    hackathonSection.clientWidth / hackathonSection.clientHeight,
    0.1,
    1000
  );
  camera3.position.set(0, 0, 26);

  const renderer3 = new THREE.WebGLRenderer({ canvas: hackCanvas, alpha: true, antialias: true });
  renderer3.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer3.setSize(hackathonSection.clientWidth, hackathonSection.clientHeight);
  renderer3.setClearColor(0x000000, 0);

  /* ---------- Track nodes (AI = purple, Web3 = cyan, Open Innovation = pink) ---------- */
  const trackColors = [0x8a5bff, 0x4fd8ff, 0xff91d2];
  const nodeGroup = new THREE.Group();
  scene3.add(nodeGroup);

  const nodeRadius = 9;
  const nodes = [];

  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const x = Math.cos(angle) * nodeRadius;
    const y = Math.sin(angle) * nodeRadius * 0.55;
    const z = (Math.random() - 0.5) * 4;

    // Core glowing sphere
    const coreGeo = new THREE.SphereGeometry(0.55, 24, 24);
    const coreMat = new THREE.MeshBasicMaterial({
      color: trackColors[i],
      transparent: true,
      opacity: 0.9,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(x, y, z);
    nodeGroup.add(core);

    // Soft halo ring around each node
    const haloGeo = new THREE.RingGeometry(1.1, 1.35, 40);
    const haloMat = new THREE.MeshBasicMaterial({
      color: trackColors[i],
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(core.position);
    nodeGroup.add(halo);

    nodes.push({ core, halo, baseZ: z, phase: Math.random() * Math.PI * 2 });
  }

  // Connecting lines between the three track nodes (triangle constellation)
  const linePositions = new Float32Array([
    nodes[0].core.position.x, nodes[0].core.position.y, nodes[0].core.position.z,
    nodes[1].core.position.x, nodes[1].core.position.y, nodes[1].core.position.z,
    nodes[1].core.position.x, nodes[1].core.position.y, nodes[1].core.position.z,
    nodes[2].core.position.x, nodes[2].core.position.y, nodes[2].core.position.z,
    nodes[2].core.position.x, nodes[2].core.position.y, nodes[2].core.position.z,
    nodes[0].core.position.x, nodes[0].core.position.y, nodes[0].core.position.z,
  ]);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x9a8cff,
    transparent: true,
    opacity: 0.25,
  });
  const constellationLines = new THREE.LineSegments(lineGeo, lineMat);
  nodeGroup.add(constellationLines);

  /* ---------- Ambient drifting dust ---------- */
  const DUST_COUNT = 180;
  const dustGeo = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(DUST_COUNT * 3);
  const dustSpeeds = new Float32Array(DUST_COUNT);

  for (let i = 0; i < DUST_COUNT; i++) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 55;
    dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 34;
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 18;
    dustSpeeds[i] = 0.1 + Math.random() * 0.25;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

  const dustMat = new THREE.PointsMaterial({
    size: 0.18,
    color: 0x6fdcff,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene3.add(dust);

  /* ---------- Resize handling ---------- */
  function resizeHackathon() {
    const w = hackathonSection.clientWidth;
    const h = hackathonSection.clientHeight;
    camera3.aspect = w / h;
    camera3.updateProjectionMatrix();
    renderer3.setSize(w, h);
  }
  window.addEventListener('resize', resizeHackathon);

  /* ---------- Scroll-triggered fade/rotate intro ---------- */
  let hackVisible = false;
  const hackObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        hackVisible = entry.isIntersecting;
      });
    },
    { threshold: 0.1 }
  );
  hackObserver.observe(hackathonSection);

  const clock3 = new THREE.Clock();

  function animateHackathon() {
    requestAnimationFrame(animateHackathon);
    if (!hackVisible) return; // pause work when off-screen for performance

    const t = clock3.getElapsedTime();

    // Slow group rotation — the whole constellation drifts
    nodeGroup.rotation.y = Math.sin(t * 0.15) * 0.25;
    nodeGroup.rotation.z = t * 0.04;

    // Pulse each node core + halo independently
    nodes.forEach((n, i) => {
      const pulse = 0.85 + Math.sin(t * 1.4 + n.phase) * 0.15;
      n.core.scale.setScalar(pulse);
      n.halo.scale.setScalar(1 + Math.sin(t * 1.1 + n.phase) * 0.12);
      n.halo.material.opacity = 0.22 + Math.sin(t * 1.6 + n.phase) * 0.08;
      n.core.position.z = n.baseZ + Math.sin(t * 0.6 + n.phase) * 0.6;
    });

    constellationLines.material.opacity = 0.18 + Math.sin(t * 0.8) * 0.08;

    // Drift dust upward, wrap around
    const posAttr = dustGeo.attributes.position;
    for (let i = 0; i < DUST_COUNT; i++) {
      let y = posAttr.getY(i) + dustSpeeds[i] * 0.015;
      if (y > 17) y = -17;
      posAttr.setY(i, y);
    }
    posAttr.needsUpdate = true;

    renderer3.render(scene3, camera3);
  }

  animateHackathon();
}