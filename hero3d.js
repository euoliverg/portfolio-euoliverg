// Interactive hero core: a breathing point-shell lit by the pointer, a faint
// wireframe cage, an orbit ring, satellites and a drifting particle field.
// Drag (mouse or horizontal touch swipe) spins it a full 360° with inertia.
// Three.js is fetched only when this module runs, so weak devices never pay
// for it (main.js decides).

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const SHELL_VERTEX = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uPulse;
  uniform float uPixel;
  uniform vec3 uLight;
  varying float vLum;
  varying float vFade;

  void main() {
    vec3 n = normalize(position);
    float wave = sin(n.x * 3.1 + uTime * .55) * sin(n.y * 3.7 - uTime * .45) * sin(n.z * 3.3 + uTime * .38);
    float ripple = sin(aSeed * 6.2831 + uTime * 2.2) * .05 * uPulse;
    vec3 p = n * (1.0 + wave * .1 + ripple);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec3 worldN = normalize(mat3(modelMatrix) * n);
    float diff = max(dot(worldN, normalize(uLight)), 0.0);
    vLum = .24 + diff * .95 + pow(diff, 14.0) * 1.1;
    vFade = smoothstep(-12.5, -7.5, mv.z);

    gl_PointSize = (2.0 + aSeed * 2.4) * uPixel * (11.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const SHELL_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform float uAlpha;
  varying float vLum;
  varying float vFade;

  void main() {
    float d = length(gl_PointCoord - .5);
    if (d > .5) discard;
    float soft = smoothstep(.5, .05, d);
    vec3 col = mix(uColor, uAccent, smoothstep(.95, 1.7, vLum) * .6);
    gl_FragColor = vec4(col * min(vLum, 1.3), soft * (.38 + .62 * vFade) * min(vLum, 1.0) * uAlpha);
  }
`;

const DUST_VERTEX = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixel;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    p.y = mod(p.y + uTime * (.06 + aSeed * .12) + 7.0, 14.0) - 7.0;
    p.x += sin(uTime * .2 + aSeed * 12.0) * .25;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vAlpha = smoothstep(-22.0, -4.0, mv.z) * (.25 + aSeed * .5);
    gl_PointSize = (1.0 + aSeed * 1.6) * uPixel * (6.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const DUST_FRAGMENT = /* glsl */ `
  uniform float uAlpha;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - .5);
    if (d > .5) discard;
    gl_FragColor = vec4(vec3(.92, .91, .89), smoothstep(.5, 0.0, d) * vAlpha * uAlpha);
  }
