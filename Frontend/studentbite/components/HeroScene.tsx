"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Ambient three.js hero background: a drifting glow-particle field plus a few
 * floating wireframe icosahedrons. Auto-rotates and reacts to the pointer with
 * a subtle parallax. Fully client-side with proper resource disposal.
 */
export default function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let w = el.clientWidth;
    let h = el.clientHeight;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.z = 7;

    const scene = new THREE.Scene();
    const world = new THREE.Group();
    scene.add(world);

    // --- Glow particle field ---
    const COUNT = 700;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const palette = [
      new THREE.Color("#34d399"),
      new THREE.Color("#10b981"),
      new THREE.Color("#f59e0b"),
      new THREE.Color("#a7f3d0"),
    ];
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    world.add(particles);

    // --- Floating wireframe shapes ---
    const shapes: { mesh: THREE.Mesh; speed: number; phase: number }[] = [];
    const shapeDefs: [number, number, number, number, string][] = [
      [-3.4, 1.4, -1, 1.1, "#34d399"],
      [3.6, -1.2, -2, 0.8, "#f59e0b"],
      [1.8, 2.2, -3, 0.6, "#10b981"],
    ];
    for (const [x, y, z, r, color] of shapeDefs) {
      const geo = new THREE.IcosahedronGeometry(r, 0);
      const mat = new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      world.add(mesh);
      shapes.push({ mesh, speed: 0.2 + Math.random() * 0.3, phase: Math.random() * 6 });
    }

    // --- Pointer parallax ---
    let targetX = 0;
    let targetY = 0;
    function onPointer(e: PointerEvent) {
      const rect = el!.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }
    window.addEventListener("pointermove", onPointer);

    function onResize() {
      w = el!.clientWidth;
      h = el!.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    let raf = 0;
    function loop() {
      const t = clock.getElapsedTime();
      const dt = clock.getDelta();

      if (!reduce) world.rotation.y += 0.18 * dt;
      // ease toward pointer target
      world.rotation.x += (targetY * 0.25 - world.rotation.x) * 0.05;
      camera.position.x += (targetX * 0.6 - camera.position.x) * 0.04;
      camera.position.y += (-targetY * 0.4 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      particles.rotation.y = t * 0.04;

      for (const s of shapes) {
        s.mesh.rotation.x += s.speed * dt;
        s.mesh.rotation.y += s.speed * 0.7 * dt;
        s.mesh.position.y += Math.sin(t * s.speed + s.phase) * 0.002;
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      pGeo.dispose();
      pMat.dispose();
      for (const s of shapes) {
        s.mesh.geometry.dispose();
        (s.mesh.material as THREE.Material).dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === el) {
        el.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
