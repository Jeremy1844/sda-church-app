export const TEXT_SCALE_STORAGE_KEY: 'user-text-scale';
export const TEXT_SCALE_OPTIONS: readonly [1, 1.25, 1.5];
export type TextScale = (typeof TEXT_SCALE_OPTIONS)[number];
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
