import * as THREE from 'three';

// Global cache for procedural textures to prevent recreation
const proceduralCache: { [key: string]: THREE.Texture } = {};

/**
 * Generates high-quality procedural textures using Canvas API.
 * This guarantees pristine visual assets even if CDN is blocked, slow, or offline,
 * and completely eliminates "flat grey box" syndromes.
 */
export function getProceduralTexture(name: string, type: 'diff' | 'nor' | 'rough'): THREE.Texture {
  const cacheKey = `${name}_${type}`;
  if (proceduralCache[cacheKey]) {
    return proceduralCache[cacheKey];
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    // Fallback if canvas is not supported
    const fallbackTex = new THREE.Texture();
    proceduralCache[cacheKey] = fallbackTex;
    return fallbackTex;
  }

  if (name === 'stone_brick_wall_001') {
    generateStoneBrick(ctx, canvas.width, canvas.height, type);
  } else if (name === 'mossy_marble_slab') {
    generateMossyMarbleSlab(ctx, canvas.width, canvas.height, type);
  } else if (name === 'coast_sand_01') {
    generateCoastSand(ctx, canvas.width, canvas.height, type);
  } else if (name === 'brown_mud_dry') {
    generateBrownMud(ctx, canvas.width, canvas.height, type);
  } else if (name === 'blue_metal_plate') {
    generateBlueMetal(ctx, canvas.width, canvas.height, type);
  } else if (name === 'tree_bark') {
    generateTreeBark(ctx, canvas.width, canvas.height, type);
  } else if (name === 'fern_leaf') {
    generateFernLeaf(ctx, canvas.width, canvas.height, type);
  } else if (name === 'tree_leaves') {
    generateTreeLeaves(ctx, canvas.width, canvas.height, type);
  } else {
    // Generic fallback
    generateDefault(ctx, canvas.width, canvas.height, type);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  
  if (type === 'diff') {
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  proceduralCache[cacheKey] = texture;
  return texture;
}

// ==========================================
// 1. HIGH-DEF MOSSY ANCIENT STONE BRICKS
// ==========================================
function generateStoneBrick(ctx: CanvasRenderingContext2D, w: number, h: number, type: 'diff' | 'nor' | 'rough') {
  if (type === 'diff') {
    // Rich, deeply aged dark slate stone base
    ctx.fillStyle = '#3a3e3b';
    ctx.fillRect(0, 0, w, h);

    // Deep heavy grit noise and color variation
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 25;
      data[i] = Math.max(0, Math.min(255, data[i] + noise - 2));
      data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise + 3)); // slightly green 
      data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise - 4));
    }
    ctx.putImageData(imgData, 0, 0);

    // Draw staggered ancient bricks with individual variance
    const rows = 8;
    const rowH = h / rows;

    for (let r = 0; r < rows; r++) {
      const cols = 4;
      const colW = w / cols;
      const shift = (r % 2) * (colW / 2);
      
      for (let c = 0; c <= cols + 1; c++) {
        const x = (c * colW - shift + w) % w;
        
        // Darken random bricks to make them look wet, aged, or cracked
        if (Math.random() > 0.5) {
          ctx.fillStyle = 'rgba(10, 15, 10, 0.35)';
          ctx.fillRect(x + 2, r * rowH + 2, colW - 4, rowH - 4);
        }
        // Give some bricks a slightly brownish-orange oxidized tint
        if (Math.random() > 0.8) {
          ctx.fillStyle = 'rgba(60, 40, 20, 0.2)';
          ctx.fillRect(x + 2, r * rowH + 2, colW - 4, rowH - 4);
        }
      }
    }

    // Heavy Mortar lines with deep shadow
    ctx.strokeStyle = '#121411';
    ctx.lineWidth = 7;
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * rowH);
      ctx.lineTo(w, r * rowH);
      ctx.stroke();

      if (r < rows) {
        const cols = 4;
        const colW = w / cols;
        const shift = (r % 2) * (colW / 2);
        for (let c = 0; c <= cols + 1; c++) {
          const x = (c * colW - shift + w) % w;
          ctx.beginPath();
          ctx.moveTo(x, r * rowH);
          ctx.lineTo(x, (r + 1) * rowH);
          ctx.stroke();
        }
      }
    }

    // Water damage streaks flowing down from joints
    ctx.fillStyle = 'rgba(5, 10, 5, 0.4)';
    for(let i=0; i<25; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, Math.random() * 60);
    }

    // Heavy, vibrant creeping moss clusters clinging to joints
    ctx.fillStyle = 'rgba(25, 45, 15, 0.9)'; // Deep wet moss base
    for (let i = 0; i < 70; i++) {
      // Bias towards horizontal lines
      const my = (Math.floor(Math.random() * rows) * rowH) + (Math.random() - 0.5) * 15;
      const mx = Math.random() * w;
      
      const rSize = 15 + Math.random() * 35;
      ctx.beginPath();
      ctx.arc(mx, my, rSize, 0, Math.PI * 2);
      ctx.fill();

      // Lush bright green tips for 3D depth
      ctx.fillStyle = 'rgba(60, 100, 25, 0.85)';
      ctx.beginPath();
      ctx.arc(mx + (Math.random() - 0.5) * 8, my + (Math.random() - 0.5) * 8, rSize * 0.6, 0, Math.PI * 2);
      ctx.fill();
      
      // Vivid bright highlights
      ctx.fillStyle = 'rgba(95, 145, 40, 0.7)';
      ctx.beginPath();
      ctx.arc(mx + (Math.random() - 0.5) * 5, my - Math.random() * 6, rSize * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(25, 45, 15, 0.9)'; // reset
    }

    // Tiny hanging vine leaves
    ctx.fillStyle = 'rgba(70, 110, 30, 0.9)';
    for (let i = 0; i < 60; i++) {
      let gx = Math.random() * w;
      let gy = Math.random() * h;
      ctx.beginPath();
      ctx.ellipse(gx, gy, 2, 6, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  } 
  
  else if (type === 'nor') {
    // Normal map neutral purple/blue
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, w, h);

    // Draw brick edges with bevel highlights
    const rows = 8;
    const rowH = h / rows;
    
    // Draw horizontal mortar normals (indentations)
    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      // Top edge of brick (facing up)
      ctx.fillStyle = '#80c8ff'; 
      ctx.fillRect(0, y, w, 3);
      // Bottom edge of brick (facing down)
      ctx.fillStyle = '#8038ff'; 
      ctx.fillRect(0, y + rowH - 3, w, 3);

      // Vertical joints
      const cols = 4;
      const colW = w / cols;
      const shift = (r % 2) * (colW / 2);
      for (let c = 0; c <= cols + 1; c++) {
        const x = (c * colW - shift + w) % w;
        ctx.fillStyle = '#3880ff'; // Left
        ctx.fillRect(x, r * rowH, 3, rowH);
        ctx.fillStyle = '#c880ff'; // Right
        ctx.fillRect(x + colW - 3, r * rowH, 3, rowH);
      }
    }

    // Add high-frequency noise for stone grain and moss bumps
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const y = Math.floor((i / 4) / w);
      // If near a joint, add extreme moss bumpiness
      const distToJoint = Math.min(y % rowH, rowH - (y % rowH));
      if (distToJoint < 15 || Math.random() < 0.2) {
        const nX = (Math.random() - 0.5) * 35;
        const nY = (Math.random() - 0.5) * 35;
        data[i] = Math.max(0, Math.min(255, data[i] + nX));
        data[i+1] = Math.max(0, Math.min(255, data[i+1] + nY));
      } else {
        // Just stone grit
        const nX = (Math.random() - 0.5) * 12;
        const nY = (Math.random() - 0.5) * 12;
        data[i] = Math.max(0, Math.min(255, data[i] + nX));
        data[i+1] = Math.max(0, Math.min(255, data[i+1] + nY));
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } 
  
  else {
    // Roughness map (brick is rough ~ 0.7, moss is super matte ~ 0.95, water streaks gloss ~ 0.2)
    ctx.fillStyle = '#b3b3b3';
    ctx.fillRect(0, 0, w, h);
    
    // Draw water streaks (glossy)
    ctx.fillStyle = '#333333';
    for(let i=0; i<30; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, Math.random() * 60);
    }

    // Add moss patches (very matte/light grey) near joints
    ctx.fillStyle = '#f2f2f2';
    const rows = 8;
    const rowH = h / rows;
    for (let i = 0; i < 70; i++) {
      const my = (Math.floor(Math.random() * rows) * rowH) + (Math.random() - 0.5) * 15;
      const mx = Math.random() * w;
      ctx.beginPath();
      ctx.arc(mx, my, 15 + Math.random() * 35, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ==========================================
// 2. TROPICAL BEACH COAST SAND
// ==========================================
function generateCoastSand(ctx: CanvasRenderingContext2D, w: number, h: number, type: 'diff' | 'nor' | 'rough') {
  if (type === 'diff') {
    // Beautiful golden sand base
    ctx.fillStyle = '#dfc49f';
    ctx.fillRect(0, 0, w, h);

    // Fine grain noise
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 12;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise - 1));
      data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise - 3));
    }
    ctx.putImageData(imgData, 0, 0);

    // Draw wavy dune lines/ripple water marks
    ctx.strokeStyle = 'rgba(210, 180, 140, 0.45)';
    ctx.lineWidth = 14;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      const waveOffset = Math.random() * 100;
      ctx.moveTo(0, i * (h / 5));
      for (let x = 0; x <= w; x += 10) {
        const y = i * (h / 5) + Math.sin(x * 0.03 + waveOffset) * 15;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } 
  
  else if (type === 'nor') {
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, w, h);

    // Ripple normal waves
    for (let i = 0; i < 6; i++) {
      const waveOffset = Math.random() * 100;
      for (let x = 0; x < w; x += 3) {
        const y = i * (h / 5) + Math.sin(x * 0.03 + waveOffset) * 15;
        // Top slope (slightly positive Y)
        ctx.fillStyle = 'rgba(128, 150, 255, 0.4)';
        ctx.fillRect(x, y - 4, 3, 4);
        // Bottom slope (slightly negative Y)
        ctx.fillStyle = 'rgba(128, 106, 255, 0.4)';
        ctx.fillRect(x, y, 3, 4);
      }
    }
  } 
  
  else {
    // Sand is rough ~ 0.9, water ripples might be slightly wetter/shiner
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, w, h);
  }
}

