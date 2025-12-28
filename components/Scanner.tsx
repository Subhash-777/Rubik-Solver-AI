
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCcw, CheckCircle, Info, Sparkles } from 'lucide-react';
import { Color, Face } from '../types';

interface ScannerProps {
  onScanComplete: (faceKey: string, faceData: Face) => void;
}

// LAB Color Utilities
const rgbToLab = (r: number, g: number, b: number): [number, number, number] => {
  // Normalize RGB to [0, 1]
  let rN = r / 255, gN = g / 255, bN = b / 255;
  rN = rN > 0.04045 ? Math.pow((rN + 0.055) / 1.055, 2.4) : rN / 12.92;
  gN = gN > 0.04045 ? Math.pow((gN + 0.055) / 1.055, 2.4) : gN / 12.92;
  bN = bN > 0.04045 ? Math.pow((bN + 0.055) / 1.055, 2.4) : bN / 12.92;

  // RGB to XYZ (D65)
  let x = (rN * 0.4124 + gN * 0.3576 + bN * 0.1805) * 100;
  let y = (rN * 0.2126 + gN * 0.7152 + bN * 0.0722) * 100;
  let z = (rN * 0.0193 + gN * 0.1192 + bN * 0.9505) * 100;

  // XYZ to LAB
  x /= 95.047; y /= 100.000; z /= 108.883;
  x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + (16 / 116);
  y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + (16 / 116);
  z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + (16 / 116);

  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)];
};

// Calibrated LAB Centroids for standard Rubik's Colors
const COLOR_CENTROIDS: Record<Color, [number, number, number]> = {
  white: [95, 0, 0],
  yellow: [85, -10, 80],
  red: [45, 60, 45],
  orange: [65, 45, 65],
  blue: [35, 10, -50],
  green: [55, -50, 40]
};

