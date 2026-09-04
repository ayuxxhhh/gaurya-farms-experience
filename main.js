/* ============================================================
   Gaurya Farms — WebGL Scrollytelling Experience
   main.js — Three.js · GSAP ScrollTrigger · Web Audio
   ============================================================ */

import * as THREE from 'https://esm.sh/three@0.170.0';
import { GLTFLoader } from 'https://esm.sh/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'https://esm.sh/gsap@3.12.7';
import { ScrollTrigger } from 'https://esm.sh/gsap@3.12.7/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   GLOBALS
   ============================================================ */
const clock = new THREE.Clock();
let jarGroup = null;
let renderer, scene, camera;
let envMap = null;
let floatTween = null;

// Audio
let audioCtx = null;
let gainNode = null;
let filterNode = null;
let audioPlaying = false;

// Scroll
let scrollVelocity = 0;

// DOM
const canvas          = document.getElementById('webgl-canvas');
const loadingScreen   = document.getElementById('loading-screen');
const loadingBar      = document.getElementById('loading-bar');
const loadingPercent  = document.getElementById('loading-percent');
const enterBtn        = document.getElementById('enter-btn');
const audioToggle     = document.getElementById('audio-toggle');
const scrollIndicator = document.getElementById('scroll-indicator');
const nav             = document.getElementById('nav');
const particlesEl     = document.getElementById('particles');

/* ============================================================
   PHASE 1: THREE.JS RENDERER & SCENE
   ============================================================ */
function initScene() {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf6ecd2);
  scene.fog = new THREE.Fog(0xffffff, 1, 8);

  camera = new THREE.PerspectiveCamera(
    45, window.innerWidth / window.innerHeight, 0.1, 100
  );
  camera.position.set(0, 0.5, 8);
  camera.lookAt(0, 0, 0);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/* ============================================================
   PHASE 2: LIGHTING & ENVIRONMENT MAP
   ============================================================ */
