import React, { useState, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, ContactShadows } from '@react-three/drei';
import { Button } from '../ui/Button.js';
import { Icon } from '../ui/Icon.js';

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

interface ThreeDStudioProps {
  onSnapshot: (file: File) => void;
  onClose: () => void;
}

export const ThreeDStudio: React.FC<ThreeDStudioProps> = ({ onSnapshot, onClose }) => {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<string>('city');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setModelUrl(url);
    }
  };

  const takeSnapshot = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      
      // Convert data URL to File
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], '3d-snapshot.png', { type: 'image/png' });
          onSnapshot(file);
        });
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 rounded-xl overflow-hidden relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-slate-900/80 to-transparent">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <Icon name="box" className="w-5 h-5 text-primary" />
          3D Studio
        </h2>
        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
          <Icon name="x" className="w-5 h-5" />
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-grow relative">
        {!modelUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <Icon name="upload" className="w-12 h-12 mb-4 opacity-50" />
            <p className="mb-4">Upload a 3D Model (.glb or .gltf) to begin</p>
            <label className="cursor-pointer bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors">
              Select File
              <input type="file" accept=".glb,.gltf" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        ) : (
          <Canvas 
            ref={canvasRef} 
            gl={{ preserveDrawingBuffer: true, alpha: true }}
            camera={{ position: [0, 0, 5], fov: 50 }}
            className="w-full h-full"
          >
            <Suspense fallback={null}>
              <Environment preset={environment as any} />
              <Model url={modelUrl} />
              <ContactShadows position={[0, -1, 0]} opacity={0.5} scale={10} blur={2} far={4} />
              <OrbitControls makeDefault />
            </Suspense>
          </Canvas>
        )}
      </div>

      {/* Controls Footer */}
      {modelUrl && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 flex justify-between items-center z-10">
          <div className="flex gap-4 items-center">
            <label className="text-slate-300 text-sm font-medium">Environment:</label>
            <select 
              value={environment} 
              onChange={(e) => setEnvironment(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
            >
              <option value="city">City</option>
              <option value="sunset">Sunset</option>
              <option value="studio">Studio</option>
              <option value="warehouse">Warehouse</option>
              <option value="forest">Forest</option>
              <option value="apartment">Apartment</option>
            </select>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setModelUrl(null)}>Change Model</Button>
            <Button onClick={takeSnapshot} className="flex items-center gap-2">
              <Icon name="camera" className="w-4 h-4" />
              Snapshot & Generate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
