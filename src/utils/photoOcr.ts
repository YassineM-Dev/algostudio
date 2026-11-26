import { createWorker, OEM, PSM } from 'tesseract.js';
import { cleanOcrToAlgo } from './ocrAlgoCleaner';

export type OcrPreprocessMode = 'screenshot' | 'photo';

export interface OcrProgress {
  stage: string;
  percent: number;
}

export interface PhotoOcrResult {
  code: string;
  rawText: string;
  confidence?: number;
  engine: 'local-ocr' | 'gemini-vision';
}

function loadImageElement(source: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de lire l'image sélectionnée."));
    };
    img.src = url;
  });
}

/**
 * Enhances screenshots & notebook photos on an offscreen canvas before Tesseract OCR:
 * - Upscales small images for sharper LSTM recognition
 * - Auto-inverts dark-theme screenshots (white text on dark background)
 * - Applies local adaptive thresholding for shadowed paper/notebook photos
 * - Adds white margin padding so edge characters aren't clipped
 */
export async function preprocessImageForOcr(
  file: Blob,
  mode: OcrPreprocessMode
): Promise<HTMLCanvasElement> {
  const img = await loadImageElement(file);
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;

  // Scale small images up (~1600px target width) and cap huge camera photos at 2200px
  let scale = 1;
  if (srcW < 1400) {
    scale = Math.min(2.5, 1600 / Math.max(srcW, 1));
  } else if (srcW > 2200) {
    scale = 2200 / srcW;
  }

  const drawW = Math.max(1, Math.round(srcW * scale));
  const drawH = Math.max(1, Math.round(srcH * scale));
  const pad = 28;

  const canvas = document.createElement('canvas');
  canvas.width = drawW + pad * 2;
  canvas.height = drawH + pad * 2;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, pad, pad, drawW, drawH);

  const imageData = ctx.getImageData(pad, pad, drawW, drawH);
  const data = imageData.data;
  const totalPixels = drawW * drawH;
  const gray = new Uint8Array(totalPixels);

  // Compute luminance & detect dark-mode background
  let lumSum = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    gray[p] = lum;
    lumSum += lum;
  }
  const avgLum = lumSum / Math.max(1, totalPixels);
  const isDarkTheme = avgLum < 115;

  if (mode === 'screenshot') {
    // Invert dark screenshots so Tesseract always sees dark ink on bright white background
    const contrast = 1.3;
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      let v = isDarkTheme ? 255 - gray[p] : gray[p];
      v = Math.max(0, Math.min(255, Math.round((v - 128) * contrast + 128)));
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  } else {
    // Paper / notebook photo mode: integral-image local adaptive threshold (removes paper shadows)
    const work = new Uint8Array(totalPixels);
    for (let p = 0; p < totalPixels; p++) {
      work[p] = isDarkTheme ? 255 - gray[p] : gray[p];
    }

    const integral = new Float64Array((drawW + 1) * (drawH + 1));
    const stride = drawW + 1;
    for (let y = 0; y < drawH; y++) {
      let rowSum = 0;
      const rowOffset = y * drawW;
      const intRow = (y + 1) * stride;
      const prevIntRow = y * stride;
      for (let x = 0; x < drawW; x++) {
        rowSum += work[rowOffset + x];
        integral[intRow + x + 1] = integral[prevIntRow + x + 1] + rowSum;
      }
    }

    const radius = Math.max(12, Math.min(28, Math.round(Math.min(drawW, drawH) / 30)));
    const bias = 11; // pixels darker than local mean - bias become black ink

    for (let y = 0; y < drawH; y++) {
      const y1 = Math.max(0, y - radius);
      const y2 = Math.min(drawH - 1, y + radius);
      for (let x = 0; x < drawW; x++) {
        const x1 = Math.max(0, x - radius);
        const x2 = Math.min(drawW - 1, x + radius);
        const area = (x2 - x1 + 1) * (y2 - y1 + 1);
        const sum =
          integral[(y2 + 1) * stride + (x2 + 1)] -
          integral[y1 * stride + (x2 + 1)] -
          integral[(y2 + 1) * stride + x1] +
          integral[y1 * stride + x1];
        const localMean = sum / area;
        const p = y * drawW + x;
        const v = work[p] < localMean - bias ? 0 : 255;
        const idx = p * 4;
        data[idx] = v;
        data[idx + 1] = v;
        data[idx + 2] = v;
        data[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, pad, pad);
  return canvas;
}

/**
 * 100% offline, zero-API-key French OCR using locally bundled Tesseract LSTM assets in public/ocr/.
 */
export async function extractAlgoOfflineOcr(
  file: Blob,
  mode: OcrPreprocessMode,
  onProgress?: (p: OcrProgress) => void
): Promise<PhotoOcrResult> {
  onProgress?.({ stage: "Préparation de l'image...", percent: 10 });
  const canvas = await preprocessImageForOcr(file, mode);

  const workerPath = new URL('./ocr/worker.min.js', window.location.href).href;
  const corePath = new URL('./ocr/tesseract-core-lstm.wasm.js', window.location.href).href;
  const langPath = new URL('./ocr', window.location.href).href;

  onProgress?.({ stage: 'Chargement du moteur OCR hors-ligne...', percent: 25 });
  const worker = await createWorker('fra', OEM.LSTM_ONLY, {
    workerPath,
    corePath,
    langPath,
    workerBlobURL: false,
    gzip: false,
    logger: (msg) => {
      if (msg.status === 'recognizing text') {
        const pct = Math.round(35 + (msg.progress || 0) * 60);
        onProgress?.({ stage: 'Reconnaissance du code...', percent: Math.min(95, pct) });
      }
    },
  });

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: '1',
    });

    const { data } = await worker.recognize(canvas);
    onProgress?.({ stage: 'Mise en forme du pseudocode...', percent: 98 });

    const rawText = data.text || '';
    const code = cleanOcrToAlgo(rawText);

    onProgress?.({ stage: 'Terminé', percent: 100 });
    return {
      code,
      rawText,
      confidence: typeof data.confidence === 'number' ? Math.round(data.confidence) : undefined,
      engine: 'local-ocr',
    };
  } finally {
    await worker.terminate();
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const str = String(reader.result || '');
      const comma = str.indexOf(',');
      resolve(comma >= 0 ? str.slice(comma + 1) : str);
    };
    reader.onerror = () => reject(new Error("Impossible d'encoder l'image."));
    reader.readAsDataURL(blob);
  });
}