function initLighting() {
  // Ambient
  scene.add(new THREE.AmbientLight(0xfff5e6, 0.6));

  // Key light
  const key = new THREE.DirectionalLight(0xffeedd, 1.8);
  key.position.set(5, 8, 6);
  scene.add(key);

  // Fill
  const fill = new THREE.DirectionalLight(0xddeeff, 0.5);
  fill.position.set(-4, 3, -3);
  scene.add(fill);

  // Rim
  const rim = new THREE.PointLight(0xffaa44, 1.2, 25);
  rim.position.set(0, 3, -5);
  scene.add(rim);

  // Bottom bounce
  const bounce = new THREE.PointLight(0xfff0d0, 0.4, 15);
  bounce.position.set(0, -3, 2);
  scene.add(bounce);

  // Procedural environment map for PBR reflections & transmission
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileCubemapShader();

  const envScene = new THREE.Scene();

  // Warm gradient sky dome
  const skyGeo = new THREE.SphereGeometry(50, 64, 64);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor:    { value: new THREE.Color(0xfffef5) },
      midColor:    { value: new THREE.Color(0xf5e6c0) },
      bottomColor: { value: new THREE.Color(0xc79a3b) },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor, midColor, bottomColor;
      varying vec3 vWorldPos;
      void main() {
        float h = normalize(vWorldPos).y * 0.5 + 0.5;
        vec3 col = h > 0.5
          ? mix(midColor, topColor, (h - 0.5) * 2.0)
          : mix(bottomColor, midColor, h * 2.0);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  envScene.add(new THREE.Mesh(skyGeo, skyMat));

  // Bright specular highlight sources
  const makeLightSphere = (pos, color, size) => {
    const g = new THREE.SphereGeometry(size, 16, 16);
    const m = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.copy(pos);
    envScene.add(mesh);
  };
  makeLightSphere(new THREE.Vector3(15, 20, 15), 0xffffff, 4);
  makeLightSphere(new THREE.Vector3(-10, 10, -10), 0xfff5e0, 3);
  makeLightSphere(new THREE.Vector3(0, -15, 5), 0xffe8c0, 2);

  envMap = pmrem.fromScene(envScene, 0, 0.01, 100).texture;
  scene.environment = envMap;
  pmrem.dispose();
}

/* ============================================================
   PHASE 3: MODEL LOADING
   ============================================================ */
function loadModel() {
  return new Promise((resolve) => {
    const manager = new THREE.LoadingManager();

    manager.onProgress = (_url, loaded, total) => {
      const pct = Math.round((loaded / total) * 100);
      loadingBar.style.width = pct + '%';
      loadingPercent.textContent = pct + '%';
    };

    manager.onLoad = () => {
      loadingPercent.textContent = '100%';
      enterBtn.classList.add('visible');
    };

    const loader = new GLTFLoader(manager);

    loader.load(
      'assets/models/final.glb',
      (gltf) => {
        jarGroup = new THREE.Group();
        const model = gltf.scene;

        // Center & normalize
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.8 / maxDim;

        model.position.sub(center);
        model.scale.setScalar(scale);

        // Enhance all materials — DON'T aggressively override
        model.traverse((child) => {
          if (!child.isMesh) return;
          child.castShadow = true;
          child.receiveShadow = true;

          const mat = child.material;
          if (!mat) return;

          // Give every material the environment map for proper PBR
          if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
            mat.envMap = envMap;
            mat.envMapIntensity = 1.2;
            mat.needsUpdate = true;
          }

          // If the original material was meant to be glass/transparent
          // (exported with alpha < 1 or with transmission), enhance it
          if (mat.transparent && mat.opacity < 0.95) {
            child.material = new THREE.MeshPhysicalMaterial({
              color: 0xffffff,
              transmission: 0.9,
              roughness: 0.08,
              metalness: 0.0,
              ior: 1.45,
              thickness: 1.0,
              clearcoat: 0.8,
              clearcoatRoughness: 0.15,
              attenuationColor: new THREE.Color(0xffd700),
              attenuationDistance: 0.8,
              envMap: envMap,
              envMapIntensity: 1.5,
              transparent: true,
              side: THREE.DoubleSide,
            });
          }
        });

        jarGroup.add(model);
        jarGroup.position.set(0, 0, -3);
        scene.add(jarGroup);

        console.log('✅ GLB model loaded successfully');
        resolve(jarGroup);
      },
      undefined,
      (err) => {
        console.warn('⚠️ GLB load failed, using procedural jar:', err);
        createFallbackJar();
        resolve(jarGroup);
      }
    );
  });
}

/* ============================================================
   FALLBACK: PROCEDURAL JAR (when .glb fails)
   ============================================================ */
