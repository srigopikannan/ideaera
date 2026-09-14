"use client";

import * as React from "react";
import * as THREE from "three";

export function Hero3DScene() {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 16);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Architectural Crystalline Idea Sculpture (Icosahedron + Dodecahedron dual)
    const crystalGeo = new THREE.IcosahedronGeometry(4.8, 1);
    const crystalMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    rootGroup.add(crystalMesh);

    // Inner Radiant Nucleus
    const innerGeo = new THREE.OctahedronGeometry(2.6, 2);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    rootGroup.add(innerMesh);

    // Deep Center Light Sphere
    const centerGeo = new THREE.SphereGeometry(1.2, 24, 24);
    const centerMat = new THREE.MeshBasicMaterial({
      color: 0xe0e7ff,
      transparent: true,
      opacity: 0.75,
      wireframe: true,
    });
    const centerMesh = new THREE.Mesh(centerGeo, centerMat);
    rootGroup.add(centerMesh);

    // Orbital Horizon Rings (Representing connections forming)
    const ringGeo = new THREE.TorusGeometry(7.2, 0.035, 16, 120);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.3,
    });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 8;
    rootGroup.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, ringMat);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.z = Math.PI / 6;
    rootGroup.add(ring2);

    // Constellation Nodes on Vertices
    const nodeCount = 32;
    const nodeGeo = new THREE.SphereGeometry(0.14, 10, 10);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const nodes: THREE.Mesh[] = [];

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < nodeCount; i++) {
      const y = 1 - (i / (nodeCount - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(x * 5.2, y * 5.2, z * 5.2);
      rootGroup.add(node);
      nodes.push(node);
    }

    // Ambient Stardust Particle Field
    const particleCount = 220;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 26;
      positions[i + 1] = (Math.random() - 0.5) * 26;
      positions[i + 2] = (Math.random() - 0.5) * 20;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.1,
      color: 0xc7d2fe,
      transparent: true,
      opacity: 0.5,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Interactive mouse damping
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const hw = window.innerWidth / 2;
      const hh = window.innerHeight / 2;
      mouseX = (e.clientX - hw) / hw;
      mouseY = (e.clientY - hh) / hh;
      targetX = mouseY * 0.45;
      targetY = mouseX * 0.75;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener("resize", handleResize);

    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth camera & scene rotation
      rootGroup.rotation.x += (targetX - rootGroup.rotation.x) * 0.05;
      rootGroup.rotation.y += (targetY - rootGroup.rotation.y) * 0.05;

      crystalMesh.rotation.y = elapsed * 0.06;
      crystalMesh.rotation.x = elapsed * 0.03;

      innerMesh.rotation.y = -elapsed * 0.09;
      innerMesh.rotation.z = elapsed * 0.05;

      centerMesh.rotation.y = elapsed * 0.15;

      ring1.rotation.z = elapsed * 0.08;
      ring2.rotation.z = -elapsed * 0.06;

      particles.rotation.y = elapsed * 0.015;

      // Subtle breath pulse
      const pulse = 1 + Math.sin(elapsed * 2.5) * 0.08;
      nodes.forEach((n, idx) => {
        const offset = Math.sin(elapsed * 2 + idx);
        n.scale.setScalar(pulse + offset * 0.05);
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);

      crystalGeo.dispose();
      crystalMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      centerGeo.dispose();
      centerMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[380px] sm:min-h-[480px] lg:min-h-[580px] flex items-center justify-center pointer-events-none"
    />
  );
}
