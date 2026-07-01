import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Billboard } from '@react-three/drei';

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float time;
varying vec2 vUv;

// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;
  float t = time * 2.0;
  
  // Create a fire shape using uv.x and uv.y
  float strength = pow(1.0 - uv.y, 1.5) * 2.0;
  
  // Add noise
  float noiseValue = snoise(vec2(uv.x * 5.0, uv.y * 5.0 - t)) * 0.5 + 0.5;
  float noiseValue2 = snoise(vec2(uv.x * 10.0 + 100.0, uv.y * 10.0 - t * 1.5)) * 0.5 + 0.5;
  
  float finalNoise = (noiseValue + noiseValue2) * 0.5;
  
  // Base shape
  float shape = 1.0 - smoothstep(0.0, 0.5, abs(uv.x - 0.5));
  shape *= (1.0 - smoothstep(0.1, 0.9, uv.y));
  
  float mask = smoothstep(0.2, 0.7, finalNoise * shape * strength);
  
  // Colors
  vec3 color1 = vec3(1.0, 0.9, 0.2); // Yellow/white inner
  vec3 color2 = vec3(1.0, 0.4, 0.0); // Orange mid
  vec3 color3 = vec3(0.8, 0.1, 0.0); // Red outer
  
  vec3 finalColor = mix(color3, color2, smoothstep(0.1, 0.5, mask));
  finalColor = mix(finalColor, color1, smoothstep(0.5, 1.0, mask));
  
  float alpha = smoothstep(0.0, 0.2, mask);
  
  gl_FragColor = vec4(finalColor, alpha);
}
`;

export function AnimatedFire({ scale = 1 }: { scale?: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
      <mesh scale={[scale, scale * 2.0, scale]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </Billboard>
  );
}
