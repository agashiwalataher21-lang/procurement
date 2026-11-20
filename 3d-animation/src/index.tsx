import {
 Composition,
  AbsoluteFill,
  Sequence,
  Audio,
  useAudioStatus,
  AudioTransitions,
} from '@remotion/runtime';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useState, useEffect } from 'react';

// 3D Scene Component
function Scene() {
  const [color, setColor] = useState('#ff6b6b');

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 75 }}
      style={{ width: '100%', height: '100%' }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <mesh rotation={[0.5, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>

      <OrbitControls enableZoom={true} enablePan={true} />
    </Canvas>
  );
}

// Main video component
export const MyVideo = () => {
  return (
    <AbsoluteFill>
      <Composition
        name="3D-Animation-Video"
        width={1920}
        height={1080}
        durationInFrames={300}
        fps={30}
      >
        <Composition
          name="Main-Scene"
          width={1920}
          height={1080}
          durationInFrames={300}
          fps={30}
        >
          <AbsoluteFill style={{ background: '#1a1a2e' }}>
            <Scene />
          </AbsoluteFill>
        </Composition>
      </Composition>
    </AbsoluteFill>
  );
};

export default MyVideo;