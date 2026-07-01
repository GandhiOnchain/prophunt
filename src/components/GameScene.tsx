import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Player } from './game/Player';
import { Level } from './game/Level';
import { Bots } from './game/Bots';
import { memo, Suspense, useEffect, useState } from 'react';
import { EffectComposer, Bloom, N8AO, ToneMapping } from '@react-three/postprocessing';

const CAMERA_SETTINGS = { fov: 60, near: 0.1, far: 1000 };

export const GameScene = memo(function GameScene() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768 || navigator.hardwareConcurrency <= 4;
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <Canvas 
      shadows={!isMobile} 
      camera={CAMERA_SETTINGS} 
      dpr={isMobile ? 1 : [1, 1.5]} 
      performance={{ min: 0.65 }}
      gl={{ 
        antialias: !isMobile,
        stencil: false,
        depth: true,
        powerPreference: 'high-performance',
        precision: 'highp'
      }}
    >
      <color attach="background" args={['#0a0908']} />
      <Suspense fallback={null}>
        <Physics gravity={[0, -20, 0]}>
          <Level />
          <Bots />
          <Player />
        </Physics>
        
        <EffectComposer enableNormalPass={false} autoClear={false}>
          {!isMobile && <N8AO aoRadius={1} intensity={1} />}
          {!isMobile && (
            <Bloom 
              intensity={0.3} 
              luminanceThreshold={0.9} 
              luminanceSmoothing={0.1} 
              mipmapBlur 
            />
          )}
          <ToneMapping adaptive={false} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
});
