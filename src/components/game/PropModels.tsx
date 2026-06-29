import React, { forwardRef, Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { DefaultLoadingManager } from 'three';

// Fix Poly Haven's relative texture paths
DefaultLoadingManager.setURLModifier((url) => {
  if (url.includes('dl.polyhaven.org') && url.includes('/textures/')) {
    return url.replace('dl.polyhaven.org', 'textures.polyhaven.net').replace('/gltf/', '/jpg/').replace('/textures/', '/');
  }
  return url;
});

// CC0 High Quality Assets from Poly Haven (1k GLTF versions for fast loading)
const ASSETS = {
  barrel: 'https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/Barrel_01/Barrel_01_1k.gltf',
  chair: 'https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/WoodenChair_01/WoodenChair_01_1k.gltf',
  box: 'https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/cardboard_box_01/cardboard_box_01_1k.gltf',
  pot: 'https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/brass_pot_02/brass_pot_02_1k.gltf',
  cabinet: 'https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/GothicCabinet_01/GothicCabinet_01_1k.gltf',
  sofa: 'https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/ArmChair_01/ArmChair_01_1k.gltf',
  desk: 'https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/WoodenTable_02/WoodenTable_02_1k.gltf',
  plant: 'https://raw.githubusercontent.com/pmndrs/market-assets/main/files/models/plant/model.gltf',
  mug: 'https://raw.githubusercontent.com/pmndrs/market-assets/main/files/models/mug/model.gltf',
};

// Pre-fetch
Object.values(ASSETS).forEach(url => useGLTF.preload(url));

const GLTFModel = forwardRef<any, { url: string; scale?: number; offsetY?: number; rotationOffset?: [number, number, number] }>(
  ({ url, scale = 1, offsetY = 0, rotationOffset = [0, 0, 0] }, ref) => {
    const { scene } = useGLTF(url);
    const clone = useMemo(() => {
      const c = scene.clone();
      c.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      return c;
    }, [scene]);

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
    <Suspense fallback={<Fallback color="#8B4513" />}>
      <GLTFModel url={ASSETS.barrel} scale={1.5} offsetY={-0.6} />
    </Suspense>
  </group>
));

export const ChairProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <Suspense fallback={<Fallback color="#A0522D" />}>
      <GLTFModel url={ASSETS.chair} scale={1.5} offsetY={-0.6} />
    </Suspense>
  </group>
));

export const BoxProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <Suspense fallback={<Fallback color="#d4a373" />}>
      <GLTFModel url={ASSETS.box} scale={2.5} offsetY={-0.5} />
    </Suspense>
  </group>
));

export const VaseProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <Suspense fallback={<Fallback color="#eab308" />}>
      <GLTFModel url={ASSETS.pot} scale={3.0} offsetY={0} />
    </Suspense>
  </group>
));

export const CabinetProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <Suspense fallback={<Fallback color="#374151" args={[0.8, 1.5, 0.8]} />}>
      <GLTFModel url={ASSETS.cabinet} scale={1.0} offsetY={-0.75} />
    </Suspense>
  </group>
));

export const SofaProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <Suspense fallback={<Fallback color="#0d9488" />}>
      <GLTFModel url={ASSETS.sofa} scale={1.2} offsetY={-0.5} />
    </Suspense>
  </group>
));

export const DeskProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <Suspense fallback={<Fallback color="#9c6644" args={[2, 1, 1]} />}>
      <GLTFModel url={ASSETS.desk} scale={1.5} offsetY={-0.45} />
    </Suspense>
  </group>
));

export const PlantProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <Suspense fallback={<Fallback color="#10b981" />}>
      <GLTFModel url={ASSETS.plant} scale={3} offsetY={-0.5} />
    </Suspense>
  </group>
));

export const MugProp = forwardRef((props: any, ref) => (
  <group ref={ref as any} {...props}>
    <Suspense fallback={<Fallback color="#f87171" />}>
      <GLTFModel url={ASSETS.mug} scale={4} offsetY={-0.2} />
    </Suspense>
  </group>
));

// Map the old prop types that we don't have perfect GLTFs for to something else
export const MonitorProp = BoxProp;
export const VendingMachineProp = CabinetProp;
export const ServerRackProp = CabinetProp;

export const PROP_TYPES = ['box', 'desk', 'chair', 'mug', 'cabinet', 'barrel', 'plant', 'monitor', 'vending', 'server', 'sofa', 'vase'] as const;
export type PropType = typeof PROP_TYPES[number];

export const PropRegistry: Record<PropType, { component: React.ForwardRefExoticComponent<any>; size: [number, number, number]; offset: [number, number, number]; meshOffset: [number, number, number] }> = {
  box: { component: BoxProp, size: [1, 1, 1], offset: [0, 0.5, 0], meshOffset: [0, 0.5, 0] },
  desk: { component: DeskProp, size: [2, 1, 1], offset: [0, 0.5, 0], meshOffset: [0, 0.45, 0] },
  chair: { component: ChairProp, size: [0.6, 1.2, 0.6], offset: [0, 0.6, 0], meshOffset: [0, 0.55, 0] },
  mug: { component: MugProp, size: [0.3, 0.3, 0.3], offset: [0, 0.15, 0], meshOffset: [0, 0.15, 0] },
  cabinet: { component: CabinetProp, size: [0.8, 1.5, 0.8], offset: [0, 0.75, 0], meshOffset: [0, 0.75, 0] },
  barrel: { component: BarrelProp, size: [0.8, 1.2, 0.8], offset: [0, 0.6, 0], meshOffset: [0, 0.6, 0] },
  plant: { component: PlantProp, size: [0.8, 1.5, 0.8], offset: [0, 0.75, 0], meshOffset: [0, 0.6, 0] },
  monitor: { component: MonitorProp, size: [0.8, 0.7, 0.3], offset: [0, 0.35, 0], meshOffset: [0, 0.025, 0] },
  vending: { component: VendingMachineProp, size: [1, 1.8, 0.8], offset: [0, 0.9, 0], meshOffset: [0, 0, 0] },
  server: { component: ServerRackProp, size: [0.8, 2, 0.8], offset: [0, 1, 0], meshOffset: [0, 0, 0] },
  sofa: { component: SofaProp, size: [2, 1, 0.8], offset: [0, 0.5, 0], meshOffset: [0, 0, 0] },
  vase: { component: VaseProp, size: [1, 1.5, 1], offset: [0, 0.75, 0], meshOffset: [0, 0, 0] },
};

