/* ============================================================
   Gaurya Farms — WebGL Scrollytelling Experience
   main.js — Three.js · GSAP ScrollTrigger · Web Audio
   ============================================================ */

// --- CDN ESM Imports ---
import * as THREE from 'https://esm.sh/three@0.170.0';
import { GLTFLoader } from 'https://esm.sh/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'https://esm.sh/three@0.170.0/examples/jsm/loaders/RGBELoader.js';
import gsap from 'https://esm.sh/gsap@3.12.7';
import { ScrollTrigger } from 'https://esm.sh/gsap@3.12.7/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   GLOBALS — allocated once, never inside render loop
   ============================================================ */
const clock = new THREE.Clock();
let jarGroup = null;
let renderer, scene, camera;
let envMap = null;
let floatTween = null;

// Audio state
let audioCtx = null;
let gainNode = null;
let filterNode = null;
let audioPlaying = false;

// Scroll velocity tracking
let scrollVelocity = 0;

// DOM refs
const canvas       = document.getElementById('webgl-canvas');
const loadingScreen = document.getElementById('loading-screen');
const loadingBar    = document.getElementById('loading-bar');
const enterBtn      = document.getElementById('enter-btn');
const audioToggle   = document.getElementById('audio-toggle');
const scrollIndicator = document.getElementById('scroll-indicator');

/* ============================================================
   PHASE 1: THREE.JS SCENE SETUP
   ============================================================ */
function initScene() {
  // Renderer
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

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf6ecd2); // brand cream
  scene.fog = new THREE.Fog(0xffffff, 1, 8); // thick white fog for Section 1

  // Camera
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0.5, 8); // start far back
  camera.lookAt(0, 0, 0);

  // Resize handler
  window.addEventListener('resize', onResize);
}

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

/* ============================================================
   PHASE 2: LIGHTING & PROCEDURAL ENVIRONMENT
   ============================================================ */
function initLighting() {
  // Ambient — warm base fill
  const ambient = new THREE.AmbientLight(0xfff5e6, 0.5);
  scene.add(ambient);

  // Key light — warm directional
  const keyLight = new THREE.DirectionalLight(0xffeedd, 1.5);
  keyLight.position.set(3, 5, 4);
  keyLight.castShadow = false; // keep perf light
  scene.add(keyLight);

  // Fill light — subtle cool side
  const fillLight = new THREE.DirectionalLight(0xddeeff, 0.4);
  fillLight.position.set(-3, 2, -2);
  scene.add(fillLight);

  // Rim / accent — warm amber behind
  const rimLight = new THREE.PointLight(0xffaa44, 1.0, 20);
  rimLight.position.set(0, 2, -4);
  scene.add(rimLight);

  // Procedural environment map for PBR reflections
  createProceduralEnvMap();
}