// ==========================================
// 3. CAVERN DRY BROWN MUD -> PHOTOREALISTIC JUNGLE DIRT/MOSS
// ==========================================
function generateBrownMud(ctx: CanvasRenderingContext2D, w: number, h: number, type: 'diff' | 'nor' | 'rough') {
  if (type === 'diff') {
    // Dark earthy jungle mud
    ctx.fillStyle = '#2b1d14';
    ctx.fillRect(0, 0, w, h);

    // Rich dirt noise
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 20;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise - 2));
      data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise - 4));
    }
    ctx.putImageData(imgData, 0, 0);

    // Dense wet moss patches creeping on the ground
    for (let i = 0; i < 150; i++) {
      ctx.fillStyle = `rgba(${30 + Math.random() * 20}, ${50 + Math.random() * 40}, ${15 + Math.random() * 15}, ${0.6 + Math.random() * 0.4})`;
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 15 + Math.random() * 45, 0, Math.PI * 2);
      ctx.fill();
    }

    // Small pebbles and rocks
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = `rgba(${80 + Math.random() * 40}, ${80 + Math.random() * 40}, ${80 + Math.random() * 40}, 0.9)`;
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dead brown leaves scattered
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(${100 + Math.random() * 40}, ${60 + Math.random() * 30}, ${20 + Math.random() * 20}, 0.85)`;
      const lx = Math.random() * w;
      const ly = Math.random() * h;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 3 + Math.random() * 4, 6 + Math.random() * 8, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  } 
  
  else if (type === 'nor') {
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // High-frequency normal map for pebbles and moss bumps
    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() > 0.4) {
        const nX = (Math.random() - 0.5) * 45;
        const nY = (Math.random() - 0.5) * 45;
        data[i] = Math.max(0, Math.min(255, data[i] + nX));
        data[i+1] = Math.max(0, Math.min(255, data[i+1] + nY));
      }
    }
    ctx.putImageData(imgData, 0, 0);

  } 
  
  else {
    // Dirt is very rough ~ 0.95, wet mud patches are glossier ~ 0.6
    ctx.fillStyle = '#e5e5e5';
    ctx.fillRect(0, 0, w, h);

    // Wet puddles/mud gloss
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = 'rgba(100, 100, 100, 0.4)';
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 20 + Math.random() * 50, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ==========================================
// 4. SCI-FI BLUE INDUSTRIAL METAL PLATE
// ==========================================
function generateBlueMetal(ctx: CanvasRenderingContext2D, w: number, h: number, type: 'diff' | 'nor' | 'rough') {
  if (type === 'diff') {
    // Sleek tech blue metal
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, w, h);

    // Tech panel grids
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.strokeRect(w / 2, 10, 1, h - 20);
    ctx.strokeRect(10, h / 2, w - 20, 1);

    // Cyberpunk neon stripes
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, 40);
    ctx.lineTo(120, 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w - 40, h - 40);
    ctx.lineTo(w - 120, h - 40);
    ctx.stroke();

    // Rivet dots
    ctx.fillStyle = '#0f172a';
    const rivets = [
      [30, 30], [w - 30, 30], [30, h - 30], [w - 30, h - 30],
      [w / 2 - 20, h / 2 - 20], [w / 2 + 20, h / 2 + 20]
    ];
    rivets.forEach(([rx, ry]) => {
      ctx.beginPath();
      ctx.arc(rx, ry, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  } 
  
  else if (type === 'nor') {
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, w, h);

    // Bevels on plates
    ctx.fillStyle = '#b880ff'; // X+ highlight
    ctx.fillRect(w - 15, 10, 5, h - 20);
    ctx.fillStyle = '#4880ff'; // X- shade
    ctx.fillRect(10, 10, 5, h - 20);
    
    ctx.fillStyle = '#80b8ff'; // Y+ highlight
    ctx.fillRect(10, h - 15, w - 20, 5);
    ctx.fillStyle = '#8048ff'; // Y- shade
    ctx.fillRect(10, 10, w - 20, 5);
  } 
  
  else {
    // Metal is semi-glossy, so low roughness (e.g., 0.25)
    ctx.fillStyle = '#404040';
    ctx.fillRect(0, 0, w, h);
    
    // Rusty edges are rougher
    ctx.strokeStyle = '#a0a0a0';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, w - 20, h - 20);
  }
}

// ==========================================
// 4.5. MOSSY MARBLE SLABS (IMAGE 1 STYLE)
// ==========================================
function generateMossyMarbleSlab(ctx: CanvasRenderingContext2D, w: number, h: number, type: 'diff' | 'nor' | 'rough') {
  if (type === 'diff') {
    // Deep ancient slate grey base for photorealistic temple stone
    ctx.fillStyle = '#3c403d';
    ctx.fillRect(0, 0, w, h);

    // Fine dust, dark aging, and marble grain noise
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 16;
      data[i] = Math.max(0, Math.min(255, data[i] + noise - 4)); // Darken slightly
      data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise + 2)); // Add slight green tint
      data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise - 6));
    }
    ctx.putImageData(imgData, 0, 0);

    // Deep heavy joints for realistic stone blocks
    ctx.strokeStyle = '#1a1d1a';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, w - 10, h - 10);
    // Draw cross joints splitting the texture into 4 tiles
    ctx.beginPath();
    ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Dark water damage streaks dripping down
    ctx.fillStyle = 'rgba(10, 15, 10, 0.4)';
    for(let i=0; i<12; i++) {
      ctx.fillRect(Math.random() * w, 0, 2 + Math.random() * 6, Math.random() * h * 0.8);
    }

    // Crawling hyper-realistic deep green moss patches
    ctx.fillStyle = 'rgba(25, 45, 15, 0.9)'; // Deep, wet moss base
    for (let i = 0; i < 80; i++) {
      // Prioritize putting moss near joints (middle lines and edges)
      const onJoint = Math.random() > 0.2;
      let mx = Math.random() * w;
      let my = Math.random() * h;
      if (onJoint) {
        if (Math.random() > 0.5) {
          mx = w / 2 + (Math.random() - 0.5) * 40;
        } else {
          my = h / 2 + (Math.random() - 0.5) * 40;
        }
      }

      const rSize = 12 + Math.random() * 35;
      ctx.beginPath();
      ctx.arc(mx, my, rSize, 0, Math.PI * 2);
      ctx.fill();

      // Bright lush green moss tips
      ctx.fillStyle = 'rgba(65, 105, 30, 0.85)';
      ctx.beginPath();
      ctx.arc(mx + (Math.random() - 0.5) * 8, my + (Math.random() - 0.5) * 8, rSize * 0.6, 0, Math.PI * 2);
      ctx.fill();
      
      // Vivid bright green highlights for depth
      ctx.fillStyle = 'rgba(100, 150, 45, 0.7)';
      ctx.beginPath();
      ctx.arc(mx + (Math.random() - 0.5) * 4, my - Math.random() * 8, rSize * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(25, 45, 15, 0.9)'; // Reset base
    }

    // Drooping tiny fern/vine leaves
    ctx.fillStyle = 'rgba(75, 120, 35, 0.9)';
    for (let i = 0; i < 40; i++) {
      let gx = Math.random() * w;
      let gy = Math.random() * h;
      ctx.beginPath();
      ctx.ellipse(gx, gy, 3, 8, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  } 
  
  else if (type === 'nor') {
    // Normal map neutral purple/blue
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, w, h);

    // Draw bevels for the 4 tile slabs
    ctx.lineWidth = 6;
    
    // Horizontal bevels
    ctx.fillStyle = '#80b8ff'; // Upwards normal (Y+)
    ctx.fillRect(0, 0, w, 6);
    ctx.fillRect(0, h / 2, w, 6);
    ctx.fillStyle = '#8048ff'; // Downwards normal (Y-)
    ctx.fillRect(0, h / 2 - 6, w, 6);
    ctx.fillRect(0, h - 6, w, 6);

    // Vertical bevels
    ctx.fillStyle = '#4880ff'; // Leftwards normal (X-)
    ctx.fillRect(0, 0, 6, h);
    ctx.fillRect(w / 2, 0, 6, h);
    ctx.fillStyle = '#b880ff'; // Rightwards normal (X+)
    ctx.fillRect(w / 2 - 6, 0, 6, h);
    ctx.fillRect(w - 6, 0, 6, h);

    // Add high-frequency bumpy moss noise
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Simulate moss noise bump map
      const x = (i / 4) % w;
      const y = Math.floor((i / 4) / w);
      
      const distToHorizontalJoint = Math.abs(y - h / 2);
      const distToVerticalJoint = Math.abs(x - w / 2);
      // More intense normal mapping for moss areas
      if (distToHorizontalJoint < 30 || distToVerticalJoint < 30 || Math.random() < 0.25) {
        const nX = (Math.random() - 0.5) * 35;
        const nY = (Math.random() - 0.5) * 35;
        data[i] = Math.max(0, Math.min(255, data[i] + nX));
        data[i+1] = Math.max(0, Math.min(255, data[i+1] + nY));
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } 
  
  else {
    // Roughness map: Ancient stone is rough (0.7), moss is totally matte (0.95), wet spots are glossy (0.2)
    ctx.fillStyle = '#b3b3b3'; // Base stone roughness
    ctx.fillRect(0, 0, w, h);

    // Wet streaks dropping down
    ctx.fillStyle = '#333333'; // Glossy wet streaks
    for(let i=0; i<15; i++) {
      ctx.fillRect(Math.random() * w, 0, 3 + Math.random() * 8, Math.random() * h);
    }

    // Moss and cracks are completely matte (roughness ~0.95 = light grey)
    ctx.fillStyle = '#f2f2f2';
    
    // Draw rough joints
    ctx.fillRect(w / 2 - 6, 0, 12, h);
    ctx.fillRect(0, h / 2 - 6, w, 12);
    ctx.fillRect(0, 0, w, 8);
    ctx.fillRect(0, h - 8, w, 8);
    ctx.fillRect(0, 0, 8, h);
    ctx.fillRect(w - 8, 0, 8, h);

    // Draw rough moss patches (match visual clumps)
    for (let i = 0; i < 60; i++) {
      const mx = Math.random() * w;
      const my = Math.random() * h;
      const rSize = 15 + Math.random() * 35;
      ctx.beginPath();
      ctx.arc(mx, my, rSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ==========================================
// 5. DEFAULT FALLBACK
// ==========================================
function generateDefault(ctx: CanvasRenderingContext2D, w: number, h: number, type: 'diff' | 'nor' | 'rough') {
  if (type === 'diff') {
    ctx.fillStyle = '#888888';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, w - 20, h - 20);
  } else if (type === 'nor') {
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, w, h);
  }
}

// ==========================================
// 6. DETAILED WEATHERED TREE BARK WITH MOSS (UPGRADED)
// ==========================================
function generateTreeBark(ctx: CanvasRenderingContext2D, w: number, h: number, type: 'diff' | 'nor' | 'rough') {
  if (type === 'diff') {
    // Elegant dark-brown organic base, slightly greyed from age
    ctx.fillStyle = '#26201b';
    ctx.fillRect(0, 0, w, h);

    // Deep wood-grain lines running vertically with organic waves
    ctx.strokeStyle = '#120d0a';
    for (let i = 0; i < 100; i++) { // Very high complexity
      ctx.beginPath();
      ctx.lineWidth = 0.5 + Math.random() * 5;
      const startX = Math.random() * w;
      ctx.moveTo(startX, 0);
      
      let currX = startX;
      for (let y = 10; y <= h; y += 15) {
        // More subtle wave offset simulating natural fibers
        currX += Math.sin(y * 0.03 + startX) * 3.5 + (Math.random() - 0.5) * 2.5;
        ctx.lineTo(currX, y);
      }
      ctx.stroke();
    }

    // High-frequency bark fibers and grit
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const y = Math.floor((i / 4) / w);
      // Vertical correlation of noise
      const noise = (Math.random() - 0.5) * 25 + Math.sin(y * 0.08) * 8;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise - 2));
      data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise - 6));
    }
    ctx.putImageData(imgData, 0, 0);

    // Realistic heavy Moss weathering overlays (Image 2 style)
    ctx.fillStyle = 'rgba(40, 65, 20, 0.85)'; // Deeper, wet moss green
    for (let i = 0; i < 70; i++) {
      const mx = Math.random() * w;
      const my = Math.random() * h;
      const rVal = 10 + Math.random() * 55;
      ctx.beginPath();
      ctx.arc(mx, my, rVal, 0, Math.PI * 2);
      ctx.fill();

      // Bright lush green moss tips
      ctx.fillStyle = 'rgba(75, 115, 30, 0.7)';
      ctx.beginPath();
      ctx.arc(mx + (Math.random() - 0.5) * 8, my + (Math.random() - 0.5) * 8, rVal * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(40, 65, 20, 0.85)'; // Reset
    }
  } 
  
  else if (type === 'nor') {
    // Normal maps base
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Generate more intricate normal-map ridges
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % w;
      const y = Math.floor((i / 4) / w);
      
      // Compute sharper, wavy grain value
      const wave = Math.sin(x * 0.5 + Math.sin(y * 0.04) * 3.0) * 55;
      const noise = (Math.random() - 0.5) * 35;
      
      // X component (deep ridges)
      data[i] = Math.max(0, Math.min(255, 128 + wave + noise));
      // Y component (vertical bumps)
      data[i+1] = Math.max(0, Math.min(255, 128 + noise * 0.8));
    }
    ctx.putImageData(imgData, 0, 0);
  } 
  
  else {
    // Bark is deeply matte and rugged
    ctx.fillStyle = '#b0b0b0';
    ctx.fillRect(0, 0, w, h);

    // Deeper, more frequent cracks
    ctx.fillStyle = '#e0e0e0';
    for (let i = 0; i < 45; i++) {
      ctx.fillRect(Math.random() * w, 0, 1 + Math.random() * 3, h);
    }
    
  }
}

// ==========================================
// 7. PHOTOREALISTIC FERN LEAF WITH ALPHA
// ==========================================
function generateFernLeaf(ctx: CanvasRenderingContext2D, w: number, h: number, type: 'diff' | 'nor' | 'rough') {
  ctx.clearRect(0, 0, w, h); // Fully transparent background
  
  const midX = w / 2;
  
  if (type === 'diff') {
    // Stem
    ctx.strokeStyle = '#1a260f';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(midX, 20);
    ctx.lineTo(midX, h - 10);
    ctx.stroke();
    
    // Draw realistic fern fronds (sub-leaves) extending outwards
    for (let y = 30; y < h - 20; y += 12) { // Tighter spacing for dense fern
      // The envelope of the fern leaf
      const envelope = Math.sin(Math.pow((y / h), 0.8) * Math.PI) * 140;
      
      const rColor = `rgba(${30 + Math.random() * 20}, ${60 + Math.random() * 30}, ${20 + Math.random() * 10}, 0.95)`;
      ctx.strokeStyle = rColor;
      ctx.lineWidth = 8 + Math.random() * 4;
      ctx.lineCap = 'round';
      
      // Right frond
      ctx.beginPath();
      ctx.moveTo(midX, y);
      ctx.quadraticCurveTo(midX + envelope * 0.5, y - 10, midX + envelope, y + 5);
      ctx.stroke();
      
      // Left frond
      ctx.beginPath();
      ctx.moveTo(midX, y);
      ctx.quadraticCurveTo(midX - envelope * 0.5, y - 10, midX - envelope, y + 5);
      ctx.stroke();
    }

    // Add noise for cellular texture
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i+3] > 10) { // Only affect non-transparent pixels
        const noise = (Math.random() - 0.5) * 20;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise + 10)); // More green variance
        data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
      }
    }
    ctx.putImageData(imgData, 0, 0);

  } else if (type === 'nor') {
    // Normal map: transparent background should map to neutral normal (128, 128, 255)
    ctx.fillStyle = 'rgba(128, 128, 255, 0)';
    ctx.fillRect(0, 0, w, h);

    // Stem normal
    ctx.strokeStyle = 'rgba(128, 200, 255, 1)';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(midX, 20); ctx.lineTo(midX, h - 10); ctx.stroke();

    // Fronds normal
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    for (let y = 30; y < h - 20; y += 12) {
      const envelope = Math.sin(Math.pow((y / h), 0.8) * Math.PI) * 140;
      
      // Right frond (faces slightly right X+)
      ctx.strokeStyle = 'rgba(180, 128, 255, 1)';
      ctx.beginPath();
      ctx.moveTo(midX, y);
      ctx.quadraticCurveTo(midX + envelope * 0.5, y - 10, midX + envelope, y + 5);
      ctx.stroke();
      
      // Left frond (faces slightly left X-)
      ctx.strokeStyle = 'rgba(80, 128, 255, 1)';
      ctx.beginPath();
      ctx.moveTo(midX, y);
      ctx.quadraticCurveTo(midX - envelope * 0.5, y - 10, midX - envelope, y + 5);
      ctx.stroke();
    }
  } else {
    // Roughness: Ferns are waxy and slightly glossy (0.3 - 0.5)
    ctx.fillStyle = 'rgba(0,0,0,0)'; // Transparent
    ctx.fillRect(0, 0, w, h);

    // Fronds
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    for (let y = 30; y < h - 20; y += 12) {
      const envelope = Math.sin(Math.pow((y / h), 0.8) * Math.PI) * 140;
      ctx.strokeStyle = 'rgba(100, 100, 100, 1)'; // 0.4 roughness
      ctx.beginPath(); ctx.moveTo(midX, y); ctx.quadraticCurveTo(midX + envelope * 0.5, y - 10, midX + envelope, y + 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX, y); ctx.quadraticCurveTo(midX - envelope * 0.5, y - 10, midX - envelope, y + 5); ctx.stroke();
    }
    
    // Stem is smoother
    ctx.strokeStyle = 'rgba(70, 70, 70, 1)'; 
    ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(midX, 20); ctx.lineTo(midX, h - 10); ctx.stroke();
  }
}

// ==========================================
// 8. TROPICAL TREE LEAVES (DENSE CLUSTERS)
// ==========================================
function generateTreeLeaves(ctx: CanvasRenderingContext2D, w: number, h: number, type: 'diff' | 'nor' | 'rough') {
  if (type === 'diff') {
    // Transparent background so alpha clipping works
    ctx.clearRect(0, 0, w, h);

    // Draw thousands of leaf stamps for dense volume
    for (let i = 0; i < 4000; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      const size = 15 + Math.random() * 25;
      const rot = Math.random() * Math.PI * 2;
      
      // Deeper leaves are darker, surface leaves are brighter
      const depth = Math.random(); 
      let r = 20 + depth * 30;
      let g = 40 + depth * 70;
      let b = 15 + depth * 20;
      
      // Randomly make some leaves yellowish/dead
      if (Math.random() > 0.9) {
        r += 30; g += 10; b -= 10;
      }

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.3, size, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Central vein
      ctx.strokeStyle = `rgba(${r*0.6}, ${g*0.6}, ${b*0.6}, 0.8)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -size*0.9);
      ctx.lineTo(0, size*0.9);
      ctx.stroke();
      
      ctx.restore();
    }
  } else if (type === 'nor') {
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, w, h);

    // Leaves facing outward normals
    for (let i = 0; i < 3000; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      const size = 15 + Math.random() * 25;
      const rot = Math.random() * Math.PI * 2;
      
      // Fake normal angles
      const nx = 128 + (Math.random() - 0.5) * 128;
      const ny = 128 + (Math.random() - 0.5) * 128;
      
      ctx.fillStyle = `rgba(${nx}, ${ny}, 255, 0.9)`;
      
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.3, size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else {
    // Roughness: waxy leaves (0.4) on deep matte void (1.0)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 4000; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      const size = 15 + Math.random() * 25;
      const rot = Math.random() * Math.PI * 2;
      
      const rough = 80 + Math.random() * 40; // 0.3 to 0.5 roughly
      ctx.fillStyle = `rgb(${rough}, ${rough}, ${rough})`;
      
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.3, size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
