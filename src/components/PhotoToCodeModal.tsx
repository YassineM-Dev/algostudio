import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera as NativeCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  Camera,
  Upload,
  X,
  Sparkles,
  FileCode2,
  Replace,
  FilePlus2,
  Loader2,
  AlertCircle,
  Monitor,
  FileText,
  KeyRound,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Image as ImageIcon,
} from 'lucide-react';
import {
  extractAlgoOfflineOcr,
  extractAlgoWithGeminiVision,
  OcrPreprocessMode,
  OcrProgress,
} from '../utils/photoOcr';
import { extractAlgoFilenameFromCode } from '../utils/ocrAlgoCleaner';
import { formatPseudocode } from '../engine';

const GEMINI_KEY_STORAGE = 'algostudio_gemini_key_v1';

async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}

interface PhotoToCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplaceActive: (code: string) => void;
  onOpenNewTab: (code: string, filename: string) => void;
}

export const PhotoToCodeModal: React.FC<PhotoToCodeModalProps> = ({
  isOpen,
  onClose,
  onReplaceActive,
  onOpenNewTab,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [preprocessMode, setPreprocessMode] = useState<OcrPreprocessMode>('screenshot');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [useGemini, setUseGemini] = useState(false);
  const [geminiKey, setGeminiKey] = useState<string>(() => {
    try {
      return localStorage.getItem(GEMINI_KEY_STORAGE) || '';
    } catch {
      return '';
    }
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<OcrProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractedCode, setExtractedCode] = useState('');
  const [confidence, setConfidence] = useState<number | undefined>(undefined);
  const [usedEngine, setUsedEngine] = useState<'local-ocr' | 'gemini-vision' | null>(null);

  useEffect(() => {
    try {
      if (geminiKey.trim()) localStorage.setItem(GEMINI_KEY_STORAGE, geminiKey.trim());
      else localStorage.removeItem(GEMINI_KEY_STORAGE);
    } catch {
      // ignore
    }
  }, [geminiKey]);

  const selectImage = useCallback((file: File, fromCamera = false) => {
    if (!file.type.startsWith('image/')) {
      setError('Veuillez choisir un fichier image valide (PNG, JPG, WEBP, BMP).');
      return;
    }
    setError(null);
    setImageFile(file);
    if (fromCamera) {
      setPreprocessMode('photo');
    }
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }, []);

  // Native Android/iOS camera capture via @capacitor/camera (with HTML5 capture="environment" fallback)
  const handleTakeCameraPhoto = useCallback(async () => {
    setError(null);
    if (Capacitor.isNativePlatform()) {
      try {
        const photo = await NativeCamera.getPhoto({
          source: CameraSource.Camera,
          resultType: CameraResultType.DataUrl,
          quality: 92,
          allowEditing: true,
          correctOrientation: true,
          saveToGallery: false,
        });
        if (photo.dataUrl) {
          const ext = photo.format || 'jpeg';
          const file = await dataUrlToFile(photo.dataUrl, `camera_algo.${ext}`);
          selectImage(file, true);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err || '');
        if (!/cancel/i.test(msg)) {
          setError("Impossible d'accéder à la caméra. Vérifiez les permissions de l'application.");
        }
      }
    } else {
      cameraInputRef.current?.click();
    }
  }, [selectImage]);

  const handlePickFromGallery = useCallback(async () => {
    setError(null);
    if (Capacitor.isNativePlatform()) {
      try {
        const photo = await NativeCamera.getPhoto({
          source: CameraSource.Photos,
          resultType: CameraResultType.DataUrl,
          quality: 92,
          correctOrientation: true,
        });
        if (photo.dataUrl) {
          const ext = photo.format || 'jpeg';
          const file = await dataUrlToFile(photo.dataUrl, `galerie_algo.${ext}`);
          selectImage(file, false);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err || '');
        if (!/cancel/i.test(msg)) {
          fileInputRef.current?.click();
        }
      }
    } else {
      fileInputRef.current?.click();
    }
  }, [selectImage]);

  // Cleanup preview object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Support Escape to close & Ctrl+V clipboard image paste while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      }
    };

    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            e.preventDefault();
            const ext = blob.type.split('/')[1] || 'png';
            const pastedFile = new File([blob], `capture.${ext}`, { type: blob.type });
            selectImage(pastedFile, false);
            break;
          }
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('paste', onPaste);
    };
  }, [isOpen, isProcessing, onClose, selectImage]);

  if (!isOpen) return null;

  const handleExtract = async () => {
    if (!imageFile) {
      setError("Veuillez d'abord prendre une photo ou importer une image d'algorithme.");
      return;
    }
    if (useGemini && !geminiKey.trim()) {
      setError(
        'Entrez votre clé API Gemini (ou décochez le mode IA Vision pour utiliser l’OCR hors-ligne gratuit).'
      );
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress({ stage: 'Démarrage...', percent: 5 });

    try {
      const result = useGemini
        ? await extractAlgoWithGeminiVision(imageFile, geminiKey, setProgress)
        : await extractAlgoOfflineOcr(imageFile, preprocessMode, setProgress);

      if (!result.code.trim()) {
        setError(
          "Aucun texte lisible n'a été détecté sur cette image. Essayez l'autre mode de traitement (Photo papier / Capture) ou une photo plus nette."
        );
      } else {
        setExtractedCode(result.code);
        setConfidence(result.confidence);
        setUsedEngine(result.engine);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'analyse de la photo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) selectImage(file, false);
  };

  const handleReplace = () => {
    if (!extractedCode.trim()) return;
    onReplaceActive(extractedCode);
    onClose();
  };

  const handleOpenNew = () => {
    if (!extractedCode.trim()) return;
    const filename = extractAlgoFilenameFromCode(extractedCode);
    onOpenNewTab(extractedCode, filename);
    onClose();
  };

  const lineCount = extractedCode ? extractedCode.split('\n').length : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-2 sm:p-3"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div className="w-full max-w-4xl max-h-[92dvh] flex flex-col rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-2.5 bg-[var(--bg-elevated)] border-b border-[var(--border-main)] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-md bg-[#E50914]/15 border border-[#E50914]/30 flex items-center justify-center shrink-0">
              <Camera className="w-3.5 h-3.5 text-[#E50914]" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-[var(--text-primary)] truncate">
                Photo → Code (Caméra &amp; OCR hors-ligne)
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] truncate">
                Prenez en photo votre cahier, choisissez une image ou collez (Ctrl+V)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 cursor-pointer shrink-0"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: 2 Columns on desktop, stacked scrollable on phone */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border-main)] overflow-y-auto">
          {/* Left: Camera + Photo Upload + Preprocessing Controls */}
          <div className="p-3.5 sm:p-4 flex flex-col gap-3">
            {/* Hidden inputs for gallery & mobile web rear camera */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) selectImage(file, false);
                e.target.value = '';
              }}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) selectImage(file, true);
                e.target.value = '';
              }}
              className="hidden"
            />

            {/* Quick Camera & Gallery Buttons (works natively on Android, iOS & Web) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void handleTakeCameraPhoto()}
                disabled={isProcessing}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#E50914]/12 hover:bg-[#E50914]/20 border border-[#E50914]/40 text-[#DC0915] dark:text-[#FF4D57] text-xs font-semibold transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Caméra</span>
              </button>

              <button
                type="button"
                onClick={() => void handlePickFromGallery()}
                disabled={isProcessing}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-primary)] text-xs font-semibold transition-colors cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-[var(--text-muted)]" />
                <span>Galerie / Fichier</span>
              </button>
            </div>

            {!previewUrl ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => void handlePickFromGallery()}
                className={`flex-1 min-h-[160px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 p-4 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-[#E50914] bg-[#E50914]/8'
                    : 'border-[var(--border-main)] bg-[var(--bg-elevated)] hover:border-[#E50914]/60'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#E50914]/12 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-[#E50914]" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    Glissez une photo ici ou utilisez Caméra / Galerie
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] hidden sm:flex items-center justify-center gap-1">
                    <ClipboardPaste className="w-3 h-3" />
                    <span>Collez aussi directement une capture avec Ctrl+V</span>
                  </p>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  PNG · JPG · WEBP · BMP
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="relative rounded-lg border border-[var(--border-main)] bg-[var(--bg-code)] overflow-hidden flex items-center justify-center h-48 sm:h-52">
                  <img
                    src={previewUrl}
                    alt="Aperçu de la photo"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-mono text-[var(--text-muted)] truncate">
                    {imageFile?.name} (
                    {imageFile ? Math.max(1, Math.round(imageFile.size / 1024)) : 0} Ko)
                  </span>
                </div>
              </div>
            )}

            {/* Image Type Selector (Local Offline OCR) */}
            {!useGemini && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  Type d&apos;image (OCR hors-ligne gratuit)
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreprocessMode('screenshot')}
                    disabled={isProcessing}
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
                      preprocessMode === 'screenshot'
                        ? 'bg-[#E50914]/12 border-[#E50914] text-[#DC0915] dark:text-[#FF4D57] font-semibold'
                        : 'bg-[var(--bg-elevated)] border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Capture / PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreprocessMode('photo')}
                    disabled={isProcessing}
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
                      preprocessMode === 'photo'
                        ? 'bg-[#E50914]/12 border-[#E50914] text-[#DC0915] dark:text-[#FF4D57] font-semibold'
                        : 'bg-[var(--bg-elevated)] border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Photo papier</span>
                  </button>
                </div>
              </div>
            )}

            {/* Extract CTA Button + Progress Bar */}
            <button
              type="button"
              onClick={handleExtract}
              disabled={!imageFile || isProcessing}
              className="w-full py-2 px-3 rounded-lg bg-[#E50914] hover:bg-[#FF2A2A] disabled:opacity-45 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{progress?.stage || 'Analyse en cours...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extraire le code de la photo</span>
                </>
              )}
            </button>

            {isProcessing && progress && (
              <div className="space-y-1">
                <div className="w-full h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                  <div
                    className="h-full bg-[#E50914] transition-all duration-200"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                  <span>{progress.stage}</span>
                  <span>{progress.percent}%</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-2.5 rounded-lg bg-[#E50914]/10 border border-[#E50914]/30 flex items-start gap-2 text-xs text-[#DC0915] dark:text-[#FF6B73]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Optional Discreet AI Vision Settings (for difficult handwriting) */}
            <div className="pt-1 border-t border-[var(--border-soft)]">
              <button
                type="button"
                onClick={() => setShowAiPanel((v) => !v)}
                className="w-full flex items-center justify-between text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer py-0.5"
              >
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3 h-3" />
                  <span>Écriture manuscrite difficile ? Mode IA Vision (optionnel)</span>
                </span>
                {showAiPanel ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showAiPanel && (
                <div className="mt-2 p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-soft)] space-y-2 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--text-primary)] font-medium">
                    <input
                      type="checkbox"
                      checked={useGemini}
                      onChange={(e) => setUseGemini(e.target.checked)}
                      className="accent-[#E50914]"
                    />
                    <span>Utiliser Gemini Vision (recommandé pour cahier manuscrit)</span>
                  </label>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="Clé API gratuite Google AI Studio (stockée localement)"
                    className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-surface)] border border-[var(--border-main)] focus:border-[#E50914] text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right: Editable Extracted Pseudocode Preview */}
          <div className="p-3.5 sm:p-4 flex flex-col gap-2.5 min-h-[260px]">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                <FileCode2 className="w-3.5 h-3.5 text-[#E50914]" />
                <span>Code détecté (modifiable)</span>
              </span>

              <div className="flex items-center gap-2">
                {confidence !== undefined && usedEngine === 'local-ocr' && (
                  <span className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-soft)] font-mono text-[10px] text-[var(--text-muted)]">
                    OCR {confidence}%
                  </span>
                )}
                {usedEngine === 'gemini-vision' && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/12 border border-emerald-500/30 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                    IA Vision
                  </span>
                )}
                {extractedCode.trim() && (
                  <button
                    type="button"
                    onClick={() => setExtractedCode((c) => formatPseudocode(c))}
                    className="px-2 py-0.5 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    Formater
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={extractedCode}
              onChange={(e) => setExtractedCode(e.target.value)}
              placeholder={`Le pseudocode extrait de la photo apparaîtra ici...\n\nVous pourrez corriger une lettre si besoin avant de l'insérer dans l'éditeur.`}
              spellCheck={false}
              className="flex-1 min-h-[200px] sm:min-h-[240px] w-full p-3 rounded-lg bg-[var(--bg-code)] border border-[var(--border-main)] focus:border-[#E50914] font-mono text-xs leading-relaxed text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none focus:outline-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {lineCount > 0 ? `${lineCount} ligne${lineCount > 1 ? 's' : ''}` : 'En attente'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReplace}
                  disabled={!extractedCode.trim() || isProcessing}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-main)] text-xs font-medium text-[var(--text-primary)] disabled:opacity-40 cursor-pointer"
                >
                  <Replace className="w-3.5 h-3.5" />
                  <span>Remplacer</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenNew}
                  disabled={!extractedCode.trim() || isProcessing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#E50914] hover:bg-[#FF2A2A] text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  <FilePlus2 className="w-3.5 h-3.5" />
                  <span>Nouvel onglet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