function createFallbackJar() {
  jarGroup = new THREE.Group();

  // --- GLASS BODY (lathe profile for realistic jar shape) ---
  const profile = [];
  // Bottom curve
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const x = 0.55 + 0.25 * Math.sin(t * Math.PI * 0.5);
    const y = -1.0 + t * 0.4;
    profile.push(new THREE.Vector2(x, y));
  }
  // Main body
  profile.push(new THREE.Vector2(0.8, -0.4));
  profile.push(new THREE.Vector2(0.82, 0.0));
  profile.push(new THREE.Vector2(0.82, 0.5));
  profile.push(new THREE.Vector2(0.80, 0.7));
  // Shoulder curve
  profile.push(new THREE.Vector2(0.75, 0.8));
  profile.push(new THREE.Vector2(0.65, 0.88));
  // Neck
  profile.push(new THREE.Vector2(0.55, 0.92));
  profile.push(new THREE.Vector2(0.50, 0.95));
  profile.push(new THREE.Vector2(0.48, 1.0));
  // Rim
  profile.push(new THREE.Vector2(0.52, 1.02));
  profile.push(new THREE.Vector2(0.52, 1.05));

  const glassGeo = new THREE.LatheGeometry(profile, 64);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xfcfcf8,
    transmission: 0.85,
    roughness: 0.06,
    metalness: 0.0,
    ior: 1.45,
    thickness: 0.8,
    clearcoat: 0.7,
    clearcoatRoughness: 0.12,
    attenuationColor: new THREE.Color(0xffd54f),
    attenuationDistance: 1.0,
    envMap: envMap,
    envMapIntensity: 2.0,
    transparent: true,
    side: THREE.DoubleSide,
  });
  jarGroup.add(new THREE.Mesh(glassGeo, glassMat));

  // --- GOLDEN GHEE LIQUID ---
  const liquidProfile = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const x = 0.50 + 0.22 * Math.sin(t * Math.PI * 0.5);
    const y = -0.95 + t * 0.35;
    liquidProfile.push(new THREE.Vector2(x, y));
  }
  liquidProfile.push(new THREE.Vector2(0.72, -0.35));
  liquidProfile.push(new THREE.Vector2(0.74, 0.0));
  liquidProfile.push(new THREE.Vector2(0.74, 0.3));
  // Liquid surface (flat top)
  liquidProfile.push(new THREE.Vector2(0.0, 0.3));

  const liquidGeo = new THREE.LatheGeometry(liquidProfile, 64);
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: 0xd4920a,
    roughness: 0.25,
    metalness: 0.05,
    emissive: 0x3a2200,
    emissiveIntensity: 0.15,
    envMap: envMap,
    envMapIntensity: 0.8,
    clearcoat: 0.3,
    clearcoatRoughness: 0.3,
  });
  jarGroup.add(new THREE.Mesh(liquidGeo, liquidMat));

  // --- GOLD CAP ---
  const capGeo = new THREE.CylinderGeometry(0.53, 0.50, 0.15, 64);
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xb8973a,
    metalness: 0.85,
    roughness: 0.25,
    envMap: envMap,
    envMapIntensity: 1.5,
  });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 1.1;
  jarGroup.add(cap);

  // Cap top detail
  const capTopGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.03, 64);
  const capTop = new THREE.Mesh(capTopGeo, capMat.clone());
  capTop.material.color.set(0xa08030);
  capTop.position.y = 1.18;
  jarGroup.add(capTop);

  // --- LABEL BAND ---
  const labelGeo = new THREE.CylinderGeometry(0.84, 0.84, 0.55, 64, 1, true);
  const labelMat = new THREE.MeshStandardMaterial({
    color: 0x35472d,
    roughness: 0.85,
    metalness: 0.0,
    envMap: envMap,
    side: THREE.DoubleSide,
  });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.y = 0.15;
  jarGroup.add(label);

  // Label gold stripes
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xC4A67D, metalness: 0.4, roughness: 0.5, envMap: envMap, side: THREE.DoubleSide,
  });
  [-0.05, 0.35].forEach((y) => {
    const stripeGeo = new THREE.CylinderGeometry(0.845, 0.845, 0.02, 64, 1, true);
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = y;
    jarGroup.add(stripe);
  });

  // --- GLASS BOTTOM ---
  const bottomGeo = new THREE.CircleGeometry(0.55, 64);
  const bottomMat = new THREE.MeshPhysicalMaterial({
    color: 0xfff8e0, roughness: 0.2, envMap: envMap, transparent: true, opacity: 0.5,
  });
  const bottom = new THREE.Mesh(bottomGeo, bottomMat);
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.y = -1.0;
  jarGroup.add(bottom);

  jarGroup.position.set(0, 0, -3);
  scene.add(jarGroup);

  // Trigger loading complete
  loadingBar.style.width = '100%';
  loadingPercent.textContent = '100%';
  enterBtn.classList.add('visible');
}

/* ============================================================
   PHASE 4: FLOAT ANIMATION
   ============================================================ */
function initFloatAnimation() {
  if (!jarGroup) return;
  floatTween = gsap.to(jarGroup.position, {
    y: '+=0.12',
    duration: 2.8,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  });
}

/* ============================================================
   PHASE 5: PARTICLES (CSS-driven gold motes)
   ============================================================ */
function initParticles() {
  for (let i = 0; i < 25; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.width = p.style.height = (1.5 + Math.random() * 3) + 'px';
    p.style.animationDelay = (Math.random() * 8) + 's';
    p.style.animationDuration = (6 + Math.random() * 6) + 's';
    particlesEl.appendChild(p);
  }
}

/* ============================================================
   PHASE 6: GSAP SCROLL CHOREOGRAPHY
   ============================================================ */
