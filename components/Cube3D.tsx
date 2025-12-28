
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CubeState, Move, Color } from '../types';
import { COLOR_MAP } from '../constants';

interface Cube3DProps {
  state: CubeState;
  onMove?: (move: Move) => void;
  className?: string;
}

const Cube3D: React.FC<Cube3DProps> = ({ state, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cubesRef = useRef<THREE.Group[]>([]);

  // Helper to convert hex strings from COLOR_MAP to THREE.Color
  const getThreeColor = (c: Color) => new THREE.Color(COLOR_MAP[c]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = null;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const group = new THREE.Group();
    const geometry = new THREE.BoxGeometry(0.96, 0.96, 0.96);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x050505, 
      roughness: 0.1, 
      metalness: 0.8 
    });

    const stickerGeom = new THREE.PlaneGeometry(0.85, 0.85);

    // Build the 3x3x3 cube grid
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const subCube = new THREE.Group();
          const mesh = new THREE.Mesh(geometry, baseMaterial);
          subCube.add(mesh);
          subCube.position.set(x, y, z);

          // Add stickers to faces based on the current CubeState
          // x=1: Right (R), x=-1: Left (L)
          // y=1: Up (U), y=-1: Down (D)
          // z=1: Front (F), z=-1: Back (B)

          const addSticker = (color: Color, position: [number, number, number], rotation: [number, number, number]) => {
            const sticker = new THREE.Mesh(
              stickerGeom,
              new THREE.MeshStandardMaterial({ 
                color: getThreeColor(color), 
                roughness: 0.2,
                metalness: 0.3,
                emissive: getThreeColor(color),
                emissiveIntensity: 0.1
              })
            );
            sticker.position.set(...position);
            sticker.rotation.set(...rotation);
            subCube.add(sticker);
          };

          // Right face (R)
          if (x === 1) {
            const row = 1 - y; 
            const col = 1 - z;
            addSticker(state.R[row][col], [0.51, 0, 0], [0, Math.PI / 2, 0]);
          }
          // Left face (L)
          if (x === -1) {
            const row = 1 - y;
            const col = z + 1;
            addSticker(state.L[row][col], [-0.51, 0, 0], [0, -Math.PI / 2, 0]);
          }
          // Up face (U)
          if (y === 1) {
            const row = z + 1;
            const col = x + 1;
            addSticker(state.U[row][col], [0, 0.51, 0], [-Math.PI / 2, 0, 0]);
          }
          // Down face (D)
          if (y === -1) {
            const row = 1 - z;
            const col = x + 1;
            addSticker(state.D[row][col], [0, -0.51, 0], [Math.PI / 2, 0, 0]);
          }
          // Front face (F)
          if (z === 1) {
            const row = 1 - y;
            const col = x + 1;
            addSticker(state.F[row][col], [0, 0, 0.51], [0, 0, 0]);
          }
          // Back face (B)
          if (z === -1) {
            const row = 1 - y;
            const col = 1 - x;
            addSticker(state.B[row][col], [0, 0, -0.51], [0, Math.PI, 0]);
          }

          group.add(subCube);
          cubesRef.current.push(subCube);
        }
      }
    }

    scene.add(group);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    const animate = () => {
      requestAnimationFrame(animate);
      group.rotation.y += 0.003;
      group.rotation.x += 0.001;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
    };
  }, [state]);

  return <div ref={containerRef} className={`${className} bg-slate-900/40 backdrop-blur-sm`} />;
};

export default Cube3D;