const getClosestColor = (r: number, g: number, b: number): Color => {
  const lab = rgbToLab(r, g, b);
  let minDistance = Infinity;
  let closest: Color = 'white';

  for (const [color, centroid] of Object.entries(COLOR_CENTROIDS)) {
    // Delta E (Euclidean distance in LAB space)
    const distance = Math.sqrt(
      Math.pow(lab[0] - centroid[0], 2) +
      Math.pow(lab[1] - centroid[1], 2) +
      Math.pow(lab[2] - centroid[2], 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closest = color as Color;
    }
  }
  return closest;
};

const Scanner: React.FC<ScannerProps> = ({ onScanComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedFaces, setCapturedFaces] = useState<string[]>([]);
  const [scanningStatus, setScanningStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');
  const faces = ['Front', 'Back', 'Up', 'Down', 'Left', 'Right'];
  const faceKeys = ['F', 'B', 'U', 'D', 'L', 'R'];

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setScanningStatus('SCANNING');
      }
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  };

  const captureFace = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || capturedFaces.length >= 6) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Capture current frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Analyze 9 regions in a 3x3 grid centered in the frame
    const size = Math.min(canvas.width, canvas.height) * 0.5;
    const startX = (canvas.width - size) / 2;
    const startY = (canvas.height - size) / 2;
    const step = size / 3;
    const padding = step * 0.2;

    const detectedFace: Color[][] = [];

    for (let row = 0; row < 3; row++) {
      const rowColors: Color[] = [];
      for (let col = 0; col < 3; col++) {
        // Sample area center
        const x = startX + col * step + step / 2;
        const y = startY + row * step + step / 2;
        
        // Average a small region (10x10) to reduce noise
        const imgData = ctx.getImageData(x - 5, y - 5, 10, 10).data;
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < imgData.length; i += 4) {
          r += imgData[i]; g += imgData[i+1]; b += imgData[i+2];
        }
        r /= (imgData.length / 4);
        g /= (imgData.length / 4);
        b /= (imgData.length / 4);

        rowColors.push(getClosestColor(r, g, b));
      }
      detectedFace.push(rowColors);
    }

    const currentKey = faceKeys[capturedFaces.length];
    onScanComplete(currentKey, detectedFace);
    
    setCapturedFaces(prev => [...prev, faces[prev.length]]);
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([30, 50, 30]);
    }
  }, [capturedFaces, onScanComplete]);

  useEffect(() => {
    if (capturedFaces.length === 6) {
      setScanningStatus('SUCCESS');
    }
  }, [capturedFaces]);

  return (
    <div className="relative w-full max-w-4xl mx-auto aspect-[16/9] rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-2xl border border-slate-800">
      <canvas ref={canvasRef} className="hidden" />
      {!isCameraActive ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 bg-slate-900">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20"></div>
            <div className="w-24 h-24 bg-slate-800 rounded-3xl flex items-center justify-center relative z-10 border border-slate-700">
              <Camera size={48} className="text-blue-500" />
            </div>
          </div>
          <div className="text-center space-y-2 px-8">
            <h3 className="text-2xl font-black tracking-tight">AI Vision Initialization</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">Initializing LAB color clustering engine for robust sticker detection.</p>
          </div>
          <button 
            onClick={startCamera}
            className="px-10 py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black transition-all shadow-xl shadow-blue-500/20 active:scale-95 text-sm uppercase tracking-widest"
          >
            Enable AR Core
          </button>
        </div>
      ) : (
        <>
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale opacity-40 contrast-125" />
          
          {/* Enhanced AR Grid */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full max-w-xs md:max-w-sm aspect-square">
               {/* Scanline Effect */}
               <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent h-1 w-full animate-[scan_3s_linear_infinite]" />
               
               {/* Corners */}
               <div className="absolute -top-4 -left-4 w-16 h-16 border-t-8 border-l-8 border-blue-500 rounded-tl-3xl shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
               <div className="absolute -top-4 -right-4 w-16 h-16 border-t-8 border-r-8 border-blue-500 rounded-tr-3xl shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
               <div className="absolute -bottom-4 -left-4 w-16 h-16 border-b-8 border-l-8 border-blue-500 rounded-bl-3xl shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
               <div className="absolute -bottom-4 -right-4 w-16 h-16 border-b-8 border-r-8 border-blue-500 rounded-br-3xl shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
               
               {/* 3x3 Detection Matrix */}
               <div className="grid grid-cols-3 gap-3 w-full h-full p-4">
                 {[...Array(9)].map((_, i) => (
                   <div key={i} className="border-2 border-white/20 rounded-2xl backdrop-blur-sm flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40 shadow-glow" />
                   </div>
                 ))}
               </div>

               {/* Hint Bubble */}
               <div className="absolute -top-24 left-1/2 -translate-x-1/2 bg-blue-600/90 backdrop-blur-xl border border-blue-400/30 px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3">
                  <Sparkles size={16} className="text-white animate-pulse" />
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-white">Target Face: {faces[capturedFaces.length] || 'Analyzing...'}</p>
               </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="absolute top-8 left-8 space-y-3">
            <div className="flex items-center space-x-3 bg-black/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shadow-2xl">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">LAB Clustering Engine: OK</span>
            </div>
            <div className="flex items-center space-x-3 bg-blue-600/20 backdrop-blur-md px-5 py-3 rounded-2xl border border-blue-500/20 shadow-2xl">
              <RefreshCcw size={14} className="text-blue-400 animate-spin-slow" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">D65 Reference Active</span>
            </div>
          </div>

          {/* Capture Controls */}
          <div className="absolute bottom-10 left-0 right-0 px-10 flex justify-between items-end">
            <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] shadow-2xl w-64">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Scan Matrix</span>
                <span className="text-[10px] font-black text-blue-500">{capturedFaces.length}/6</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {faces.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-700 ${i < capturedFaces.length ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-slate-800'}`} />
                ))}
              </div>
            </div>
            
            <button 
              onClick={captureFace}
              disabled={scanningStatus === 'SUCCESS'}
              className="group relative w-24 h-24 rounded-full border-8 border-white/10 flex items-center justify-center hover:scale-105 transition-all active:scale-95 disabled:opacity-0 disabled:scale-0 overflow-hidden"
            >
              <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-0 group-hover:opacity-40 transition-opacity rounded-full"></div>
              <div className="w-16 h-16 bg-white rounded-full shadow-2xl relative z-10 flex items-center justify-center">
                 <div className="w-12 h-12 rounded-full border-4 border-slate-100 flex items-center justify-center">
                    <div className="w-1 h-1 bg-slate-300 rounded-full" />
                 </div>
              </div>
            </button>

            <button className="w-16 h-16 rounded-3xl bg-slate-900/90 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 shadow-2xl hover:bg-slate-800 transition-colors">
               <Info size={24} />
            </button>
          </div>

          {scanningStatus === 'SUCCESS' && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center space-y-8 animate-in zoom-in duration-500">
               <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 blur-[80px] opacity-30 animate-pulse" />
                  <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl relative z-10 rotate-12">
                     <CheckCircle size={64} className="text-blue-600" />
                  </div>
               </div>
               <div className="text-center space-y-4">
                  <h3 className="text-5xl font-black italic tracking-tighter text-white">SOLVE READY</h3>
                  <div className="flex items-center justify-center space-x-3">
                     <div className="h-px w-8 bg-blue-500/30" />
                     <p className="text-blue-400 font-black uppercase text-xs tracking-[0.4em]">Face Matrix Generated</p>
                     <div className="h-px w-8 bg-blue-500/30" />
                  </div>
               </div>
            </div>
          )}
        </>
      )}
      <style>{`
        @keyframes scan {
          from { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          to { transform: translateY(1000%); opacity: 0; }
        }
        .animate-spin-slow { animation: spin 4s linear infinite; }
        .shadow-glow { box-shadow: 0 0 10px white; }
      `}</style>
    </div>
  );
};

export default Scanner;