function initScrollChoreography() {
  if (!jarGroup) return;

  const sections = ['#section-source', '#section-culturing', '#section-churn', '#section-clarification', '#section-yield'];
  const dots = document.querySelectorAll('.progress-dots__dot');

  // --- HELPER: Text reveal per section ---
  function revealSection(sectionId) {
    const section = document.querySelector(sectionId);
    if (!section) return;

    const step = section.querySelector('[data-anim="step"]');
    const heading = section.querySelector('[data-anim="heading-reveal"]');
    const body = section.querySelector('[data-anim="body-fade"]');
    const line = section.querySelector('[data-anim="line-grow"]');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionId,
        start: 'top 65%',
        end: 'top 15%',
        scrub: 1,
      },
    });

    if (step) tl.to(step, { opacity: 1, duration: 0.3 }, 0);
    if (heading) tl.to(heading, { y: '0%', duration: 0.6, ease: 'power3.out' }, 0.05);
    if (body) tl.to(body, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.25);
    if (line) tl.to(line, { width: '60px', duration: 0.4, ease: 'power2.out' }, 0.35);
  }

  revealSection('#section-source');
  revealSection('#section-culturing');
  revealSection('#section-churn');
  revealSection('#section-clarification');

  // --- Progress dots ---
  sections.forEach((id, i) => {
    ScrollTrigger.create({
      trigger: id,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => updateDots(i),
      onEnterBack: () => updateDots(i),
    });
  });

  function updateDots(index) {
    dots.forEach((d, i) => {
      d.classList.toggle('progress-dots__dot--active', i === index);
    });
  }

  // --- SECTION 1: THE SOURCE ---
  gsap.timeline({
    scrollTrigger: { trigger: '#section-source', start: 'top top', end: 'bottom top', scrub: 1 },
  })
    .to(camera.position, { z: 6.5, ease: 'none' }, 0)
    .to(jarGroup.position, { z: -1.5, ease: 'none' }, 0);

  // --- SECTION 2: THE CULTURING ---
  gsap.timeline({
    scrollTrigger: { trigger: '#section-culturing', start: 'top top', end: 'bottom top', scrub: 1 },
  })
    .to(scene.fog, { far: 50, ease: 'none' }, 0)
    .to(camera.position, { z: 5, ease: 'none' }, 0)
    .to(jarGroup.position, { z: 0, ease: 'none' }, 0)
    .to(floatTween, { timeScale: 0.4, ease: 'none' }, 0);

  // --- SECTION 3: THE CHURN ---
  ScrollTrigger.create({
    trigger: '#section-churn',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: (self) => {
      scrollVelocity = self.getVelocity();
      if (jarGroup) {
        const targetRotY = scrollVelocity * 0.0003;
        jarGroup.rotation.y += (targetRotY - jarGroup.rotation.y * 0.1) * 0.1;
      }
    },
  });

  gsap.to(jarGroup.rotation, {
    y: Math.PI * 2, ease: 'none',
    scrollTrigger: { trigger: '#section-churn', start: 'top top', end: 'bottom top', scrub: 3 },
  });

  // --- SECTION 4: THE CLARIFICATION ---
  gsap.timeline({
    scrollTrigger: { trigger: '#section-clarification', start: 'top top', end: 'bottom top', scrub: 1 },
  })
    .to(renderer, { toneMappingExposure: 2.2, ease: 'none' }, 0)
    .to(scene.background, { r: 0.831, g: 0.573, b: 0.039, ease: 'none' }, 0)
    .to(camera.position, { z: 3.5, ease: 'none' }, 0)
    .to(jarGroup.scale, { x: 1.1, y: 1.1, z: 1.1, ease: 'none' }, 0)
    .to(floatTween, { timeScale: 1.0, ease: 'none' }, 0);

  // --- SECTION 5: THE YIELD ---
  gsap.timeline({
    scrollTrigger: { trigger: '#section-yield', start: 'top top', end: 'center center', scrub: 1 },
  })
    .to(camera.position, { z: 5, y: 0.3, ease: 'none' }, 0)
    .to(jarGroup.position, { x: 0, y: 0, z: 0, ease: 'none' }, 0)
    .to(jarGroup.rotation, { y: 0, ease: 'none' }, 0)
    .to(jarGroup.scale, { x: 1.0, y: 1.0, z: 1.0, ease: 'none' }, 0)
    .to(renderer, { toneMappingExposure: 1.4, ease: 'none' }, 0)
    .to(scene.background, { r: 0.965, g: 0.929, b: 0.824, ease: 'none' }, 0);

  // CTA text animations
  const ctaTl = gsap.timeline({
    scrollTrigger: { trigger: '#section-yield', start: 'top 50%', end: 'center center', scrub: 1 },
  });
  const ctaH = document.querySelector('#cta-block [data-anim="heading-reveal"]');
  const ctaB = document.querySelector('#cta-block [data-anim="body-fade"]');
  const ctaA = document.querySelector('#cta-block [data-anim="cta-fade"]');
  const ctaBadges = document.querySelector('#cta-block [data-anim="badges-fade"]');

  if (ctaH) ctaTl.to(ctaH, { y: '0%', duration: 0.6, ease: 'power3.out' }, 0);
  if (ctaB) ctaTl.to(ctaB, { opacity: 1, y: 0, duration: 0.5 }, 0.15);
  if (ctaA) ctaTl.to(ctaA, { opacity: 1, y: 0, duration: 0.5 }, 0.3);
  if (ctaBadges) ctaTl.to(ctaBadges, { opacity: 1, duration: 0.5 }, 0.45);

  // Hide scroll indicator after first section
  ScrollTrigger.create({
    trigger: '#section-culturing',
    start: 'top 90%',
    onEnter: () => scrollIndicator.classList.add('hidden'),
    onLeaveBack: () => scrollIndicator.classList.remove('hidden'),
  });
}