function createProceduralEnvMap() {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileCubemapShader();

  // Build a tiny warm-gradient scene for the env map
  const envScene = new THREE.Scene();

  // Warm gradient sphere
  const gradientGeo = new THREE.SphereGeometry(50, 32, 32);
  const gradientMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor:    { value: new THREE.Color(0xfff8e8) },
      bottomColor: { value: new THREE.Color(0xd4920a) },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y * 0.5 + 0.5;
        gl_FragColor = vec4(mix(bottomColor, topColor, h), 1.0);
      }
    `,
  });
  const gradientMesh = new THREE.Mesh(gradientGeo, gradientMat);
  envScene.add(gradientMesh);

  // Small bright light source sphere for specular highlights
  const lightSourceGeo = new THREE.SphereGeometry(2, 16, 16);
  const lightSourceMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lightSource = new THREE.Mesh(lightSourceGeo, lightSourceMat);
  lightSource.position.set(10, 15, 10);
  envScene.add(lightSource);

  envMap = pmrem.fromScene(envScene, 0, 0.01, 100).texture;
  scene.environment = envMap;

  // Cleanup
  gradientGeo.dispose();
  gradientMat.dispose();
  lightSourceGeo.dispose();
  lightSourceMat.dispose();
  pmrem.dispose();
}

/* ============================================================
   PHASE 3: MODEL LOADING (GLB)
   ============================================================ */
function loadModel() {
  return new Promise((resolve, reject) => {
    const manager = new THREE.LoadingManager();

    manager.onProgress = (_url, loaded, total) => {
      const pct = (loaded / total) * 100;
      loadingBar.style.width = pct + '%';
    };

    manager.onLoad = () => {
      // Show enter button
      enterBtn.classList.add('visible');
    };

    const loader = new GLTFLoader(manager);

    loader.load(
      'assets/models/final.glb',
      (gltf) => {
        jarGroup = new THREE.Group();
        const model = gltf.scene;

        // Center and normalize scale
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 3.0; // desired max dimension
        const scaleFactor = targetSize / maxDim;

        model.position.sub(center);
        model.scale.setScalar(scaleFactor);

        // Traverse and enhance materials
        model.traverse((child) => {
          if (!child.isMesh) return;

          child.castShadow = true;
          child.receiveShadow = true;

          const mat = child.material;
          if (!mat) return;

          const name = (child.name || '').toLowerCase();
          const matName = (mat.name || '').toLowerCase();

          // Detect glass meshes — by transparency, name, or high transmission
          const isGlass =
            name.includes('glass') ||
            name.includes('jar') ||
            name.includes('bottle') ||
            matName.includes('glass') ||
            matName.includes('transparent') ||
            (mat.transparent && mat.opacity < 0.9);

          if (isGlass) {
            // Override with refractive glass material
            child.material = new THREE.MeshPhysicalMaterial({
              color: 0xffffff,
              transmission: 0.92,
              roughness: 0.05,
              metalness: 0.0,
              ior: 1.52,
              thickness: 1.5,
              clearcoat: 1.0,
              clearcoatRoughness: 0.1,
              attenuationColor: new THREE.Color(0xffd700),
              attenuationDistance: 0.5,
              envMap: envMap,
              envMapIntensity: 1.5,
              transparent: true,
              side: THREE.DoubleSide,
            });
          } else {
            // Enhance existing PBR materials with env map
            if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
              mat.envMap = envMap;
              mat.envMapIntensity = 1.0;
              mat.needsUpdate = true;
            }
          }
        });

        jarGroup.add(model);

        // Start position: deep in Z for Section 1
        jarGroup.position.set(0, 0, -3);

        scene.add(jarGroup);
        resolve(jarGroup);
      },
      undefined,
      (error) => {
        console.error('GLB load error:', error);
        // Fallback: create a simple procedural jar
        createFallbackJar();
        resolve(jarGroup);
      }
    );
  });
}

/* Fallback procedural jar if .glb fails to load */
function createFallbackJar() {
  jarGroup = new THREE.Group();

  // Glass body
  const bodyGeo = new THREE.CylinderGeometry(0.7, 0.8, 2.2, 32, 1, true);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 0.92,
    roughness: 0.05,
    ior: 1.52,
    thickness: 1.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    attenuationColor: new THREE.Color(0xffd700),
    attenuationDistance: 0.5,
    envMap: envMap,
    envMapIntensity: 1.5,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const body = new THREE.Mesh(bodyGeo, glassMat);
  jarGroup.add(body);

  // Golden liquid inside
  const liquidGeo = new THREE.CylinderGeometry(0.65, 0.75, 1.8, 32);
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: 0xd4920a,
    roughness: 0.3,
    metalness: 0.1,
    emissive: 0x2a1a00,
    emissiveIntensity: 0.3,
    envMap: envMap,
  });
  const liquid = new THREE.Mesh(liquidGeo, liquidMat);
  liquid.position.y = -0.1;
  jarGroup.add(liquid);

  // Gold cap
  const capGeo = new THREE.CylinderGeometry(0.75, 0.72, 0.2, 32);
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xc8982e,
    metalness: 0.8,
    roughness: 0.3,
    envMap: envMap,
  });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 1.2;
  jarGroup.add(cap);

  // Label band
  const labelGeo = new THREE.CylinderGeometry(0.82, 0.82, 0.7, 32, 1, true);
  const labelMat = new THREE.MeshStandardMaterial({
    color: 0x35472d,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.y = 0.2;
  jarGroup.add(label);

  jarGroup.position.set(0, 0, -3);
  scene.add(jarGroup);

  // Trigger enter button since there's no async load
  loadingBar.style.width = '100%';
  enterBtn.classList.add('visible');
}

/* ============================================================
   PHASE 4: FLOAT ANIMATION (ANTIGRAVITY YOYO)
   ============================================================ */
function initFloatAnimation() {
  if (!jarGroup) return;

  floatTween = gsap.to(jarGroup.position, {
    y: '+=0.15',
    duration: 2.5,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  });
}

/* ============================================================
   PHASE 5: GSAP SCROLLTRIGGER CHOREOGRAPHY
   ============================================================ */
function initScrollChoreography() {
  if (!jarGroup) return;

  // --- HELPER: Animate a section's text elements ---
  function revealSection(sectionId) {
    const section = document.querySelector(sectionId);
    if (!section) return;

    const step    = section.querySelector('.section-step');
    const heading = section.querySelector('[data-anim="heading-reveal"]');
    const body    = section.querySelector('[data-anim="body-fade"]');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionId,
        start: 'top 70%',
        end: 'top 20%',
        scrub: 1,
      },
    });

    // Step label fades in
    if (step) {
      tl.to(step, { opacity: 1, duration: 0.3 }, 0);
    }

    // Heading mask-reveals upward (translateY: 110% → 0)
    if (heading) {
      tl.to(heading, {
        y: '0%',
        duration: 0.6,
        ease: 'power3.out',
      }, 0.1);
    }

    // Body text fades in behind
    if (body) {
      tl.to(body, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
      }, 0.3);
    }
  }

  // Reveal all narrative sections
  revealSection('#section-source');
  revealSection('#section-culturing');
  revealSection('#section-churn');
  revealSection('#section-clarification');

  // --- SECTION 1: THE SOURCE — Camera & Jar ---
  gsap.timeline({
    scrollTrigger: {
      trigger: '#section-source',
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
    },
  })
    .to(camera.position, { z: 6.5, ease: 'none' }, 0)
    .to(jarGroup.position, { z: -1.5, ease: 'none' }, 0);

  // --- SECTION 2: THE CULTURING — Fog, dolly, float slowdown ---
  gsap.timeline({
    scrollTrigger: {
      trigger: '#section-culturing',
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
    },
  })
    .to(scene.fog, { far: 50, ease: 'none' }, 0)
    .to(camera.position, { z: 5, ease: 'none' }, 0)
    .to(jarGroup.position, { z: 0, ease: 'none' }, 0)
    .to(floatTween, { timeScale: 0.4, ease: 'none' }, 0);

  // --- SECTION 3: THE CHURN — Velocity-mapped rotation ---
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

  // Baseline rotation so it doesn't stall when scroll stops
  gsap.to(jarGroup.rotation, {
    y: Math.PI * 2,
    ease: 'none',
    scrollTrigger: {
      trigger: '#section-churn',
      start: 'top top',
      end: 'bottom top',
      scrub: 3,
    },
  });

  // --- SECTION 4: THE CLARIFICATION — Exposure, amber, scale ---
  gsap.timeline({
    scrollTrigger: {
      trigger: '#section-clarification',
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
    },
  })
    .to(renderer, { toneMappingExposure: 2.0, ease: 'none' }, 0)
    .to(scene.background, {
      r: 0.831, g: 0.573, b: 0.039, // amber #d4920a
      ease: 'none',
    }, 0)
    .to(camera.position, { z: 3.5, ease: 'none' }, 0)
    .to(jarGroup.scale, { x: 1.1, y: 1.1, z: 1.1, ease: 'none' }, 0)
    .to(floatTween, { timeScale: 1.0, ease: 'none' }, 0);

  // --- SECTION 5: THE YIELD — Snap to center, CTA reveal ---
  const yieldTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#section-yield',
      start: 'top top',
      end: 'center center',
      scrub: 1,
    },
  });

  yieldTl
    .to(camera.position, { z: 4, y: 0.3, ease: 'none' }, 0)
    .to(jarGroup.position, { x: 0, y: 0, z: 0, ease: 'none' }, 0)
    .to(jarGroup.rotation, { y: 0, ease: 'none' }, 0)
    .to(jarGroup.scale, { x: 1.0, y: 1.0, z: 1.0, ease: 'none' }, 0)
    .to(renderer, { toneMappingExposure: 1.5, ease: 'none' }, 0)
    .to(scene.background, {
      r: 0.965, g: 0.929, b: 0.824, // cream #f6ecd2
      ease: 'none',
    }, 0);

  // CTA text animations — staggered mask-reveal + fade
  const ctaHeading = document.querySelector('#cta-block [data-anim="heading-reveal"]');
  const ctaBody    = document.querySelector('#cta-block [data-anim="body-fade"]');
  const ctaAction  = document.querySelector('#cta-block [data-anim="cta-fade"]');

  const ctaTextTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#section-yield',
      start: 'top 50%',
      end: 'center center',
      scrub: 1,
    },
  });

  if (ctaHeading) {
    ctaTextTl.to(ctaHeading, { y: '0%', duration: 0.6, ease: 'power3.out' }, 0);
  }
  if (ctaBody) {
    ctaTextTl.to(ctaBody, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.15);
  }
  if (ctaAction) {
    ctaTextTl.to(ctaAction, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.3);
  }

  // Hide scroll indicator after first section
  ScrollTrigger.create({
    trigger: '#section-culturing',
    start: 'top 90%',
    onEnter: () => scrollIndicator.classList.add('hidden'),
    onLeaveBack: () => scrollIndicator.classList.remove('hidden'),
  });
}

/* ============================================================
   PHASE 6: WEB AUDIO — PROCEDURAL DRONE
   ============================================================ */
function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Master gain
  gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.0; // start muted
  gainNode.connect(audioCtx.destination);

  // Low-pass filter (modulated by scroll velocity)
  filterNode = audioCtx.createBiquadFilter();
  filterNode.type = 'lowpass';
  filterNode.frequency.value = 200;
  filterNode.Q.value = 5;
  filterNode.connect(gainNode);

  // Oscillator 1 — warm sawtooth drone (55 Hz = A1)
  const osc1 = audioCtx.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.value = 55;

  const osc1Gain = audioCtx.createGain();
  osc1Gain.gain.value = 0.12;
  osc1.connect(osc1Gain);
  osc1Gain.connect(filterNode);
  osc1.start();

  // Oscillator 2 — harmonic sine (82.5 Hz = E2, perfect fifth)
  const osc2 = audioCtx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = 82.5;

  const osc2Gain = audioCtx.createGain();
  osc2Gain.gain.value = 0.08;
  osc2.connect(osc2Gain);
  osc2Gain.connect(filterNode);
  osc2.start();

  // Oscillator 3 — sub bass (27.5 Hz = A0)
  const osc3 = audioCtx.createOscillator();
  osc3.type = 'sine';
  osc3.frequency.value = 27.5;

  const osc3Gain = audioCtx.createGain();
  osc3Gain.gain.value = 0.06;
  osc3.connect(osc3Gain);
  osc3Gain.connect(gainNode); // bypass filter for deep sub
  osc3.start();
}

function toggleAudio() {
  if (!audioCtx) return;

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  audioPlaying = !audioPlaying;

  gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
  gainNode.gain.setTargetAtTime(
    audioPlaying ? 0.15 : 0.0,
    audioCtx.currentTime,
    0.3 // smooth crossfade
  );

  audioToggle.classList.toggle('audio-toggle--playing', audioPlaying);
}

/* Modulate filter by scroll velocity during Churn section */
function updateAudioFilter() {
  if (!filterNode || !audioPlaying) return;

  // Map scroll velocity to filter frequency (200 Hz → 2000 Hz)
  const absVel = Math.abs(scrollVelocity);
  const targetFreq = 200 + Math.min(absVel * 0.5, 1800);

  filterNode.frequency.setTargetAtTime(
    targetFreq,
    audioCtx.currentTime,
    0.05
  );
}

/* ============================================================
   PHASE 7: RENDER LOOP
   ============================================================ */
function animate() {
  requestAnimationFrame(animate);

  // No allocations here — all vectors/matrices allocated globally

  // Update audio filter
  updateAudioFilter();

  // Render
  renderer.render(scene, camera);
}

/* ============================================================
   PHASE 8: ENTRY FLOW
   ============================================================ */
async function init() {
  // Phase 1: Scene
  initScene();

  // Phase 2: Lighting (needs renderer for PMREM)
  initLighting();

  // Phase 3: Load model
  await loadModel();

  // Phase 4: Float animation
  initFloatAnimation();

  // Phase 5: Audio setup (not playing yet)
  initAudio();

  // Start render loop
  animate();

  // Phase 6: ScrollTrigger (after model loaded)
  initScrollChoreography();

  // Refresh ScrollTrigger after fonts settle
  document.fonts.ready.then(() => {
    ScrollTrigger.refresh();
  });
}

// --- Entry Button ---
enterBtn.addEventListener('click', () => {
  loadingScreen.classList.add('hidden');

  // Resume audio context (browser autoplay policy)
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  // Refresh scroll positions after loading screen removed
  setTimeout(() => ScrollTrigger.refresh(), 100);
});

// --- Audio Toggle ---
audioToggle.addEventListener('click', toggleAudio);

// --- Boot ---
init();
