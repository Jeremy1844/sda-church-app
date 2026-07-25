import { createContext, useContext } from 'react';
import type { PwaInstallStatus } from './AppPreferences';

export interface BeforeInstallPromptEventLike extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type PwaInstallRequestResult =
  | 'accepted'
  | 'dismissed'
  | 'unavailable'
  | 'error';

interface PwaInstallContextValue {
  requestInstall: () => Promise<PwaInstallRequestResult>;
  status: PwaInstallStatus;
}

export const PwaInstallContext = createContext<PwaInstallContextValue>({
  requestInstall: async () => 'unavailable',
  status: 'not-applicable',
});

export const usePwaInstall = () => useContext(PwaInstallContext);
