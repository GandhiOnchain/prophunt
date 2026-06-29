import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Player } from './game/Player';
import { Level } from './game/Level';
import { Bots } from './game/Bots';
import { memo, Suspense } from 'react';
import { EffectComposer, Bloom, N8AO, ToneMapping } from '@react-three/postprocessing';

const CAMERA_SETTINGS = { fov: 60, near: 0.1, far: 1000 };

export const GameScene = memo(function GameScene() {
  return (
    <Canvas 
      shadows 
      camera={CAMERA_SETTINGS} 
      dpr={[1, 2]} 
      performance={{ min: 0.5 }}
      gl={{ 
        antialias: false,
        stencil: false,
        depth: true,
        powerPreference: 'high-performance'
      }}
    >
      <color attach="background" args={['#0a0908']} />
      <Suspense fallback={null}>
        <Physics gravity={[0, -20, 0]}>
          <Level />
          <Bots />
          <Player />
        </Physics>
        
        <EffectComposer enableNormalPass={false}>
          <N8AO aoRadius={1} intensity={2} />
          <Bloom 
            intensity={0.5} 
            luminanceThreshold={0.9} 
            luminanceSmoothing={0.1} 
            mipmapBlur 
          />
          <ToneMapping adaptive={true} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
});
