
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CubeState, Move } from '../types';
import { COLOR_MAP } from '../constants';

interface Cube3DProps {
  state: CubeState;
  onMove?: (move: Move) => void;
  className?: string;
}

const Cube3D: React.FC<Cube3DProps> = ({ state, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cubesRef = useRef<THREE.Group[]>([]);
  const pivotRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = null; // Transparent for better embedding
    const camera = new THREE.PerspectiveCamera(50, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    const spotlight = new THREE.SpotLight(0xffffff, 0.5);
    spotlight.position.set(-10, 10, -10);
    scene.add(spotlight);

    // Create Cube Structure
    const group = new THREE.Group();
    const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95);
    
    // Setup Materials
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x111111, 
      roughness: 0.1, 
      metalness: 0.5 
    });

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const subCubeGroup = new THREE.Group();
          const mesh = new THREE.Mesh(geometry, baseMaterial);
          subCubeGroup.add(mesh);
          subCubeGroup.position.set(x, y, z);
          
          // Stickers logic simplified for demo
          const stickerGeom = new THREE.PlaneGeometry(0.8, 0.8);
          // Just adding one sticker per side for visual complexity
          const stickers = [
            { pos: [0.51, 0, 0], rot: [0, Math.PI/2, 0] },
            { pos: [-0.51, 0, 0], rot: [0, -Math.PI/2, 0] },
            { pos: [0, 0.51, 0], rot: [-Math.PI/2, 0, 0] },
            { pos: [0, -0.51, 0], rot: [Math.PI/2, 0, 0] },
            { pos: [0, 0, 0.51], rot: [0, 0, 0] },
            { pos: [0, 0, -0.51], rot: [0, Math.PI, 0] },
          ];

          stickers.forEach((s, idx) => {
            // Colors: U (white), D (yellow), L (orange), R (red), F (green), B (blue)
            const colors = [0xFFFFFF, 0xFFFF00, 0xFFA500, 0xFF0000, 0x00FF00, 0x0000FF];
            const sticker = new THREE.Mesh(
              stickerGeom, 
              new THREE.MeshStandardMaterial({ color: colors[idx], roughness: 0.3 })
            );
            sticker.position.set(s.pos[0], s.pos[1], s.pos[2]);
            sticker.rotation.set(s.rot[0], s.rot[1], s.rot[2]);
            subCubeGroup.add(sticker);
          });

          group.add(subCubeGroup);
          cubesRef.current.push(subCubeGroup);
        }
      }
    }
    scene.add(group);

    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const animate = () => {
      requestAnimationFrame(animate);
      group.rotation.y += 0.002;
      group.rotation.x += 0.001;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className={`${className} rounded-3xl overflow-hidden bg-slate-900 shadow-inner`} />;
};

export default Cube3D;
