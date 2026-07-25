export const TEXT_SCALE_STORAGE_KEY: 'user-text-scale';
export const TEXT_SCALE_MIN: 1;
export const TEXT_SCALE_MAX: 2;
export const TEXT_SCALE_STEP: 0.05;
export const TEXT_SCALE_OPTIONS: readonly [1, 1.25, 1.5];
export type TextScale =
  | 1
  | 1.05
  | 1.1
  | 1.15
  | 1.2
  | 1.25
  | 1.3
  | 1.35
  | 1.4
  | 1.45
  | 1.5
  | 1.55
  | 1.6
  | 1.65
  | 1.7
  | 1.75
  | 1.8
  | 1.85
  | 1.9
  | 1.95
  | 2;
export const DEFAULT_TEXT_SCALE: TextScale;

export type PwaInstallStatus =
  | 'not-applicable'
  | 'standalone'
  | 'prompt-available'
  | 'accepted'
  | 'dismissed'
  | 'unavailable';

export type PwaInstallPromptOutcome = 'accepted' | 'dismissed' | null;

export interface PwaInstallSnapshot {
  canPrompt: boolean;
  isStandalone: boolean;
  isWeb: boolean;
  lastPromptOutcome: PwaInstallPromptOutcome;
}

export interface TypographyVariant {
  fontSize?: number;
  lineHeight?: number;
  [key: string]: unknown;
}

export function isTextScale(value: unknown): value is TextScale;
export function normalizeTextScale(value: unknown): TextScale;
export function parseStoredTextScale(value: string | null): TextScale;
export function serializeTextScale(value: TextScale): string;
export function scaleTypographyMetric(value: number, scale: TextScale): number;
export function scaleTypographyRecord(
  variants: Record<string, TypographyVariant>,
  scale: TextScale,
): Record<string, TypographyVariant>;
export function isStandaloneMode(
  displayModeStandalone: boolean,
  navigatorStandalone?: boolean,
): boolean;
export function resolvePwaInstallStatus(
  snapshot: PwaInstallSnapshot,
): PwaInstallStatus;
