export interface PwaInstallGuidance {
  platform: string;
  steps: readonly string[];
}

export function resolvePwaInstallGuidance(userAgent?: string): PwaInstallGuidance;