/**
 * Optional Gemini Vision mode for difficult handwritten notebook photos (uses user's own free Gemini key).
 */
export async function extractAlgoWithGeminiVision(
  file: Blob,
  apiKey: string,
  onProgress?: (p: OcrProgress) => void
): Promise<PhotoOcrResult> {
  onProgress?.({ stage: 'Envoi de la photo au modèle IA Vision...', percent: 30 });
  const base64 = await blobToBase64(file);
  const mimeType = file.type || 'image/jpeg';

  const prompt = [
    "Tu es un expert en Algorithmique du Bac Informatique Tunisien.",
    "Transcris l'algorithme visible sur cette image en pseudocode exécutable selon la convention officielle tunisienne :",
    "- PAS de bloc Variables en haut (commence directement par Algorithme Nom puis Début ... Fin).",
    "- Utilise exactement les symboles ←, ≤, ≥, ≠, @ (passage par référence), À, É.",
    "- Place les Fonctions et Procédures après Fin.",
    "- Renvoie UNIQUEMENT le code pseudocode brut, sans explication ni bloc markdown.",
  ].join('\n');

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
    apiKey.trim()
  )}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        },
      ],
      generationConfig: { temperature: 0.1 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(
      res.status === 400 || res.status === 403
        ? 'Clé API Gemini invalide ou refusée. Vérifiez votre clé.'
        : `Erreur IA Vision (HTTP ${res.status})${errText ? ' : ' + errText.slice(0, 120) : ''}`
    );
  }

  onProgress?.({ stage: 'Mise en forme du pseudocode...', percent: 90 });
  const json = await res.json();
  const rawText: string =
    json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('\n') ||
    '';

  const code = cleanOcrToAlgo(rawText);
  onProgress?.({ stage: 'Terminé', percent: 100 });

  return {
    code,
    rawText,
    engine: 'gemini-vision',
  };
}
