import { Audio } from '@remotion/runtime';
import { Canvas } from '@react-three/fiber';
import { ThreeScene } from './ThreeScene';

export const VideoWithAudio = () => {
  return (
    <Canvas
      width={1920}
      height={1080}
    >
      {/* Audio element */}
      <Audio
        src="/audio/sample-audio.mp3"
        loop={false}
        controls
        volume={0.8}
        playing
      />

      {/* Audio visualization / visualizer */}
      <ThreeScene backgroundColor="#1a1a2e" />
    </Canvas>
  );
};