/* ============================================================
   PHASE 7: WEB AUDIO — PROCEDURAL DRONE
   ============================================================ */
function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.0;
  gainNode.connect(audioCtx.destination);

  filterNode = audioCtx.createBiquadFilter();
  filterNode.type = 'lowpass';
  filterNode.frequency.value = 200;
  filterNode.Q.value = 5;
  filterNode.connect(gainNode);

  // Osc 1 — warm drone
  const osc1 = audioCtx.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.value = 55;
  const g1 = audioCtx.createGain();
  g1.gain.value = 0.1;
  osc1.connect(g1).connect(filterNode);
  osc1.start();

  // Osc 2 — harmonic
  const osc2 = audioCtx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = 82.5;
  const g2 = audioCtx.createGain();
  g2.gain.value = 0.07;
  osc2.connect(g2).connect(filterNode);
  osc2.start();

  // Osc 3 — sub
  const osc3 = audioCtx.createOscillator();
  osc3.type = 'sine';
  osc3.frequency.value = 27.5;
  const g3 = audioCtx.createGain();
  g3.gain.value = 0.05;
  osc3.connect(g3).connect(gainNode);
  osc3.start();
}

function toggleAudio() {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  audioPlaying = !audioPlaying;
  gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
  gainNode.gain.setTargetAtTime(audioPlaying ? 0.12 : 0.0, audioCtx.currentTime, 0.3);
  audioToggle.classList.toggle('audio-toggle--playing', audioPlaying);
}

function updateAudioFilter() {
  if (!filterNode || !audioPlaying) return;
  const absVel = Math.abs(scrollVelocity);
  filterNode.frequency.setTargetAtTime(200 + Math.min(absVel * 0.5, 1800), audioCtx.currentTime, 0.05);
}

/* ============================================================
   PHASE 8: RENDER LOOP
   ============================================================ */
function animate() {
  requestAnimationFrame(animate);
  updateAudioFilter();
  renderer.render(scene, camera);
}

/* ============================================================
   PHASE 9: BOOT SEQUENCE
   ============================================================ */
async function init() {
  initScene();
  initLighting();
  await loadModel();
  initFloatAnimation();
  initParticles();
  initAudio();
  animate();
  initScrollChoreography();

  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

// --- Entry ---
enterBtn.addEventListener('click', () => {
  loadingScreen.classList.add('hidden');
  nav.classList.add('visible');
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  setTimeout(() => ScrollTrigger.refresh(), 200);
});

// --- Audio toggle ---
audioToggle.addEventListener('click', toggleAudio);

// --- Boot ---
init();
