import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Generates an optimized prompt for a 3D isometric service icon
 * matching the visual aesthetic of ShramiXs / Neighborly Trust.
 * Requests a floating 3D object on a pure solid white background (#FFFFFF)
 * with ample padding and no ground shadows to guarantee crisp, automated transparent cutouts.
 */
export function buildServiceIconPrompt(categoryName: string): string {
  return `Cute 3D isometric icon for "${categoryName}" home service, high quality Blender 3D clay-render style, smooth matte plastic and metallic materials, vibrant cheerful modern colors, soft studio lighting, centered composition floating in mid-air, comfortable empty padding on all four sides occupying 70% of frame, single 3D object, no floor, no ground plane, no cast shadows on floor, isolated completely on a pure solid pure white background (hex #FFFFFF) with clean high contrast edges, no background scenery, no gradients on background, minimalist mobile app icon.`;
}

/**
 * Calls Google AI Studio's Imagen 3 model via Gemini API Key
 * to generate a 3D render of the service category.
 */
export async function generateCategory3DIcon(
  categoryName: string,
  apiKey: string,
  customPrompt?: string
): Promise<string> {
  const cleanKey = apiKey?.trim();
  if (!cleanKey) {
    throw new Error('Gemini API key is required. Please provide your Google AI Studio API key.');
  }

  const prompt = customPrompt || buildServiceIconPrompt(categoryName);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${encodeURIComponent(cleanKey)}`;

  const body = {
    instances: [
      {
        prompt: prompt
      }
    ],
    parameters: {
      sampleCount: 1,
      aspectRatio: '1:1',
      outputMimeType: 'image/png'
    }
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    let errorDetail = `Status ${res.status}: ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData?.error?.message) {
        errorDetail = errData.error.message;
      }
    } catch {}
    throw new Error(`Gemini Imagen API error: ${errorDetail}`);
  }

  const data = await res.json();
  const prediction = data?.predictions?.[0];

  if (!prediction?.bytesBase64Encoded) {
    throw new Error('No image was returned from the Gemini Imagen model.');
  }

  return `data:${prediction.mimeType || 'image/png'};base64,${prediction.bytesBase64Encoded}`;
}

/**
 * Connected BFS Flood-Fill Background Removal with:
 * 1. 16-point trimmed boundary sampling to detect true background color.
 * 2. Perceptual color distance (Redmean algorithm).
 * 3. Connected outer flood-fill to protect light/white surfaces INSIDE the 3D model.
 * 4. Ambient ground shadow attenuation.
 * 5. Safe anti-halo de-fringing (un-premultiplying white matting) so the icon
 *    looks pristine on dark backgrounds like the Customer App's #0B2942.
 */
