import React from 'react';
import { RefreshCw, Download, CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import type { AlgoUpdateStatus } from '../vite-env';

interface UpdateBannerProps {
  status: AlgoUpdateStatus;
  onInstall: () => void;
  onDismiss: () => void;
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({ status, onInstall, onDismiss }) => {
  if (status.state === 'idle') return null;

  return (
    <div className="px-3 py-1.5 bg-[var(--bg-elevated)] border-b border-[var(--border-main)] flex items-center justify-between gap-3 text-xs shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {status.state === 'checking' && (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-[#E50914] animate-spin shrink-0" />
            <span className="text-[var(--text-secondary)]">
              Vérification des mises à jour...
            </span>
          </>
        )}

        {status.state === 'available' && (
          <>
            <Download className="w-3.5 h-3.5 text-[#E50914] shrink-0" />
            <span className="text-[var(--text-primary)] font-medium">
              Nouvelle version <strong>v{status.version}</strong> disponible — téléchargement...
            </span>
          </>
        )}

        {status.state === 'downloading' && (
          <>
            <Download className="w-3.5 h-3.5 text-[#E50914] animate-bounce shrink-0" />
            <span className="text-[var(--text-primary)] font-medium">
              Téléchargement de la mise à jour :{' '}
              <span className="font-mono font-bold text-[#E50914]">{status.percent ?? 0}%</span>
            </span>
            <div className="w-28 h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden hidden sm:block">
              <div
                className="h-full bg-[#E50914] transition-all"
                style={{ width: `${status.percent ?? 0}%` }}
              />
            </div>
          </>
        )}

        {status.state === 'downloaded' && (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-[var(--text-primary)] font-medium">
              Mise à jour <strong>v{status.version}</strong> prête à installer.
            </span>
          </>
        )}

        {status.state === 'up-to-date' && (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-[var(--text-secondary)]">
              {status.message || `AlgoStudio est à jour (v${status.version}).`}
            </span>
          </>
        )}

        {status.state === 'not-configured' && (
          <>
            <Info className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span className="text-[var(--text-secondary)] truncate">{status.message}</span>
          </>
        )}

        {status.state === 'error' && (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-[#E50914] shrink-0" />
            <span className="text-[var(--text-secondary)] truncate">{status.message}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {status.state === 'downloaded' && (
          <button
            type="button"
            onClick={onInstall}
            className="px-2.5 py-1 rounded-md bg-[#E50914] hover:bg-[#FF2A2A] text-white text-[11px] font-semibold cursor-pointer"
          >
            Redémarrer &amp; Installer
          </button>
        )}

        {status.state !== 'downloading' && status.state !== 'checking' && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
