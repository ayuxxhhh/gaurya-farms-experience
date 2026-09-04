/* ============================================================
   Gaurya Farms — Ancestral Preservation
   main.js — Cinematic 3D & GSAP ScrollTrigger
   ============================================================ */

import * as THREE from 'https://esm.sh/three@0.170.0';
import { GLTFLoader } from 'https://esm.sh/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'https://esm.sh/gsap@3.12.7';
import { ScrollTrigger } from 'https://esm.sh/gsap@3.12.7/ScrollTrigger';
import Lenis from 'https://esm.sh/@studio-freight/lenis@1.0.29';

gsap.registerPlugin(ScrollTrigger);

// Custom Cursor Logic
const cursorDot = document.getElementById('cursor-dot');
const cursorOutline = document.getElementById('cursor-outline');
window.addEventListener('mousemove', (e) => {
  cursorDot.style.left = `${e.clientX}px`;
  cursorDot.style.top = `${e.clientY}px`;
  cursorOutline.animate({
    left: `${e.clientX}px`,
    top: `${e.clientY}px`
  }, { duration: 150, fill: "forwards" });
});

/* ============================================================
   GLOBALS
   ============================================================ */
let jarGroup = null;
let renderer, scene, camera, envMap;
let floatTween = null;
let scrollVelocity = 0;

const canvas          = document.getElementById('webgl-canvas');
const loadingScreen   = document.getElementById('loading-screen');
const loadingBar      = document.getElementById('loading-bar');
const loadingPercent  = document.getElementById('loading-percent');
const enterBtn        = document.getElementById('enter-btn');
const scrollIndicator = document.getElementById('scroll-indicator');
const nav             = document.getElementById('nav');

/* ============================================================
   PHASE 1: THREE.JS RENDERER & SCENE
   ============================================================ */
function initScene() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8; // Dark, cinematic exposure
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1A1A1A); // Charcoal background from playbook
  scene.fog = new THREE.Fog(0x1A1A1A, 2, 10);

  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 7);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/* ============================================================
   PHASE 2: CINEMATIC LIGHTING
   ============================================================ */
function initLighting() {
  // Very low ambient light
  scene.add(new THREE.AmbientLight(0xffffff, 0.1));

  // Dramatic Top/Side Spotlight
  const spotLight = new THREE.SpotLight(0xffeedd, 50);
  spotLight.position.set(3, 6, 3);
  spotLight.angle = Math.PI / 6;
  spotLight.penumbra = 0.5;
  scene.add(spotLight);

  // Soft gold rim light from behind
  const rimLight = new THREE.PointLight(0xC5A059, 15, 20);
  rimLight.position.set(-3, 2, -4);
  scene.add(rimLight);

  // Environment Map for highly reflective dark glass
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileCubemapShader();
  const envScene = new THREE.Scene();
  
  // Create abstract soft light shapes for reflections
  const makeLight = (pos, color, scale) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(scale, scale), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    mesh.position.copy(pos);
    mesh.lookAt(0,0,0);
    envScene.add(mesh);
  };
  makeLight(new THREE.Vector3(5, 5, 5), 0xffffff, 4);
  makeLight(new THREE.Vector3(-5, -2, -5), 0xC5A059, 8); // Gold reflection

  envMap = pmrem.fromScene(envScene, 0, 0.01, 100).texture;
  scene.environment = envMap;
  pmrem.dispose();
}

/* ============================================================
   PHASE 3: MODEL LOADING (DARK UV GLASS)
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
    loader.load('assets/models/final.glb', (gltf) => {
      jarGroup = new THREE.Group();
      const model = gltf.scene;

      // Center & normalize scale
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z);
      model.position.sub(center);
      model.scale.setScalar(2.5 / maxDim);

      // Apply environment map to all materials
      model.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.envMap = envMap;
          child.material.envMapIntensity = 1.0;
          child.material.needsUpdate = true;
        }
      });

      jarGroup.add(model);
      jarGroup.position.set(0, -0.5, 0);
      scene.add(jarGroup);
      resolve();
    }, undefined, () => {
      createFallbackJar();
      resolve();
    });
  });
}

function createFallbackJar() {
  jarGroup = new THREE.Group();

  // Dark UV Protective Glass (Brand Playbook aesthetic)
  const profile = [];
  for (let i = 0; i <= 10; i++) profile.push(new THREE.Vector2(0.55 + 0.25 * Math.sin((i/10) * Math.PI * 0.5), -1.0 + (i/10) * 0.4));
  profile.push(new THREE.Vector2(0.8, -0.4), new THREE.Vector2(0.82, 0.0), new THREE.Vector2(0.82, 0.5), new THREE.Vector2(0.80, 0.7));
  profile.push(new THREE.Vector2(0.75, 0.8), new THREE.Vector2(0.65, 0.88), new THREE.Vector2(0.55, 0.92), new THREE.Vector2(0.50, 0.95), new THREE.Vector2(0.48, 1.0));
  profile.push(new THREE.Vector2(0.52, 1.02), new THREE.Vector2(0.52, 1.05));

  const glassGeo = new THREE.LatheGeometry(profile, 64);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x110a05, // Very dark brown/black
    transmission: 0.2, // Barely transmissive
    roughness: 0.1,
    metalness: 0.2,
    ior: 1.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    envMap: envMap,
    envMapIntensity: 2.0,
    side: THREE.DoubleSide,
  });
  jarGroup.add(new THREE.Mesh(glassGeo, glassMat));

  // Cap (Brushed Gold)
  const capGeo = new THREE.CylinderGeometry(0.53, 0.50, 0.15, 64);
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xC5A059, metalness: 0.7, roughness: 0.3, envMap: envMap, envMapIntensity: 1.5
  });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 1.1;
  jarGroup.add(cap);

  // Minimalist Label
  const labelGeo = new THREE.CylinderGeometry(0.84, 0.84, 0.6, 64, 1, true);
  const labelMat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.9 });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.y = 0.15;
  jarGroup.add(label);

  jarGroup.position.set(0, -0.5, 0);
  scene.add(jarGroup);
  
  loadingBar.style.width = '100%';
  loadingPercent.textContent = '100%';
  enterBtn.classList.add('visible');
}

/* ============================================================
   PHASE 4: HEAVY CINEMATIC DRIFT
   ============================================================ */