export function removeSolidBackground(
  canvas: HTMLCanvasElement,
  tolerance = 38,
  feather = 16
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // 16 boundary sample points along perimeter
  const samplePoints: [number, number][] = [
    [0, 0],
    [Math.floor(w / 4), 0],
    [Math.floor(w / 2), 0],
    [Math.floor((3 * w) / 4), 0],
    [w - 1, 0],
    [0, Math.floor(h / 4)],
    [w - 1, Math.floor(h / 4)],
    [0, Math.floor(h / 2)],
    [w - 1, Math.floor(h / 2)],
    [0, Math.floor((3 * h) / 4)],
    [w - 1, Math.floor((3 * h) / 4)],
    [0, h - 1],
    [Math.floor(w / 4), h - 1],
    [Math.floor(w / 2), h - 1],
    [Math.floor((3 * w) / 4), h - 1],
    [w - 1, h - 1]
  ];

  const rSamples: number[] = [];
  const gSamples: number[] = [];
  const bSamples: number[] = [];

  for (const [cx, cy] of samplePoints) {
    const idx = (cy * w + cx) * 4;
    rSamples.push(data[idx]);
    gSamples.push(data[idx + 1]);
    bSamples.push(data[idx + 2]);
  }

  // Median calculation to reject any stray artifact pixels
  const median = (arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };

  const bgR = median(rSamples);
  const bgG = median(gSamples);
  const bgB = median(bSamples);

  // Perceptual color distance function (Redmean)
  const colorDist = (r: number, g: number, b: number) => {
    const rmean = (r + bgR) / 2;
    const dr = r - bgR;
    const dg = g - bgG;
    const db = b - bgB;
    return Math.sqrt(
      (2 + rmean / 256) * dr * dr +
      4 * dg * dg +
      (2 + (255 - rmean) / 256) * db * db
    );
  };

  // Helper to check if a pixel is neutral ambient shadow (low saturation, light-to-mid tone)
  const isNeutralShadow = (r: number, g: number, b: number) => {
    const maxVal = Math.max(r, g, b);
    const minVal = Math.min(r, g, b);
    const saturation = maxVal === 0 ? 0 : (maxVal - minVal) / maxVal;
    // Low saturation (<0.15) and relatively bright (>140) implies a faint drop shadow on white floor
    return saturation < 0.15 && minVal > 140;
  };

  const visited = new Uint8Array(w * h);
  const queue: number[] = [];

  const effectiveThreshold = tolerance + feather;

  // Initialize BFS queue with all border pixels matching background or shadow
  for (let x = 0; x < w; x++) {
    for (const y of [0, h - 1]) {
      const idx = y * w + x;
      const pIdx = idx * 4;
      const dist = colorDist(data[pIdx], data[pIdx + 1], data[pIdx + 2]);
      if (dist <= effectiveThreshold || isNeutralShadow(data[pIdx], data[pIdx + 1], data[pIdx + 2])) {
        queue.push(idx);
        visited[idx] = 1;
      }
    }
  }
  for (let y = 0; y < h; y++) {
    for (const x of [0, w - 1]) {
      const idx = y * w + x;
      if (!visited[idx]) {
        const pIdx = idx * 4;
        const dist = colorDist(data[pIdx], data[pIdx + 1], data[pIdx + 2]);
        if (dist <= effectiveThreshold || isNeutralShadow(data[pIdx], data[pIdx + 1], data[pIdx + 2])) {
          queue.push(idx);
          visited[idx] = 1;
        }
      }
    }
  }

  // BFS Flood Fill from outside inward
  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const cx = curr % w;
    const cy = Math.floor(curr / w);

    const neighbors: [number, number][] = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nIdx = ny * w + nx;
        if (!visited[nIdx]) {
          const npIdx = nIdx * 4;
          const nr = data[npIdx];
          const ng = data[npIdx + 1];
          const nb = data[npIdx + 2];
          const dist = colorDist(nr, ng, nb);

          if (dist <= effectiveThreshold || isNeutralShadow(nr, ng, nb)) {
            visited[nIdx] = 1;
            queue.push(nIdx);
          }
        }
      }
    }
  }

  // Apply smooth alpha cutout on visited background pixels
  for (let idx = 0; idx < w * h; idx++) {
    if (visited[idx]) {
      const pIdx = idx * 4;
      const r = data[pIdx];
      const g = data[pIdx + 1];
      const b = data[pIdx + 2];
      const dist = colorDist(r, g, b);

      if (dist <= tolerance) {
        data[pIdx + 3] = 0; // 100% transparent
      } else if (dist <= effectiveThreshold) {
        // Feathering zone
        const alphaFraction = (dist - tolerance) / Math.max(feather, 1);
        const newAlpha = Math.max(0, Math.min(1, alphaFraction));
        data[pIdx + 3] = Math.round(data[pIdx + 3] * newAlpha);

        // Anti-haloing / De-fringing: un-premultiply white background
        // C_true = (C - (1 - a) * C_bg) / a
        if (newAlpha > 0.08) {
          const safeAlpha = Math.max(newAlpha, 0.1);
          const unmix = (comp: number, bgComp: number) => {
            const trueVal = (comp - (1 - safeAlpha) * bgComp) / safeAlpha;
            return Math.max(0, Math.min(255, Math.round(trueVal)));
          };
          data[pIdx] = unmix(r, bgR);
          data[pIdx + 1] = unmix(g, bgG);
          data[pIdx + 2] = unmix(b, bgB);
        }
      } else if (isNeutralShadow(r, g, b)) {
        // Neutral shadow suppression: smoothly fade away floor shadows
        const brightness = (r + g + b) / 3;
        const shadowAlpha = Math.max(0, Math.min(1, (255 - brightness) / 120));
        data[pIdx + 3] = Math.round(data[pIdx + 3] * shadowAlpha * 0.4);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Resizes, removes background (transparent cutout), and compresses
 * the image into WebP format (~15-25 KB) on an offscreen HTML5 canvas.
 */
export async function processAndCompressIcon(
  dataUrl: string,
  options: {
    maxSize?: number;
    quality?: number;
    removeBackground?: boolean;
    tolerance?: number;
    feather?: number;
  } = {}
): Promise<string> {
  const {
    maxSize = 256,
    quality = 0.88,
    removeBackground = true,
    tolerance = 38,
    feather = 16
  } = options;

  if (typeof window === 'undefined') return dataUrl;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw centered and scaled to fit square
        ctx.drawImage(img, 0, 0, maxSize, maxSize);

        // Perform background removal if requested
        if (removeBackground) {
          removeSolidBackground(canvas, tolerance, feather);
        }

        // Export as WebP with alpha transparency, or PNG fallback
        let compressed = canvas.toDataURL('image/webp', quality);
        if (!compressed.startsWith('data:image/webp')) {
          compressed = canvas.toDataURL('image/png');
        }

        resolve(compressed);
      } catch (err) {
        console.warn('[processAndCompressIcon] Canvas processing fallback:', err);
        resolve(dataUrl);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image for processing'));
    img.src = dataUrl;
  });
}

/**
 * Converts a File or Blob into a base64 Data URL.
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a data URL to a Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/webp';
  const raw = atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Uploads category icon to Supabase Storage ('category-icons' bucket).
 * If storage upload fails (e.g. bucket doesn't exist yet), gracefully falls back
 * to returning the compressed data URL directly so the icon always works!
 */
export async function uploadCategoryIcon(
  supabaseClient: SupabaseClient | null,
  dataUrl: string,
  slug: string
): Promise<string> {
  if (!supabaseClient) return dataUrl;

  try {
    const blob = dataUrlToBlob(dataUrl);
    const fileName = `${slug}-${Date.now()}.webp`;

    const { data, error } = await supabaseClient.storage
      .from('category-icons')
      .upload(fileName, blob, {
        contentType: 'image/webp',
        upsert: true
      });

    if (!error && data?.path) {
      const { data: publicUrlData } = supabaseClient.storage
        .from('category-icons')
        .getPublicUrl(data.path);

      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }
  } catch (err) {
    console.warn('[uploadCategoryIcon] Storage upload failed, using data URL fallback:', err);
  }

  // Graceful fallback to compressed Data URL
  return dataUrl;
}
