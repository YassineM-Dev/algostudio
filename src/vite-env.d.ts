/// <reference types="vite/client" />

export interface AlgoUpdateStatus {
  state:
    | 'idle'
    | 'checking'
    | 'available'
    | 'downloading'
    | 'downloaded'
    | 'up-to-date'
    | 'not-configured'
    | 'error';
  version?: string;
  percent?: number;
  message?: string;
}

declare global {
  interface Window {
    algoUpdater?: {
      isDesktop: boolean;
      getVersion: () => Promise<string>;
      checkForUpdates: () => Promise<void>;
      installUpdate: () => Promise<void>;
      onStatus: (callback: (status: AlgoUpdateStatus) => void) => () => void;
    };
  }
}