`;

export async function initHero3D(canvas, { mobile = false } = {}) {
  const THREE = await import(THREE_URL);
  const hero = canvas.closest('[data-hero]') || canvas.parentElement;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  let pixelRatio = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
  renderer.setPixelRatio(pixelRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  camera.position.set(0, 0, 10);

  const rig = new THREE.Group(); // positioned per layout + scroll
  const core = new THREE.Group(); // rotated by drag/inertia
  rig.add(core);
  scene.add(rig);

  const uniformsShared = {
    uTime: { value: 0 },
    uPixel: { value: pixelRatio },
    uAlpha: { value: 1 }
  };

  // Point shell on a Fibonacci sphere.
  const SHELL_COUNT = mobile ? 1800 : 3600;
  const shellPositions = new Float32Array(SHELL_COUNT * 3);
  const shellSeeds = new Float32Array(SHELL_COUNT);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < SHELL_COUNT; i++) {
    const y = 1 - (i / (SHELL_COUNT - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = i * golden;
    shellPositions.set([Math.cos(theta) * r, y, Math.sin(theta) * r], i * 3);
    shellSeeds[i] = Math.random();
  }
  const shellGeometry = new THREE.BufferGeometry();
  shellGeometry.setAttribute('position', new THREE.BufferAttribute(shellPositions, 3));
  shellGeometry.setAttribute('aSeed', new THREE.BufferAttribute(shellSeeds, 1));
  const shellMaterial = new THREE.ShaderMaterial({
    vertexShader: SHELL_VERTEX,
    fragmentShader: SHELL_FRAGMENT,
    uniforms: {
      ...uniformsShared,
      uPulse: { value: 0 },
      uLight: { value: new THREE.Vector3(-2, 2, 3) },
      uColor: { value: new THREE.Color('#eceae4') },
      uAccent: { value: new THREE.Color('#9aa3ff') }
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const shell = new THREE.Points(shellGeometry, shellMaterial);
  shell.scale.setScalar(1.55);
  core.add(shell);

  // Wireframe cage.
  const cageMaterial = new THREE.LineBasicMaterial({ color: 0xeceae4, transparent: true, opacity: .07, depthWrite: false });
  const cage = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.25, 1)), cageMaterial);
  core.add(cage);

  // Orbit ring of points, tilted.
  const RING_COUNT = mobile ? 260 : 520;
  const ringPositions = new Float32Array(RING_COUNT * 3);
  const ringSeeds = new Float32Array(RING_COUNT);
  for (let i = 0; i < RING_COUNT; i++) {
    const a = (i / RING_COUNT) * Math.PI * 2;
    const radius = 2.95 + (Math.random() - .5) * .18;
    ringPositions.set([Math.cos(a) * radius, (Math.random() - .5) * .06, Math.sin(a) * radius], i * 3);
    ringSeeds[i] = Math.random();
  }
  const ringGeometry = new THREE.BufferGeometry();
  ringGeometry.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));
  ringGeometry.setAttribute('aSeed', new THREE.BufferAttribute(ringSeeds, 1));
  const ringMaterial = new THREE.ShaderMaterial({
    vertexShader: DUST_VERTEX.replace('p.y = mod(p.y + uTime * (.06 + aSeed * .12) + 7.0, 14.0) - 7.0;', '').replace('p.x += sin(uTime * .2 + aSeed * 12.0) * .25;', ''),
    fragmentShader: DUST_FRAGMENT,
    uniforms: { ...uniformsShared },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const ring = new THREE.Points(ringGeometry, ringMaterial);
  ring.rotation.set(1.18, 0, .32);
  rig.add(ring);

  // Satellites: small wire octahedra orbiting the core.
  const satellites = [];
  const satMaterial = new THREE.LineBasicMaterial({ color: 0xeceae4, transparent: true, opacity: .55, depthWrite: false });
  const accentMaterial = new THREE.LineBasicMaterial({ color: 0x9aa3ff, transparent: true, opacity: .8, depthWrite: false });
  [[3.6, .55, .0, .14], [3.1, -.4, 2.2, .1], [4.2, .2, 4.1, .08]].forEach(([radius, tilt, phase, size], index) => {
    const mesh = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.OctahedronGeometry(size, 0)),
      index === 1 ? accentMaterial : satMaterial
    );
    satellites.push({ mesh, radius, tilt, phase, speed: .18 + index * .05 });
    rig.add(mesh);
  });

  // Ambient dust field.
  const DUST_COUNT = mobile ? 380 : 1000;
  const dustPositions = new Float32Array(DUST_COUNT * 3);
  const dustSeeds = new Float32Array(DUST_COUNT);
  for (let i = 0; i < DUST_COUNT; i++) {
    dustPositions.set([(Math.random() - .5) * 26, (Math.random() - .5) * 14, -14 + Math.random() * 16], i * 3);
    dustSeeds[i] = Math.random();
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  dustGeometry.setAttribute('aSeed', new THREE.BufferAttribute(dustSeeds, 1));
  const dust = new THREE.Points(dustGeometry, new THREE.ShaderMaterial({
    vertexShader: DUST_VERTEX,
    fragmentShader: DUST_FRAGMENT,
    uniforms: { ...uniformsShared },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  scene.add(dust);

  // ---- Interaction state -------------------------------------------------
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const spin = { x: .25, y: 0, vx: 0, vy: 0 };
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let pulse = 0;
  let pulseTarget = 0;
  let scrollProgress = 0;
  let layout = { x: 1.9, y: .15, scale: 1 };

  const coreScreenDistance = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const projected = rig.position.clone().project(camera);
    const sx = rect.left + (projected.x * .5 + .5) * rect.width;
    const sy = rect.top + (-projected.y * .5 + .5) * rect.height;
    return Math.hypot(clientX - sx, clientY - sy) / Math.min(rect.width, rect.height);
  };

  const onPointerMove = (event) => {
    pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (event.clientY / window.innerHeight) * 2 - 1;
    if (event.pointerType === 'mouse') pulseTarget = coreScreenDistance(event.clientX, event.clientY) < .26 ? 1 : 0;
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    spin.vy = dx * .0065;
    spin.vx = event.pointerType === 'mouse' ? dy * .0045 : 0;
    spin.y += spin.vy;
    spin.x = Math.max(-1.1, Math.min(1.1, spin.x + spin.vx));
  };
  const onPointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target.closest('a, button')) return;
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    pulseTarget = 1;
    hero.classList.add('is-grabbing');
  };
  const onPointerUp = () => {
    dragging = false;
    pulseTarget = 0;
    hero.classList.remove('is-grabbing');
  };

  hero.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  window.addEventListener('pointercancel', onPointerUp, { passive: true });

  // ---- Layout -----------------------------------------------------------
  const resize = () => {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const aspect = width / height;
    if (aspect > 1.15) layout = { x: Math.min(2.6, aspect * 1.25), y: .35, scale: 1 };
    else if (aspect > .8) layout = { x: .9, y: 1.2, scale: .82 };
    else layout = { x: 0, y: 1.75, scale: .72 };
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  const onScroll = () => {
    const h = hero.offsetHeight || window.innerHeight;
    scrollProgress = Math.min(1, Math.max(0, window.scrollY / h));
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---- Loop with visibility + performance guard -------------------------
  const clock = new THREE.Clock();
  let raf = 0;
  let inView = true;
  let frames = 0;
  let slowFrames = 0;
  let degraded = false;

  const frame = () => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, clock.getDelta());
    const t = clock.elapsedTime;

    if (!degraded && frames < 150) {
      frames++;
      if (dt > .03) slowFrames++;
      if (frames === 150 && slowFrames > 60) {
        degraded = true;
        pixelRatio = 1;
        renderer.setPixelRatio(1);
        uniformsShared.uPixel.value = 1;
        dustGeometry.setDrawRange(0, Math.floor(DUST_COUNT / 2));
        resize();
      }
    }

    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);
    pulse += (pulseTarget - pulse) * Math.min(1, dt * 4);

    if (!dragging) {
      spin.vy *= .95;
      spin.vx *= .9;
      spin.y += spin.vy + dt * .12;
      spin.x += spin.vx + (.25 - spin.x) * dt * .6;
    }
    core.rotation.set(spin.x, spin.y, 0);
    cage.rotation.y = -t * .05;

    const sp = scrollProgress;
    rig.position.set(layout.x - sp * layout.x * .35, layout.y + sp * 1.6, -sp * 2.5);
    rig.scale.setScalar(layout.scale * (1 + sp * .25));
    ring.rotation.z = .32 + t * .03 + sp * .8;

    satellites.forEach((sat) => {
      const a = sat.phase + t * sat.speed;
      sat.mesh.position.set(Math.cos(a) * sat.radius, Math.sin(a * 1.3) * sat.tilt * 2, Math.sin(a) * sat.radius);
      sat.mesh.rotation.set(t * .6, t * .4, 0);
    });

    camera.position.x = pointer.x * .7;
    camera.position.y = -pointer.y * .45;
    camera.lookAt(0, .3, 0);

    shellMaterial.uniforms.uLight.value.set(pointer.x * 4 - 1.5, -pointer.y * 4 + 1.8, 3.2);
    shellMaterial.uniforms.uPulse.value = pulse;
    uniformsShared.uTime.value = t;
    uniformsShared.uAlpha.value = 1 - sp * .7;

    renderer.render(scene, camera);
  };

  const start = () => { if (!raf && inView && !document.hidden) { clock.getDelta(); raf = requestAnimationFrame(frame); } };
  const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

  const viewObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) start(); else stop();
  });
  viewObserver.observe(hero);
  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVisibility);

  // Render one frame before revealing so the canvas never fades in empty.
  frame();

  return {
    destroy() {
      stop();
      viewObserver.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      hero.removeEventListener('pointerdown', onPointerDown);
      renderer.dispose();
    }
  };
}
