import React, { forwardRef, Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { DefaultLoadingManager, LoadingManager, TextureLoader, ImageLoader } from 'three';
import { fixPolyHavenUrl } from './SafeTexture';

// Bulletproof prototype override of Three.js loaders to intercept and fix all textures/images
const originalTextureLoad = TextureLoader.prototype.load;
TextureLoader.prototype.load = function (url: string, onLoad?: any, onProgress?: any, onError?: any) {
  const fixedUrl = fixPolyHavenUrl(url);
  return originalTextureLoad.call(this, fixedUrl, onLoad, onProgress, onError);
};

const originalImageLoad = ImageLoader.prototype.load;
ImageLoader.prototype.load = function (url: string, onLoad?: any, onProgress?: any, onError?: any) {
  const fixedUrl = fixPolyHavenUrl(url);
  return originalImageLoad.call(this, fixedUrl, onLoad, onProgress, onError);
};

// Fix Poly Haven't relative texture paths and route via direct DL domain
const configureLoader = (loader: any) => {
  if (loader.manager) {
    loader.manager.setURLModifier((url: string) => {
      return fixPolyHavenUrl(url);
    });
  }
};

DefaultLoadingManager.setURLModifier((url) => {
  return fixPolyHavenUrl(url);
});

// CC0 High Quality Assets from Poly Haven (1k GLTF versions for fast loading)
const ASSETS = {
  barrel: fixPolyHavenUrl('https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/wine_barrel_01/wine_barrel_01_1k.gltf'),
  chair: fixPolyHavenUrl('https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/dining_chair_02/dining_chair_02_1k.gltf'),
  box: fixPolyHavenUrl('https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/cardboard_box_01/cardboard_box_01_1k.gltf'),
  pot: fixPolyHavenUrl('https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/brass_pot_02/brass_pot_02_1k.gltf'),
  cabinet: fixPolyHavenUrl('https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/vintage_cabinet_01/vintage_cabinet_01_1k.gltf'),
  sofa: fixPolyHavenUrl('https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/sofa_03/sofa_03_1k.gltf'),
  desk: fixPolyHavenUrl('https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/wooden_table_02/wooden_table_02_1k.gltf'),
  plant: 'https://raw.githubusercontent.com/pmndrs/market-assets/main/files/models/plant/model.gltf',
  mug: 'https://raw.githubusercontent.com/pmndrs/market-assets/main/files/models/mug/model.gltf',
};

// Pre-fetch
Object.values(ASSETS).forEach(url => useGLTF.preload(url, true, true, configureLoader));

const GLTFModel = forwardRef<any, { url: string; scale?: number; offsetY?: number; rotationOffset?: [number, number, number], castShadow?: boolean }>(
  ({ url, scale = 1, offsetY = 0, rotationOffset = [0, 0, 0], castShadow = true }, ref) => {
    const { scene } = useGLTF(url, true, true, configureLoader);
    const clone = useMemo(() => {
      const c = scene.clone();
      c.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = castShadow;
          child.receiveShadow = true;
        }
      });
      return c;
    }, [scene, castShadow]);

    return (
      <primitive object={clone} scale={scale} position={[0, offsetY, 0]} rotation={rotationOffset} ref={ref} />
    );
  }
);

// Fallback to simple meshes if loading fails or during suspense
const Fallback = ({ color, args = [1, 1, 1] }: { color: string, args?: any }) => (
  <mesh castShadow receiveShadow>
    <boxGeometry args={args} />
    <meshStandardMaterial color={color} />
  </mesh>
);

export const BarrelProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <GLTFModel url={ASSETS.barrel} scale={1.5} offsetY={-0.6} castShadow={false} />
  </group>
));

export const ChairProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <GLTFModel url={ASSETS.chair} scale={1.5} offsetY={-0.6} castShadow={false} />
  </group>
));

export const BoxProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <GLTFModel url={ASSETS.box} scale={2.5} offsetY={-0.5} castShadow={false} />
  </group>
));

export const VaseProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <GLTFModel url={ASSETS.pot} scale={3.0} offsetY={-0.75} castShadow={false} />
  </group>
));

