"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  /** Increment this number to fire a new confetti burst. */
  trigger: number;
  /** Origin as viewport ratio [x, y] from top-left. Default center-upper. */
  origin?: [number, number];
}

const COLORS = ["#34d399", "#10b981", "#f59e0b", "#f43f5e", "#ffffff"];
const COUNT = 180;
const DURATION = 1.6; // seconds
const GRAVITY = 900; // px/s^2

/**
 * Full-viewport three.js particle confetti. Renders nothing until `trigger`
 * changes, then bursts particles that fall under gravity and fade out.
 * Uses an orthographic camera mapped 1:1 to CSS pixels.
 */
export default function Confetti({ trigger, origin = [0.5, 0.4] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    points: THREE.Points;
    positions: Float32Array;
    velocities: Float32Array;
    material: THREE.PointsMaterial;
    clock: THREE.Clock;
    life: number;
    active: boolean;
    raf: number;
  } | null>(null);

  // Init renderer once.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // Pixel-space camera: x 0..w (right), y 0..h (up).
    const camera = new THREE.OrthographicCamera(0, w, h, 0, -1000, 1000);
    const scene = new THREE.Scene();

    const positions = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const color = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      color.set(COLORS[i % COLORS.length]);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 11,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthTest: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const clock = new THREE.Clock();

    stateRef.current = {
      renderer,
      scene,
      camera,
      points,
      positions,
      velocities,
      material,
      clock,
      life: 0,
      active: false,
      raf: 0,
    };

    function onResize() {
      const s = stateRef.current;
      if (!s) return;
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      s.renderer.setSize(nw, nh);
      s.camera.right = nw;
      s.camera.top = nh;
      s.camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", onResize);

    return () => {
      const s = stateRef.current;
      window.removeEventListener("resize", onResize);
      if (s) {
        cancelAnimationFrame(s.raf);
        s.renderer.dispose();
        geometry.dispose();
        material.dispose();
        if (s.renderer.domElement.parentNode === el) {
          el.removeChild(s.renderer.domElement);
        }
      }
      stateRef.current = null;
    };
  }, []);

  // Fire a burst whenever `trigger` changes (skip initial 0).
  useEffect(() => {
    if (trigger <= 0) return;
    const s = stateRef.current;
    if (!s) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const ox = origin[0] * w;
    const oy = h - origin[1] * h; // convert top-ratio to camera y-up

    for (let i = 0; i < COUNT; i++) {
      s.positions[i * 3] = ox + (Math.random() - 0.5) * 40;
      s.positions[i * 3 + 1] = oy + (Math.random() - 0.5) * 40;
      s.positions[i * 3 + 2] = 0;

      const angle = Math.random() * Math.PI * 2;
      const speed = 260 + Math.random() * 360;
      s.velocities[i * 3] = Math.cos(angle) * speed;
      s.velocities[i * 3 + 1] = Math.sin(angle) * speed + 260; // bias upward
      s.velocities[i * 3 + 2] = 0;
    }
    s.points.geometry.attributes.position.needsUpdate = true;
    s.material.opacity = 1;
    s.life = 0;
    s.clock.getDelta(); // reset delta

    if (!s.active) {
      s.active = true;
      const loop = () => {
        const st = stateRef.current;
        if (!st) return;
        const dt = Math.min(st.clock.getDelta(), 0.05);
        st.life += dt;

        for (let i = 0; i < COUNT; i++) {
          st.velocities[i * 3 + 1] -= GRAVITY * dt;
          st.positions[i * 3] += st.velocities[i * 3] * dt;
          st.positions[i * 3 + 1] += st.velocities[i * 3 + 1] * dt;
        }
        st.points.geometry.attributes.position.needsUpdate = true;
        st.material.opacity = Math.max(0, 1 - st.life / DURATION);
        st.renderer.render(st.scene, st.camera);

        if (st.life < DURATION) {
          st.raf = requestAnimationFrame(loop);
        } else {
          st.active = false;
          st.material.opacity = 0;
          st.renderer.render(st.scene, st.camera);
        }
      };
      s.raf = requestAnimationFrame(loop);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[2000]"
    />
  );
}
