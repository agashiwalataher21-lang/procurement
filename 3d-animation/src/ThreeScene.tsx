import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

interface ThreeSceneProps {
  backgroundColor?: string;
  showControls?: boolean;
  duration?: number;
}

export const ThreeScene = ({
  backgroundColor = '#1a1a2e',
  showControls = true,
}: ThreeSceneProps) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={[backgroundColor]} />
      <PerspectiveCamera makeDefault position={[0, 0, 10]} />

      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} />
      <spotLight position={[-10, -10, 5]} intensity={0.5} />

      <AnimatedBox />

      {showControls && <OrbitControls />}
    </Canvas>
  );
};

function AnimatedBox() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  const material = useMemo(() => {
    return (
      <meshStandardMaterial
        color="hotpink"
        metalness={0.5}
        roughness={0.2}
      />
    );
  }, []);

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      {material}
    </mesh>
  );
};