export const CabinetProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <GLTFModel url={ASSETS.cabinet} scale={1.0} offsetY={-0.75} />
  </group>
));

export const SofaProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <GLTFModel url={ASSETS.sofa} scale={1.2} offsetY={-0.5} />
  </group>
));

export const DeskProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <GLTFModel url={ASSETS.desk} scale={1.5} offsetY={-0.5} />
  </group>
));

export const PlantProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <GLTFModel url={ASSETS.plant} scale={3} offsetY={-0.75} />
  </group>
));

export const MugProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <GLTFModel url={ASSETS.mug} scale={4} offsetY={-0.15} castShadow={false} />
  </group>
));

export const MonitorProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <GLTFModel url={ASSETS.box} scale={1.8} offsetY={-0.35} />
  </group>
));

export const VendingMachineProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <GLTFModel url={ASSETS.cabinet} scale={1.2} offsetY={-0.9} />
  </group>
));

export const ServerRackProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <GLTFModel url={ASSETS.cabinet} scale={1.3} offsetY={-1.0} />
  </group>
));

export const PROP_TYPES = ['box', 'desk', 'chair', 'mug', 'cabinet', 'barrel', 'plant', 'monitor', 'vending', 'server', 'sofa', 'vase', 'stone', 'pillar'] as const;
export type PropType = typeof PROP_TYPES[number];

export const StoneProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <mesh castShadow receiveShadow position={[0, 0, 0]}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="#6a7266" roughness={0.95} />
    </mesh>
  </group>
));

export const PillarProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <mesh castShadow receiveShadow position={[0, 0, 0]}>
      <cylinderGeometry args={[0.5, 0.5, 2.5, 8]} />
      <meshStandardMaterial color="#5e665a" roughness={0.95} />
    </mesh>
  </group>
));

export const PropRegistry: Record<PropType, { component: React.ForwardRefExoticComponent<any>; size: [number, number, number]; offset: [number, number, number]; meshOffset: [number, number, number] }> = {
  stone: { component: StoneProp, size: [1.5, 1.5, 1.5], offset: [0, 0.75, 0], meshOffset: [0, 0, 0] },
  pillar: { component: PillarProp, size: [1.0, 2.5, 1.0], offset: [0, 1.25, 0], meshOffset: [0, 0, 0] },
  box: { component: BoxProp, size: [1, 1, 1], offset: [0, 0.5, 0], meshOffset: [0, 0.5, 0] },
  desk: { component: DeskProp, size: [2, 1, 1], offset: [0, 0.5, 0], meshOffset: [0, 0.5, 0] },
  chair: { component: ChairProp, size: [0.6, 1.2, 0.6], offset: [0, 0.6, 0], meshOffset: [0, 0.6, 0] },
  mug: { component: MugProp, size: [0.3, 0.3, 0.3], offset: [0, 0.15, 0], meshOffset: [0, 0.15, 0] },
  cabinet: { component: CabinetProp, size: [0.8, 1.5, 0.8], offset: [0, 0.75, 0], meshOffset: [0, 0.75, 0] },
  barrel: { component: BarrelProp, size: [0.8, 1.2, 0.8], offset: [0, 0.6, 0], meshOffset: [0, 0.6, 0] },
  plant: { component: PlantProp, size: [0.8, 1.5, 0.8], offset: [0, 0.75, 0], meshOffset: [0, 0.75, 0] },
  monitor: { component: MonitorProp, size: [0.8, 0.7, 0.3], offset: [0, 0.35, 0], meshOffset: [0, 0.35, 0] },
  vending: { component: VendingMachineProp, size: [1, 1.8, 0.8], offset: [0, 0.9, 0], meshOffset: [0, 0.9, 0] },
  server: { component: ServerRackProp, size: [0.8, 2, 0.8], offset: [0, 1, 0], meshOffset: [0, 1, 0] },
  sofa: { component: SofaProp, size: [2, 1, 0.8], offset: [0, 0.5, 0], meshOffset: [0, 0.5, 0] },
  vase: { component: VaseProp, size: [1, 1.5, 1], offset: [0, 0.75, 0], meshOffset: [0, 0.75, 0] },
};

