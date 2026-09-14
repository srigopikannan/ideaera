"use client";

import * as React from "react";
import * as THREE from "three";

export function CinematicCanvas() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const imagePlateRef = React.useRef<HTMLDivElement>(null);
  const fogOverlayRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    const imagePlate = imagePlateRef.current;
    const fogOverlay = fogOverlayRef.current;
    if (!container) return;

    // Three.js WebGL Particle Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 22;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Multi-Layer Particle Universe: 560 particles spanning the cosmic space
    const particleCount = 560;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const amber = new THREE.Color(0xf59e0b);
    const gold = new THREE.Color(0xfde047);
    const white = new THREE.Color(0xffffff);
    const blue = new THREE.Color(0x93c5fd);

    for (let i = 0; i < particleCount; i++) {
      // Extended bounds so particles drift throughout the vertical journey
      positions[i * 3] = (Math.random() - 0.5) * 48;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 44;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 32;

      const rand = Math.random();
      const c = rand > 0.5 ? amber : rand > 0.3 ? gold : rand > 0.15 ? white : blue;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Mouse Tracking for Desktop Parallax
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      targetMouseX = (e.clientX - halfW) / halfW;
      targetMouseY = (e.clientY - halfH) / halfH;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let scrollY = 0;
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth mouse interpolation
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      // Camera parallax reacting to both cursor and scroll depth
      const scrollNorm = Math.min(scrollY / 1500, 2.0);
      camera.position.x = currentMouseX * 1.5;
      camera.position.y = -currentMouseY * 1.0 - scrollNorm * 1.8;
      camera.lookAt(0, -scrollNorm * 1.2, 0);

      // WebGL particles drift and rotate gracefully
      particles.rotation.y = elapsed * 0.015 + scrollNorm * 0.15;
      particles.rotation.x = Math.sin(elapsed * 0.2) * 0.02;

      // Multi-Layer Parallax on the approved hero artwork:
      // Smooth dimensional scale push + vertical drift + atmospheric deepening
      if (imagePlate) {
        const tiltX = currentMouseY * -3.0;
        const tiltY = currentMouseX * 4.0;
        const transX = currentMouseX * -14;
        // As you scroll, hero artwork slowly drifts and scales into the cosmos
        const scrollDriftY = Math.min(scrollY * 0.2, 750);
        const transY = currentMouseY * -8 - scrollDriftY;
        const zoom = 1.05 + Math.min(scrollY / 1200, 0.22);

        imagePlate.style.transform = `translate3d(${transX}px, ${transY}px, 0px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${zoom})`;
      }

      // Atmospheric fog deepens as user moves into editorial sections
      if (fogOverlay) {
        const fogOpacity = Math.min(0.45 + (scrollY / 800) * 0.5, 0.94);
        fogOverlay.style.opacity = fogOpacity.toString();
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);

      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden perspective-[1200px]">
      {/* High-Resolution Clean Approved Hero Artwork (Kept 100% Intact per Rule #12) */}
      <div
        ref={imagePlateRef}
        className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-200 ease-out will-change-transform"
        style={{
          backgroundImage: "url('/images/hero-universe.jpg')",
          transform: "scale(1.05)",
        }}
      >
        {/* Dynamic Atmospheric Fog Layer that deepens smoothly with scroll */}
        <div
          ref={fogOverlayRef}
          className="absolute inset-0 bg-gradient-to-t from-[#050608] via-[#050608]/60 to-transparent transition-opacity duration-300"
          style={{ opacity: 0.45 }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050608]/70 via-transparent to-transparent" />
      </div>

      {/* WebGL Particle Overlay */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
