"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ==========================================
// 1. DATA MODELS & ENGINE
// ==========================================

interface Satellite {
  mesh: THREE.Mesh;
  phase: number;
  tetherIndex: number;
  isFailed: boolean;
  failMark: THREE.Group | null;
  parentOrbiterIdx: number;
}

interface Orbiter {
  mesh: THREE.Mesh;
  phase: number;
  satellites: Satellite[];
  parentSphereIdx: number;
  baseScale: number;
}

interface GravitySphere {
  mesh: THREE.Mesh;
  diamonds: Orbiter[];
  originX: number;
  originY: number;
  localX: number;
  localY: number;
  velocity: number;
  totalSatellites: number;
  edgeLines: THREE.LineSegments | null;
}

interface SphereConnect {
  aIdx: number;
  bIdx: number;
  strands: {
    geometry: THREE.BufferGeometry;
    positions: Float32Array;
    line: THREE.Line;
    offsets: number[];
  }[];
}

class WaveMeshManager {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  spheres: GravitySphere[] = [];
  allSatellites: Satellite[] = [];
  sphereConnections: SphereConnect[] = [];
  clock: THREE.Clock;
  animationId: number | null = null;
  lastFailureTime: number = 0;
  pyramidGeo: THREE.ConeGeometry | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#020617');
    this.scene.fog = new THREE.Fog('#020617', 50, 400);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 180, 280);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.clock = new THREE.Clock();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x60a5fa, 2, 500);
    pointLight.position.set(0, 100, 0);
    this.scene.add(pointLight);

    this.initSpheres();
    this.animate();
  }

  initSpheres() {
    const sphereCount = 27;
    let genSpheres = 0;
    let genDiamonds = 0;
    let genSatellites = 0;
    let totalTethersCount = 0;

    const sphereGeometry = new THREE.SphereGeometry(3.75, 16, 16);
    const baseSphereMaterial = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.3, metalness: 0.2 });

    this.pyramidGeo = new THREE.ConeGeometry(3.75, 6.0, 4);
    this.pyramidGeo.translate(0, 3.0, 0);

    const diamondGeometry = new THREE.OctahedronGeometry(2.64);
    const baseDiamondMaterial = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#dc2626', emissiveIntensity: 0.5 });
    
    const satGeometry = new THREE.SphereGeometry(0.8, 8, 8);
    const satMaterial = new THREE.MeshBasicMaterial({ color: '#10b981' });

    for (let i = 0; i < sphereCount; i++) {
      genSpheres++;
      const sphereMat = baseSphereMaterial.clone();
      const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMat);
      this.scene.add(sphereMesh);

      const edgeLines = new THREE.LineSegments(new THREE.EdgesGeometry(this.pyramidGeo!), new THREE.LineBasicMaterial({ color: '#ff0000' }));
      edgeLines.visible = false;
      sphereMesh.add(edgeLines);

      const theta = i * Math.PI * (1 + Math.sqrt(5));
      const radiusOffset = 130 * Math.sqrt(i / (sphereCount - 1));
      const originX = Math.cos(theta) * radiusOffset;
      const originY = Math.sin(theta) * radiusOffset;

      const diamonds: Orbiter[] = [];
      const numDiamonds = Math.floor(Math.random() * 4) + 1;
      let clusterSatsCount = 0;

      for (let j = 0; j < numDiamonds; j++) {
        genDiamonds++;
        const diamondMat = baseDiamondMaterial.clone();
        const diamond = new THREE.Mesh(diamondGeometry, diamondMat);
        this.scene.add(diamond);
        const satellites: Satellite[] = [];
        const numSats = Math.floor(Math.random() * 5) + 1;
        clusterSatsCount += numSats;
        for (let k = 0; k < numSats; k++) {
          genSatellites++;
          const satMesh = new THREE.Mesh(satGeometry, satMaterial);
          this.scene.add(satMesh);
          const sat = { mesh: satMesh, phase: k * (Math.PI * 2 / numSats), tetherIndex: totalTethersCount, isFailed: false, failMark: null, parentOrbiterIdx: genDiamonds - 1 };
          satellites.push(sat);
          this.allSatellites.push(sat);
          totalTethersCount++;
        }
        diamonds.push({ mesh: diamond, phase: j * (Math.PI * 2 / numDiamonds), satellites, parentSphereIdx: i, baseScale: 1.0 });
      }

      this.spheres.push({ mesh: sphereMesh, diamonds, originX, originY, localX: originX, localY: originY, velocity: 0, totalSatellites: clusterSatsCount, edgeLines });
    }

    // Connections between spheres
    for (let i = 0; i < sphereCount; i++) {
      const neighbors = Math.floor(Math.random() * 3) + 1;
      for (let n = 0; n < neighbors; n++) {
        const j = Math.floor(Math.random() * sphereCount);
        if (i === j) continue;
        const numStrands = Math.floor(Math.random() * 8) + 1;
        const strands = [];
        for (let s = 0; s < numStrands; s++) {
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
          const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#3b82f6', transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending }));
          this.scene.add(line);
          strands.push({ geometry: geo, positions: geo.attributes.position.array as Float32Array, line, offsets: [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5] });
        }
        this.sphereConnections.push({ aIdx: i, bIdx: j, strands });
      }
    }
  }

  triggerFailure() {
    const available = this.allSatellites.filter(s => !s.isFailed);
    if (available.length === 0) return;
    const sat = available[Math.floor(Math.random() * available.length)];
    sat.isFailed = true;

    // Visual mark
    const xGroup = new THREE.Group();
    const xMat = new THREE.MeshBasicMaterial({ color: '#10B981' });
    const bar1 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 0.5), xMat);
    bar1.rotation.z = Math.PI / 4;
    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 0.5), xMat);
    bar2.rotation.z = -Math.PI / 4;
    xGroup.add(bar1, bar2);
    sat.mesh.add(xGroup);
    sat.failMark = xGroup;

    // Propagation
    this.spheres.forEach((sphere, sIdx) => {
      let clusterFailedCount = 0;
      sphere.diamonds.forEach(dia => {
        const failedInDiamond = dia.satellites.filter(s => s.isFailed).length;
        clusterFailedCount += failedInDiamond;
        if (dia.satellites.some(s => s === sat)) dia.mesh.scale.setScalar(1 + failedInDiamond * 0.15);
      });

      const failRatio = clusterFailedCount / sphere.totalSatellites;
      const mat = sphere.mesh.material as THREE.MeshStandardMaterial;
      if (clusterFailedCount > 0) {
        if (sphere.mesh.geometry.type === 'SphereGeometry') {
          sphere.mesh.geometry = this.pyramidGeo!;
          if (sphere.edgeLines) sphere.edgeLines.visible = true;
        }
        mat.color.set('#000000');
        mat.emissive.set('#000000');
        if (sphere.edgeLines) (sphere.edgeLines.material as THREE.LineBasicMaterial).opacity = 0.5 + failRatio * 0.5;
        sphere.mesh.scale.set(1, 1 + clusterFailedCount * 0.4, 1);
      }
    });
  }

  animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    const t = this.clock.getElapsedTime() * 0.65;

    if (t - this.lastFailureTime >= 0.5) {
      this.triggerFailure();
      this.lastFailureTime = t;
    }

    this.spheres.forEach((sphere, i) => {
      const wave = Math.sin(t * 1.5 + i * 0.5) * 12;
      sphere.localY = wave;
      sphere.mesh.position.set(sphere.originX, sphere.localY, sphere.originY);

      sphere.diamonds.forEach((dia, j) => {
        const orbT = t * 0.6;
        const angle = dia.phase + orbT;
        dia.mesh.position.set(sphere.originX + Math.cos(angle) * 22, sphere.localY + Math.sin(orbT * 1.5 + j) * 8, sphere.originY + Math.sin(angle) * 22);
        dia.mesh.rotation.y += 0.02;

        dia.satellites.forEach((sat, k) => {
          if (sat.isFailed) {
            sat.mesh.position.set(dia.mesh.position.x + (Math.random() - 0.5) * 0.5, dia.mesh.position.y + (Math.random() - 0.5) * 0.5, dia.mesh.position.z + (Math.random() - 0.5) * 0.5);
            return;
          }
          const satAngle = sat.phase + t * 1.2;
          sat.mesh.position.set(dia.mesh.position.x + Math.cos(satAngle) * 8, dia.mesh.position.y + Math.sin(t * 2 + k) * 3, dia.mesh.position.z + Math.sin(satAngle) * 8);
          sat.mesh.rotation.x += 0.05;
        });
      });
    });

    this.sphereConnections.forEach(conn => {
      const a = this.spheres[conn.aIdx];
      const b = this.spheres[conn.bIdx];
      conn.strands.forEach((strand, idx) => {
        const pos = strand.positions;
        const jitter = Math.sin(t * 10 + idx) * 0.5;
        pos[0] = a.mesh.position.x; pos[1] = a.mesh.position.y; pos[2] = a.mesh.position.z;
        pos[3] = b.mesh.position.x + strand.offsets[0]*jitter; pos[4] = b.mesh.position.y + strand.offsets[1]*jitter; pos[5] = b.mesh.position.z + strand.offsets[2]*jitter;
        strand.geometry.attributes.position.needsUpdate = true;
      });
    });

    this.renderer.render(this.scene, this.camera);
  }

  cleanup() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.renderer.dispose();
  }
}

export default function WaveToolPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const manager = new WaveMeshManager(canvasRef.current);
    const handleResize = () => {
      manager.camera.aspect = window.innerWidth / window.innerHeight;
      manager.camera.updateProjectionMatrix();
      manager.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      manager.cleanup();
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 w-full h-full bg-slate-950 overflow-hidden">
      <div className="absolute top-6 left-6 z-10">
        <h1 className="text-2xl font-bold text-white tracking-widest flex items-center gap-3">
          <div className="w-2 h-8 bg-emerald-500 rounded-full animate-pulse" />
          SYSTEM WAVE TOOL
        </h1>
        <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-semibold">Simulación de Propagación de Falla Estructural</p>
        <div className="mt-4">
          <a href="/app-simulation" className="text-emerald-400 hover:text-emerald-300 text-xs font-bold border border-emerald-500/30 px-3 py-1 bg-emerald-950/20 rounded-md transition-all">
            &larr; Volver al Dashboard
          </a>
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
