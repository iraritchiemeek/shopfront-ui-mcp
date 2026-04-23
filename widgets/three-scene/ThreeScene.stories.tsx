import type { Meta, StoryObj } from "@storybook/react";
import { McpThemeDecorator } from "../../.storybook/decorator.js";
import { ThreeSceneView } from "./components/ThreeSceneView.js";
import type { Payload } from "./types.js";

const meta: Meta = {
  title: "MCP Apps/Three Scene",
  decorators: [McpThemeDecorator],
};
export default meta;

type Story = StoryObj<{}>;

const Frame = ({ data }: { data: Payload }) => (
  <div style={{ height: 480 }}>
    <ThreeSceneView data={data} />
  </div>
);

// ── 1. Parametric torus knot with standard material ──────────────────
const torusKnotCode = `
camera.position.set(0, 0, 4.5);
const geo = new THREE.TorusKnotGeometry(1, 0.32, 180, 24);
const mat = new THREE.MeshStandardMaterial({
  color: 0xef4444,
  metalness: 0.25,
  roughness: 0.35,
});
const mesh = new THREE.Mesh(geo, mat);
scene.add(mesh);
`;

export const TorusKnot: Story = {
  render: () => (
    <Frame
      data={{
        title: "Parametric torus knot",
        code: torusKnotCode,
      }}
    />
  ),
};

// ── 2. Icosahedron with vertex colors ────────────────────────────────
const vertexColorsCode = `
camera.position.set(0, 0, 3.6);
const geo = new THREE.IcosahedronGeometry(1.2, 0);
const position = geo.attributes.position;
const colors = new Float32Array(position.count * 3);
for (let i = 0; i < position.count; i++) {
  const x = position.getX(i);
  const y = position.getY(i);
  const z = position.getZ(i);
  colors[i * 3 + 0] = (x + 1.2) / 2.4;
  colors[i * 3 + 1] = (y + 1.2) / 2.4;
  colors[i * 3 + 2] = (z + 1.2) / 2.4;
}
geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
const mat = new THREE.MeshStandardMaterial({
  vertexColors: true,
  flatShading: true,
  roughness: 0.6,
  metalness: 0.1,
});
scene.add(new THREE.Mesh(geo, mat));
`;

export const VertexColoredIcosahedron: Story = {
  render: () => (
    <Frame
      data={{
        title: "Icosahedron — per-vertex colour",
        code: vertexColorsCode,
      }}
    />
  ),
};

// ── 3. Custom shader material ────────────────────────────────────────
const shaderCode = `
camera.position.set(0, 0, 3);
const geo = new THREE.SphereGeometry(1.1, 128, 128);
const mat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 } },
  vertexShader: [
    'varying vec3 vPos;',
    'void main() {',
    '  vPos = position;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}',
  ].join('\\n'),
  fragmentShader: [
    'uniform float uTime;',
    'varying vec3 vPos;',
    'void main() {',
    '  float bands = sin(vPos.y * 6.0 + uTime * 1.5) * 0.5 + 0.5;',
    '  vec3 col = mix(vec3(0.05,0.05,0.08), vec3(0.95,0.6,0.1), bands);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}',
  ].join('\\n'),
});
const mesh = new THREE.Mesh(geo, mat);
scene.add(mesh);
return {
  tick: (dt) => {
    mat.uniforms.uTime.value += dt;
  },
};
`;

export const ShaderSphere: Story = {
  render: () => (
    <Frame
      data={{
        title: "Fragment shader — orbital bands",
        code: shaderCode,
        autoRotate: false,
      }}
    />
  ),
};

// ── 4. Animated orbiting cubes via tick(dt) ──────────────────────────
const orbitCode = `
camera.position.set(0, 1.5, 5);
camera.lookAt(0, 0, 0);
const group = new THREE.Group();
scene.add(group);
const cubes = [];
for (let i = 0; i < 8; i++) {
  const g = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(i / 8, 0.6, 0.55),
    roughness: 0.4,
  });
  const cube = new THREE.Mesh(g, m);
  const angle = (i / 8) * Math.PI * 2;
  cube.position.set(Math.cos(angle) * 2, 0, Math.sin(angle) * 2);
  group.add(cube);
  cubes.push({ cube, angle });
}
let t = 0;
return {
  tick: (dt) => {
    t += dt;
    for (const { cube, angle } of cubes) {
      const a = angle + t * 0.8;
      cube.position.x = Math.cos(a) * 2;
      cube.position.z = Math.sin(a) * 2;
      cube.position.y = Math.sin(a * 2) * 0.4;
      cube.rotation.x += dt;
      cube.rotation.y += dt * 1.3;
    }
  },
};
`;

export const OrbitingCubes: Story = {
  render: () => (
    <Frame
      data={{
        title: "Orbiting cubes — tick(dt) animation",
        code: orbitCode,
        autoRotate: false,
      }}
    />
  ),
};

// ── 5. Lorenz attractor — large-scale scene via structured config ────
const lorenzCode = `
const N = 500;
const positions = new Float32Array(N * 3);
const colors = new Float32Array(N * 3);
for (let i = 0; i < N; i++) {
  positions[i*3+0] = (Math.random() - 0.5) * 0.4;
  positions[i*3+1] = (Math.random() - 0.5) * 0.4;
  positions[i*3+2] = 0.1 + (Math.random() - 0.5) * 0.4;
  colors[i*3+0] = 0.3; colors[i*3+1] = 0.6; colors[i*3+2] = 1.0;
}
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
const mat = new THREE.PointsMaterial({
  size: 0.6,
  vertexColors: true,
  transparent: true,
  opacity: 0.85,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const points = new THREE.Points(geo, mat);
scene.add(points);
const sigma = 10, rho = 28, beta = 8/3;
const dt = 0.005, sub = 3;
return {
  tick: () => {
    const pos = geo.attributes.position.array;
    const col = geo.attributes.color.array;
    for (let i = 0; i < N; i++) {
      const ix = i*3;
      let x = pos[ix], y = pos[ix+1], z = pos[ix+2];
      let vx = 0, vy = 0, vz = 0;
      for (let s = 0; s < sub; s++) {
        vx = sigma * (y - x);
        vy = x * (rho - z) - y;
        vz = x * y - beta * z;
        x += vx * dt; y += vy * dt; z += vz * dt;
      }
      pos[ix] = x; pos[ix+1] = y; pos[ix+2] = z;
      const speed = Math.min(Math.sqrt(vx*vx + vy*vy + vz*vz) / 120, 1);
      col[ix] = 0.3 + speed * 0.7;
      col[ix+1] = 0.3 + speed * 0.3;
      col[ix+2] = 1.0 - speed * 0.6;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  },
  dispose: () => { geo.dispose(); mat.dispose(); },
};
`;

export const LorenzAttractor: Story = {
  render: () => (
    <Frame
      data={{
        title: "Lorenz attractor — large-scale scene + additive particles",
        code: lorenzCode,
        background: "#000000",
        cameraPosition: [0, -90, 25],
        cameraLookAt: [0, 0, 25],
        clearLights: true,
        autoRotateAxis: "z",
        autoRotateSpeed: 0.15,
      }}
    />
  ),
};
