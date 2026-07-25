export const TEXT_SCALE_STORAGE_KEY = 'user-text-scale';
export const TEXT_SCALE_OPTIONS = Object.freeze([1, 1.25, 1.5]);
export const DEFAULT_TEXT_SCALE = 1;

export const isTextScale = (value) =>
  typeof value === 'number' && TEXT_SCALE_OPTIONS.some((option) => option === value);

export const normalizeTextScale = (value) =>
  isTextScale(value) ? value : DEFAULT_TEXT_SCALE;

export const parseStoredTextScale = (value) => {
  if (value === null || value.trim() === '') {
    return DEFAULT_TEXT_SCALE;
  }

  return normalizeTextScale(Number(value));
};

export const serializeTextScale = (value) => String(value);

export const scaleTypographyMetric = (value, scale) =>
  Math.round(value * scale * 100) / 100;

export const scaleTypographyRecord = (variants, scale) =>
  Object.fromEntries(
    Object.entries(variants).map(([name, variant]) => [
      name,
      {
        ...variant,
        ...(typeof variant.fontSize === 'number'
          ? { fontSize: scaleTypographyMetric(variant.fontSize, scale) }
          : {}),
        ...(typeof variant.lineHeight === 'number'
          ? { lineHeight: scaleTypographyMetric(variant.lineHeight, scale) }
          : {}),
      },
    ]),
  );

export const isStandaloneMode = (displayModeStandalone, navigatorStandalone) =>
  displayModeStandalone || navigatorStandalone === true;

export const resolvePwaInstallStatus = ({
  canPrompt,
  isStandalone,
  isWeb,
  lastPromptOutcome,
}) => {
  if (!isWeb) return 'not-applicable';
  if (isStandalone) return 'standalone';
  if (canPrompt) return 'prompt-available';
  if (lastPromptOutcome === 'accepted') return 'accepted';
  if (lastPromptOutcome === 'dismissed') return 'dismissed';
  return 'unavailable';
};
