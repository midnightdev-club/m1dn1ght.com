import * as THREE from 'three';

// ---------------------------------------------------------------------------
// M1DN1GHT — Dark Signal
// Shredded cobalt orbs refracted through vertical glass blinds, film grain.
// ---------------------------------------------------------------------------

const canvas = document.getElementById('scene');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uMouse;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  // Radial gradient matching the brand orb:
  // core #0A1434 -> mid #12266B -> rim #3D6BE0 -> transparent
  vec3 orb(vec2 q, vec2 c, float r) {
    float d = length(q - c) / r;
    vec3 core = vec3(0.039, 0.078, 0.204);
    vec3 mid  = vec3(0.071, 0.149, 0.420);
    vec3 rim  = vec3(0.239, 0.420, 0.878);
    vec3 col = vec3(0.0);
    if (d < 0.55) {
      col = mix(core, mid, d / 0.55);
    } else if (d < 0.8) {
      col = mix(mid, rim, (d - 0.55) / 0.25);
    } else if (d < 1.0) {
      col = rim * (1.0 - (d - 0.8) / 0.2);
    }
    return col;
  }

  vec3 field(vec2 fragPx) {
    vec2 q = fragPx / uRes.y;
    float aspect = uRes.x / uRes.y;
    float t = uTime;
    vec2 par = uMouse * 0.045;

    vec2 c1 = vec2(aspect * 0.66 + 0.025 * sin(t * 0.11),
                   0.62 + 0.03 * sin(t * 0.07 + 1.7)) + par;
    vec2 c2 = vec2(aspect * 0.27 + 0.03 * sin(t * 0.09 + 4.0),
                   0.26 + 0.025 * cos(t * 0.13)) + par * 1.7;
    // keep negative space on narrow/portrait screens
    float rs = min(1.0, aspect * 1.2);
    float r1 = (0.46 + 0.014 * sin(t * 0.21)) * rs;
    float r2 = (0.30 + 0.012 * sin(t * 0.17 + 2.0)) * rs;

    return orb(q, c1, r1) + orb(q, c2, r2);
  }

  void main() {
    vec2 frag = vUv * uRes;

    // vertical blinds: alternating strips, amplitude wave drifting through them
    float stripW = max(uRes.x / 88.0, 6.0);
    float idx = floor(frag.x / stripW);
    float dir = mod(idx, 2.0) * 2.0 - 1.0;
    float ampPx = (2.0 + 11.0 * abs(sin(idx * 0.23 + uTime * 0.32))) * (uRes.y / 400.0);
    vec2 p = vec2(frag.x, frag.y + dir * ampPx);

    // three-tap vertical soften
    float s = uRes.y / 400.0;
    vec3 col = field(p) * 0.5
             + field(p + vec2(0.0,  1.6 * s)) * 0.25
             + field(p + vec2(0.0, -1.6 * s)) * 0.25;

    col += vec3(0.024, 0.027, 0.047); // ground #06070C

    // vignette
    vec2 v = vUv - 0.5;
    col *= 1.0 - 0.55 * dot(v, v);

    // animated film grain
    float g = hash(frag + vec2(fract(uTime * 0.7) * 97.0, fract(uTime * 0.31) * 113.0));
    col += (g - 0.5) * 0.05;

    gl_FragColor = vec4(col, 1.0);
  }
`;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
} catch (e) {
  canvas.remove(); // CSS gradient fallback stays visible
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const uniforms = {
  uTime: { value: 12.0 },
  uRes: { value: new THREE.Vector2(1, 1) },
  uMouse: { value: new THREE.Vector2(0, 0) },
};

scene.add(new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader })
));

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.getDrawingBufferSize(uniforms.uRes.value);
}
window.addEventListener('resize', () => { resize(); if (reducedMotion) renderer.render(scene, camera); });
resize();

const mouseTarget = new THREE.Vector2(0, 0);
window.addEventListener('pointermove', (e) => {
  mouseTarget.set(
    (e.clientX / window.innerWidth) * 2 - 1,
    -((e.clientY / window.innerHeight) * 2 - 1)
  );
});

const clock = new THREE.Clock();
function loop() {
  uniforms.uTime.value += Math.min(clock.getDelta(), 0.05);
  uniforms.uMouse.value.lerp(mouseTarget, 0.045);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

if (reducedMotion) {
  renderer.render(scene, camera); // single still frame
} else {
  loop();
}

// ---------------------------------------------------------------------------
// UTC clock
// ---------------------------------------------------------------------------
const clockEl = document.getElementById('clock');
function tick() {
  clockEl.textContent = new Date().toISOString().slice(11, 19);
}
tick();
setInterval(tick, 1000);
