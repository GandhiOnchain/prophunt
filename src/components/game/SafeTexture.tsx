import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { getProceduralTexture } from './ProceduralTextures';

export const POLYHAVEN_SLUGS = [
  'wine_barrel_01',
  'dining_chair_02',
  'cardboard_box_01',
  'brass_pot_02',
  'vintage_cabinet_01',
  'sofa_03',
  'wooden_table_02'
];

export function fixPolyHavenUrl(url: string): string {
  if (!url) return url;
  
  let cleanUrl = url;
  
  // Normalize legacy domains
  if (cleanUrl.includes('textures.polyhaven.net')) {
    cleanUrl = cleanUrl.replace('textures.polyhaven.net', 'dl.polyhaven.org');
  }
  if (cleanUrl.includes('cdn.polyhaven.org')) {
    cleanUrl = cleanUrl.replace('cdn.polyhaven.org', 'dl.polyhaven.org');
  }

  // Check if this path references one of our known Poly Haven assets (either as a full URL or relative path)
  const filename = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
  for (const slug of POLYHAVEN_SLUGS) {
    if (cleanUrl.includes(slug)) {
      if (filename.endsWith('.gltf')) {
        return `https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/${slug}/${filename}`;
      } else if (filename.endsWith('.bin')) {
        return `https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/${slug}/${filename}`;
      } else if (filename.endsWith('.jpg') || filename.endsWith('.png')) {
        const resMatch = filename.match(/_(1k|2k|4k|8k)\./i);
        const resolution = resMatch ? resMatch[1].toLowerCase() : '1k';
        return `https://dl.polyhaven.org/file/ph-assets/Models/jpg/${resolution}/${slug}/${filename}`;
      }
    }
  }
  
  // Only parse actual Poly Haven paths if no slug matched
  if (!cleanUrl.includes('polyhaven.org') && !cleanUrl.includes('polyhaven.com')) {
    return cleanUrl;
  }
  
  // Standardize folder casing as backup
  cleanUrl = cleanUrl.replace(/\/models\//gi, '/Models/');
  cleanUrl = cleanUrl.replace(/\/textures\//gi, '/Textures/');
  cleanUrl = cleanUrl.replace(/\/hdris\//gi, '/HDRIs/');
  
  const gltfTextureMatch = cleanUrl.match(/\/Models\/gltf\/(1k|2k|4k|8k)\/([^/]+)\/textures\/(.+)$/i);
  if (gltfTextureMatch) {
    const [, resolution, slug, filenamePart] = gltfTextureMatch;
    return `https://dl.polyhaven.org/file/ph-assets/Models/jpg/${resolution}/${slug}/${filenamePart}`;
  }
  
  return cleanUrl;
}

// Global cache for loaded textures to prevent redundant assets on the GPU
const textureCache: { [url: string]: Promise<THREE.Texture> } = {};

function loadAndCacheTexture(url: string): Promise<THREE.Texture> {
  if (textureCache[url]) {
    return textureCache[url];
  }

  textureCache[url] = new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        resolve(tex);
      },
      undefined,
      (err) => {
        console.error('Failed to load cached texture:', url, err);
        reject(err);
      }
    );
  });

  return textureCache[url];
}

function parseTextureInfo(url: string): { name: string; type: 'diff' | 'nor' | 'rough' } | null {
  if (!url) return null;
  const knownNames = ['stone_brick_wall_001', 'mossy_marble_slab', 'coast_sand_01', 'brown_mud_dry', 'blue_metal_plate', 'tree_bark', 'fern_leaf', 'tree_leaves'];
  const name = knownNames.find((n) => url.includes(n)) || 'default';

  let type: 'diff' | 'nor' | 'rough' = 'diff';
  if (url.includes('_nor_') || url.includes('_nor_gl_') || url.includes('_nor_dx_')) {
    type = 'nor';
  } else if (url.includes('_rough_')) {
    type = 'rough';
  }

  return { name, type };
}

export function useSafeTexture(url: string) {
  // Initialize with beautiful, instant procedural texture so the game is fully textured immediately
  const initialTexture = useState(() => {
    const info = parseTextureInfo(url);
    return info ? getProceduralTexture(info.name, info.type) : null;
  })[0];

  const [texture, setTexture] = useState<THREE.Texture | null>(initialTexture);
  
  useEffect(() => {
    const info = parseTextureInfo(url);
    if (info && (info.name === 'mossy_marble_slab' || info.name === 'tree_bark' || info.name === 'fern_leaf' || info.name === 'tree_leaves')) {
      // Purely procedural, bypass CDN loading completely
      return;
    }

    const fixedUrl = fixPolyHavenUrl(url);
    if (!fixedUrl) return;

    let isMounted = true;
    let clonedTexture: THREE.Texture | null = null;

    loadAndCacheTexture(fixedUrl)
      .then((baseTex) => {
        if (isMounted) {
          clonedTexture = baseTex.clone();
          clonedTexture.needsUpdate = true;
          setTexture(clonedTexture);
        }
      })
      .catch((err) => {
        console.warn('CDN texture loading failed, keeping gorgeous procedural fallback texture:', fixedUrl, err);
      });

    return () => {
      isMounted = false;
      if (clonedTexture) {
        clonedTexture.dispose();
      }
    };
  }, [url]);
  
  return texture;
}
