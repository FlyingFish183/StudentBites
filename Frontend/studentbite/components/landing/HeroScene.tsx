"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/** Brand enamel / sign paint — keep in sync with globals.css tokens. */
const ENAMEL = 0x0c4a4e;
const ENAMEL_DEEP = 0x08383c;
const SIGN = 0xffce2e;
const CHILI = 0xee3b2e;
const MINT = 0x5fc4a8;
const PANEL = 0xfbf4e2;
const MANGO = 0xf08c2e;

type Floaty = {
  mesh: THREE.Mesh;
  base: THREE.Vector3;
  amp: number;
  speed: number;
  spin: THREE.Vector3;
  phase: number;
};

/**
 * Full-bleed Three.js hero: floating glass panels + brand-color orbs,
 * mouse parallax, and gentle procedural motion (Clock + sine oscillation).
 */
export default function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const w = mount.clientWidth || window.innerWidth;
    const h = mount.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(ENAMEL, 0.045);

    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 80);
    camera.position.set(0, 0.35, 7.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    renderer.setClearColor(ENAMEL, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    // Soft enamel gradient sphere as atmosphere
    const skyGeo = new THREE.SphereGeometry(28, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color(ENAMEL_DEEP) },
        mid: { value: new THREE.Color(ENAMEL) },
        bot: { value: new THREE.Color(0x0a3a3e) },
      },
      vertexShader: /* glsl */ `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 top;
        uniform vec3 mid;
        uniform vec3 bot;
        varying vec3 vPos;
        void main() {
          float t = clamp(vPos.y / 28.0 * 0.5 + 0.5, 0.0, 1.0);
          vec3 c = mix(bot, mid, smoothstep(0.0, 0.45, t));
          c = mix(c, top, smoothstep(0.45, 1.0, t));
          gl_FragColor = vec4(c, 1.0);
        }
      `,
    });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    const hemi = new THREE.HemisphereLight(PANEL, ENAMEL_DEEP, 0.85);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(SIGN, 1.35);
    key.position.set(4, 6, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(MINT, 0.45);
    fill.position.set(-5, 2, -3);
    scene.add(fill);
    const rim = new THREE.PointLight(CHILI, 1.1, 18);
    rim.position.set(-2.5, -1, 3);
    scene.add(rim);

    const glassMat = (color: number, opacity = 0.55) =>
      new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.05,
        roughness: 0.12,
        transmission: 0.72,
        thickness: 0.55,
        ior: 1.42,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.2,
      });

    const solidMat = (color: number) =>
      new THREE.MeshStandardMaterial({
        color,
        metalness: 0.15,
        roughness: 0.35,
        emissive: color,
        emissiveIntensity: 0.18,
      });

    const floaties: Floaty[] = [];

    function addFloaty(
      mesh: THREE.Mesh,
      pos: [number, number, number],
      amp: number,
      speed: number,
      spin: [number, number, number],
    ) {
      mesh.position.set(...pos);
      scene.add(mesh);
      floaties.push({
        mesh,
        base: new THREE.Vector3(...pos),
        amp,
        speed,
        spin: new THREE.Vector3(...spin),
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Giant glass signboard slab (brand plane)
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 1.7, 0.12),
      glassMat(SIGN, 0.62),
    );
    addFloaty(board, [0.2, 0.55, 0], 0.18, 0.55, [0.08, 0.22, 0.04]);

    // Inner cream inset
    const inset = new THREE.Mesh(
      new THREE.BoxGeometry(2.9, 1.25, 0.08),
      glassMat(PANEL, 0.35),
    );
    addFloaty(inset, [0.2, 0.55, 0.12], 0.16, 0.55, [0.06, 0.18, 0.03]);

    // Chili price chip
    const price = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.55, 0.1),
      solidMat(CHILI),
    );
    addFloaty(price, [2.35, -0.85, 0.8], 0.28, 0.9, [0.3, 0.55, 0.12]);

    // Mint kcal orb
    const kcal = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 24), glassMat(MINT, 0.7));
    addFloaty(kcal, [-2.4, 0.9, 0.6], 0.32, 0.7, [0.2, 0.4, 0.15]);

    // Mango fat torus (bowl ring)
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.14, 16, 48),
      glassMat(MANGO, 0.65),
    );
    ring.rotation.x = Math.PI / 2.4;
    addFloaty(ring, [-1.6, -1.1, 1.1], 0.22, 0.65, [0.15, 0.5, 0.2]);

    // Protein bar
    const bar = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.12, 1.1, 6, 12),
      solidMat(CHILI),
    );
    bar.rotation.z = Math.PI / 5;
    addFloaty(bar, [1.7, 1.35, -0.4], 0.25, 0.8, [0.4, 0.2, 0.35]);

    // Scattered glass shards / menu tiles
    const tileGeo = new THREE.BoxGeometry(0.7, 0.7, 0.06);
    const tileColors = [PANEL, SIGN, MINT, ENAMEL];
    for (let i = 0; i < 8; i++) {
      const tile = new THREE.Mesh(
        tileGeo,
        i % 2 === 0 ? glassMat(tileColors[i % tileColors.length], 0.5) : solidMat(tileColors[i % tileColors.length]),
      );
      const a = (i / 8) * Math.PI * 2;
      addFloaty(
        tile,
        [Math.cos(a) * 3.2, Math.sin(a * 1.3) * 1.4 - 0.2, Math.sin(a) * 1.8 - 0.5],
        0.15 + (i % 3) * 0.08,
        0.4 + (i % 4) * 0.15,
        [0.1 + i * 0.02, 0.25 + i * 0.03, 0.08],
      );
    }

    // Particle dust
    const count = 120;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        color: SIGN,
        size: 0.035,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    scene.add(dust);

    const clock = new THREE.Clock();
    const mouse = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    const groupTilt = new THREE.Group();
    // Re-parent floaties into tilt group for unified hover parallax
    floaties.forEach((f) => {
      scene.remove(f.mesh);
      groupTilt.add(f.mesh);
    });
    scene.add(groupTilt);
    scene.remove(dust);
    groupTilt.add(dust);

    const onPointer = (e: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      target.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      target.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    mount.addEventListener("pointermove", onPointer);

    let frame = 0;
    let running = true;

    const animate = () => {
      if (!running) return;
      frame = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const delta = clock.getDelta();

      mouse.x += (target.x - mouse.x) * 0.06;
      mouse.y += (target.y - mouse.y) * 0.06;

      if (!reduced) {
        groupTilt.rotation.y = mouse.x * 0.35;
        groupTilt.rotation.x = mouse.y * 0.18;

        floaties.forEach((f) => {
          const t = elapsed * f.speed + f.phase;
          f.mesh.position.x = f.base.x + Math.sin(t * 0.7) * f.amp * 0.35;
          f.mesh.position.y = f.base.y + Math.sin(t) * f.amp;
          f.mesh.position.z = f.base.z + Math.cos(t * 0.55) * f.amp * 0.25;
          f.mesh.rotation.x += f.spin.x * delta;
          f.mesh.rotation.y += f.spin.y * delta;
          f.mesh.rotation.z += f.spin.z * delta;
        });

        dust.rotation.y = elapsed * 0.04;
      }

      camera.position.x = mouse.x * 0.45;
      camera.position.y = 0.35 + mouse.y * 0.25;
      camera.lookAt(0, 0.2, 0);

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nw = mount.clientWidth || window.innerWidth;
      const nh = mount.clientHeight || window.innerHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh, false);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      mount.removeEventListener("pointermove", onPointer);
      ro.disconnect();
      floaties.forEach((f) => {
        f.mesh.geometry.dispose();
        const m = f.mesh.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      });
      dustGeo.dispose();
      (dust.material as THREE.Material).dispose();
      skyGeo.dispose();
      skyMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    />
  );
}