function initFloatAnimation() {
  if (!jarGroup) return;
  floatTween = gsap.to(jarGroup.position, {
    y: '+=0.05',
    duration: 4,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  });
}

/* ============================================================
   PHASE 5: GSAP SCROLL CHOREOGRAPHY
   ============================================================ */
function initScrollChoreography() {
  if (!jarGroup) return;

  function revealSection(sectionId) {
    const section = document.querySelector(sectionId);
    if (!section) return;
    const tl = gsap.timeline({ scrollTrigger: { trigger: sectionId, start: 'top 65%', end: 'top 20%', scrub: 1 }});
    tl.to(section.querySelector('[data-anim="step"]'), { opacity: 1, duration: 0.3 }, 0)
      .to(section.querySelector('[data-anim="heading-reveal"]'), { y: '0%', duration: 0.6, ease: 'power3.out' }, 0.05)
      .to(section.querySelector('[data-anim="line-grow"]'), { width: '40px', duration: 0.4, ease: 'power2.out' }, 0.2)
      .to(section.querySelector('[data-anim="body-fade"]'), { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.3);
  }

  ['#section-source', '#section-culturing', '#section-churn', '#section-clarification'].forEach(revealSection);

  // Section 1: Intro (Jar scales up slightly from fog)
  gsap.timeline({ scrollTrigger: { trigger: '#section-source', start: 'top top', end: 'bottom top', scrub: 1 }})
    .fromTo(jarGroup.scale, { x: 0.8, y: 0.8, z: 0.8 }, { x: 1, y: 1, z: 1, ease: 'none' }, 0)
    .to(jarGroup.position, { z: -1, ease: 'none' }, 0);

  // Section 2: Culturing (Jar rotates slowly)
  gsap.timeline({ scrollTrigger: { trigger: '#section-culturing', start: 'top top', end: 'bottom top', scrub: 1 }})
    .to(jarGroup.rotation, { y: Math.PI / 2, ease: 'none' }, 0)
    .to(jarGroup.position, { z: 0, ease: 'none' }, 0);

  // Section 3: Churn (Velocity mapped rotation)
  ScrollTrigger.create({
    trigger: '#section-churn', start: 'top top', end: 'bottom top', scrub: true,
    onUpdate: (self) => {
      if (jarGroup) jarGroup.rotation.y += (self.getVelocity() * 0.0003 - jarGroup.rotation.y * 0.1) * 0.1;
    }
  });

  // Section 4: Clarification (Exposure increases slightly, highlighting gold)
  gsap.timeline({ scrollTrigger: { trigger: '#section-clarification', start: 'top top', end: 'bottom top', scrub: 1 }})
    .to(renderer, { toneMappingExposure: 1.5, ease: 'none' }, 0)
    .to(jarGroup.rotation, { y: Math.PI, ease: 'none' }, 0);

  // Section 5: Yield (Final CTA, snap to center)
  gsap.timeline({ scrollTrigger: { trigger: '#section-yield', start: 'top top', end: 'center center', scrub: 1 }})
    .to(jarGroup.position, { x: 0, y: -0.2, z: 1, ease: 'none' }, 0)
    .to(jarGroup.rotation, { y: Math.PI * 2, ease: 'none' }, 0)
    .to(renderer, { toneMappingExposure: 1.0, ease: 'none' }, 0);

  const ctaTl = gsap.timeline({ scrollTrigger: { trigger: '#section-yield', start: 'top 50%', end: 'center center', scrub: 1 }});
  ctaTl.to('#cta-block [data-anim="heading-reveal"]', { y: '0%', duration: 0.6, ease: 'power3.out' }, 0)
       .to('#cta-block [data-anim="body-fade"]', { opacity: 1, y: 0, duration: 0.5 }, 0.2)
       .to('#cta-block [data-anim="cta-fade"]', { opacity: 1, y: 0, duration: 0.5 }, 0.4);

  ScrollTrigger.create({
    trigger: '#section-culturing', start: 'top 90%',
    onEnter: () => scrollIndicator.classList.add('hidden'),
    onLeaveBack: () => scrollIndicator.classList.remove('hidden')
  });
}

let lenis;

function animate(time) {
  if (lenis) lenis.raf(time);
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

async function init() {
  // Initialize Lenis
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time)=>{ lenis.raf(time * 1000) });
  gsap.ticker.lagSmoothing(0);

  initScene();
  initLighting();
  await loadModel();
  initFloatAnimation();
  requestAnimationFrame(animate);
  initScrollChoreography();
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

enterBtn.addEventListener('click', () => {
  loadingScreen.classList.add('hidden');
  nav.classList.add('visible');
  setTimeout(() => ScrollTrigger.refresh(), 200);
});

init();
