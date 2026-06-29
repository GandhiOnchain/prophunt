import { useState, useEffect } from 'react';
import * as THREE from 'three';

export function useSafeTexture(url: string) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        setTexture(tex);
      },
      undefined,
      (err) => {
        console.error('Failed to load texture:', url, err);
      }
    );
  }, [url]);
  
  return texture;
}
