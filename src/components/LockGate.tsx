import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, Unlock } from 'lucide-react';

interface LockGateProps {
  sectionName: string;
  onUnlock: (password: string) => boolean;
}

export const LockGate: React.FC<LockGateProps> = ({ sectionName, onUnlock }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onUnlock(password);
    if (!ok) {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] p-6 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="w-11 h-11 rounded-xl bg-[#E50914]/12 border border-[#E50914]/30 flex items-center justify-center mb-3">
            <Lock className="w-5 h-5 text-[#E50914]" />
          </div>
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            {sectionName} verrouillé
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Entrez le mot de passe pour accéder aux Résumés, Modules et Sujets Bac.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              placeholder="Mot de passe..."
              autoFocus
              aria-label="Mot de passe"
              className={`w-full pl-3.5 pr-9 py-2 rounded-lg bg-[var(--bg-code)] border text-sm font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-colors ${
                error
                  ? 'border-[#E50914]'
                  : 'border-[var(--border-main)] focus:border-[#E50914]'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              tabIndex={-1}
              aria-label={showPassword ? 'Masquer' : 'Afficher'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#DC0915] dark:text-[#FF4D57] font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Mot de passe incorrect.</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#E50914] hover:bg-[#FF2A2A] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Déverrouiller</span>
          </button>
        </form>
      </div>
    </div>
  );
};
