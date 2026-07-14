/*!
 * HackIndia 2026 — Advanced 3D Background (bg3d.js)
 * Replaces / augments the existing #bg-canvas animation with:
 *   1. Galaxy / Nebula 60 000-point spiral particle cloud
 *   2. Dual DNA double-helix (tube + rungs)
 *   3. Pulsing TorusKnot energy ring (trefoil p=3 q=2)
 *   4. 30 floating wireframe polyhedra (ico + octa)
 *   5. 120 vertical light-beam streaks
 *   6. Perspective aurora grid
 *   7. Mouse-parallax + auto-orbit camera
 *
 * Requires three.js r128 already on window.THREE (loaded before this file)
 */
(function () {
  'use strict';

  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  /* ── Renderer ───────────────────────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  /* ── Scene / Camera ─────────────────────────────────────────────── */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 0, 55);

  /* ── Colour helpers ─────────────────────────────────────────────── */
  const CV = { violet:new THREE.Color(0x7c3aed), cyan:new THREE.Color(0x06b6d4), pink:new THREE.Color(0xec4899), white:new THREE.Color(0xffffff) };

  /* ═══ 1. GALAXY NEBULA ═══════════════════════════════════════════ */
  const N = 60000;
  const nGeo = new THREE.BufferGeometry();
  const nPos = new Float32Array(N*3), nCol = new Float32Array(N*3);
  const ARMS = 3, SPREAD = (2*Math.PI)/ARMS;

  for (let i=0;i<N;i++) {
    const arm = i%ARMS;
    const r   = 15 + Math.random()*140;
    const ang = arm*SPREAD + (r/150)*6.5 + (Math.random()-.5)*.8;
    const sc  = (Math.random()-.5)*(r*.12);
    nPos[i*3]   = Math.cos(ang)*r+sc;
    nPos[i*3+1] = (Math.random()-.5)*(r*.06);
    nPos[i*3+2] = Math.sin(ang)*r+sc;
    const t = r/155;
    let col = t<.4 ? CV.violet.clone().lerp(CV.cyan,t/.4)
            : t<.75? CV.cyan.clone().lerp(CV.pink,(t-.4)/.35)
                   : CV.pink.clone().lerp(CV.white,(t-.75)/.25);
    nCol[i*3]=col.r; nCol[i*3+1]=col.g; nCol[i*3+2]=col.b;
  }
  nGeo.setAttribute('position', new THREE.BufferAttribute(nPos,3));
  nGeo.setAttribute('color',    new THREE.BufferAttribute(nCol,3));
  const nMat = new THREE.PointsMaterial({size:.55,vertexColors:true,transparent:true,opacity:.82,sizeAttenuation:true,depthWrite:false,blending:THREE.AdditiveBlending});
  const nebula = new THREE.Points(nGeo, nMat);
  nebula.rotation.x = Math.PI*.12;
  scene.add(nebula);

  /* ═══ 2. DNA DOUBLE HELIX ════════════════════════════════════════ */
  function buildHelix(phase, c1, c2) {
    const g = new THREE.Group();
    const TURNS=5, HEIGHT=70, RADIUS=4, SEGS=300;
    const pts1=[], pts2=[];
    for (let i=0;i<=SEGS;i++) {
      const t=i/SEGS, y=t*HEIGHT-HEIGHT*.5, a=t*TURNS*Math.PI*2+phase;
      pts1.push(new THREE.Vector3(Math.cos(a)*RADIUS, y, Math.sin(a)*RADIUS));
      pts2.push(new THREE.Vector3(Math.cos(a+Math.PI)*RADIUS, y, Math.sin(a+Math.PI)*RADIUS));
    }
    const mkTube = (pts, col) => {
      const mat = new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false});
      return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),250,.12,6,false), mat);
    };
    g.add(mkTube(pts1,c1)); g.add(mkTube(pts2,c2));
    for (let i=0;i<=SEGS;i+=12) {
      const t=i/SEGS, y=t*HEIGHT-HEIGHT*.5, a=t*TURNS*Math.PI*2+phase;
      const rGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Math.cos(a)*RADIUS,y,Math.sin(a)*RADIUS),
        new THREE.Vector3(Math.cos(a+Math.PI)*RADIUS,y,Math.sin(a+Math.PI)*RADIUS)
      ]);
      g.add(new THREE.Line(rGeo, new THREE.LineBasicMaterial({color:0x06b6d4,transparent:true,opacity:.28,blending:THREE.AdditiveBlending})));
    }
    return g;
  }
  const h1=buildHelix(0,0x7c3aed,0xec4899); h1.position.set(-28,0,-20); h1.rotation.z=Math.PI*.08; scene.add(h1);
  const h2=buildHelix(Math.PI*.5,0x06b6d4,0x6366f1); h2.position.set(32,-5,-25); h2.rotation.z=-Math.PI*.06; scene.add(h2);

  /* ═══ 3. TORUS KNOT RING ═════════════════════════════════════════ */
  const tkg = new THREE.Group(); tkg.position.set(10,-8,-35); scene.add(tkg);
  const tkGeo = new THREE.TorusKnotGeometry(10,.45,220,20,3,2);
  const tkCoreMat = new THREE.MeshBasicMaterial({color:0x1e1040,transparent:true,opacity:.5});
  const tkWireMat = new THREE.MeshBasicMaterial({color:0xa855f7,wireframe:true,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false});
  const tkLineMat = new THREE.MeshBasicMaterial({color:0x38bdf8,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false});
  tkg.add(new THREE.Mesh(tkGeo, tkCoreMat));
  tkg.add(new THREE.Mesh(tkGeo, tkWireMat));
  tkg.add(new THREE.Mesh(new THREE.TorusKnotGeometry(10,.12,220,8,3,2), tkLineMat));

  /* ═══ 4. FLOATING POLYHEDRA ══════════════════════════════════════ */
  const shards=[], sg=new THREE.Group(); scene.add(sg);
  const sCols=[0x7c3aed,0x06b6d4,0xec4899,0x6366f1,0xfbbf24];
  for (let i=0;i<30;i++) {
    const sz=.5+Math.random()*2.2;
    const geo=Math.random()>.45?new THREE.IcosahedronGeometry(sz,0):new THREE.OctahedronGeometry(sz,0);
    const mesh=new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color:sCols[i%sCols.length],wireframe:true,transparent:true,opacity:.2+Math.random()*.3,blending:THREE.AdditiveBlending,depthWrite:false}));
    mesh.position.set((Math.random()-.5)*120,(Math.random()-.5)*60,-10-Math.random()*60);
    mesh.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);
    sg.add(mesh);
    shards.push({mesh,sx:(Math.random()-.5)*.008,sy:(Math.random()-.5)*.01,sz:(Math.random()-.5)*.006,fa:.04+Math.random()*.08,ff:.25+Math.random()*.6,fp:Math.random()*Math.PI*2,by:mesh.position.y});
  }

  /* ═══ 5. BEAM STREAKS ════════════════════════════════════════════ */
  const BC=120, bGeo=new THREE.BufferGeometry();
  const bPos=new Float32Array(BC*6), bData=[];
  for (let i=0;i<BC;i++) {
    const x=(Math.random()-.5)*200, y=(Math.random()-.5)*100, z=-20-Math.random()*80, spd=.05+Math.random()*.25, len=.5+Math.random()*2.5;
    bData.push({x,y,z,spd,len});
    bPos[i*6]=x;bPos[i*6+1]=y;bPos[i*6+2]=z;bPos[i*6+3]=x;bPos[i*6+4]=y+len;bPos[i*6+5]=z;
  }
  bGeo.setAttribute('position', new THREE.BufferAttribute(bPos,3));
  scene.add(new THREE.LineSegments(bGeo, new THREE.LineBasicMaterial({color:0x7dd3fc,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false})));
  const bAttr = bGeo.attributes.position;

  /* ═══ 6. AURORA GRID ════════════════════════════════════════════ */
  const gg=new THREE.Group(); gg.position.set(0,-30,-80); gg.rotation.x=-Math.PI*.22; scene.add(gg);
  const GW=120,GH=60,GS=40;
  for (let i=0;i<=GS;i++) {
    const t=i/GS, z=(t-.5)*GH;
    gg.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-GW*.5,0,z),new THREE.Vector3(GW*.5,0,z)]),new THREE.LineBasicMaterial({color:0x4f46e5,transparent:true,opacity:.08+(1-t)*.12,blending:THREE.AdditiveBlending})));
    gg.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3((t-.5)*GW,0,-GH*.5),new THREE.Vector3((t-.5)*GW,0,GH*.5)]),new THREE.LineBasicMaterial({color:0x818cf8,transparent:true,opacity:.06+(1-t)*.08,blending:THREE.AdditiveBlending})));
  }

  /* ── Interaction ────────────────────────────────────────────────── */
  let mx=0,my=0,tmx=0,tmy=0,scrollY=0,tScrollY=0;
  window.addEventListener('mousemove',e=>{tmx=(e.clientX/window.innerWidth-.5)*2;tmy=(e.clientY/window.innerHeight-.5)*2;});
  window.addEventListener('scroll',()=>{tScrollY=window.scrollY;},{passive:true});
  window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});

  /* ── Animate ────────────────────────────────────────────────────── */
  const clock=new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    const t=clock.getElapsedTime();
    mx+=(tmx-mx)*.035; my+=(tmy-my)*.035; scrollY+=(tScrollY-scrollY)*.04;

    nebula.rotation.y=t*.018; nebula.rotation.x=Math.PI*.12+my*.04; nMat.opacity=.72+Math.sin(t*.4)*.10;

    h1.rotation.y=t*.12; h1.position.y=Math.sin(t*.35)*4;
    h2.rotation.y=-t*.09; h2.position.y=Math.sin(t*.28+1.2)*3;

    tkg.rotation.y=t*.25; tkg.rotation.x=t*.11; tkg.rotation.z=t*.07;
    const pulse=.45+Math.sin(t*1.8)*.15;
    tkCoreMat.opacity=pulse*.8; tkLineMat.opacity=pulse*.65;

    for (const s of shards) {
      s.mesh.rotation.x+=s.sx; s.mesh.rotation.y+=s.sy; s.mesh.rotation.z+=s.sz;
      s.mesh.position.y=s.by+Math.sin(t*s.ff+s.fp)*s.fa*12;
    }

    for (let i=0;i<BC;i++) {
      const d=bData[i]; d.y+=d.spd; if(d.y>55)d.y=-55;
      bAttr.setY(i*2,d.y); bAttr.setY(i*2+1,d.y+d.len);
    }
    bAttr.needsUpdate=true;

    gg.position.z=-80+(scrollY*.06%30);
    gg.children.forEach((l,i)=>{ l.material.opacity=.06+Math.sin(t*.8+i*.15)*.04; });

    camera.position.x+=(mx*6+Math.sin(t*.07)*5-camera.position.x)*.025;
    camera.position.y+=(-my*4+Math.cos(t*.05)*3-scrollY*.012-camera.position.y)*.025;
    camera.position.z=55+Math.sin(t*.04)*5;
    camera.lookAt(0,-scrollY*.01,0);

    renderer.render(scene,camera);
  }
  tick();
})();
