export const TEXT_SCALE_STORAGE_KEY = 'user-text-scale';
export const TEXT_SCALE_MIN = 1;
export const TEXT_SCALE_MAX = 2;
export const TEXT_SCALE_STEP = 0.05;
// Compact presets remain available to the first-run screen. The full range is
// exposed by the accessibility slider.
export const TEXT_SCALE_OPTIONS = Object.freeze([1, 1.25, 1.5]);
export const DEFAULT_TEXT_SCALE = 1;

// Native slider implementations may emit 32-bit floating-point representations
// (for example 1.05 as 1.0499999523). Accept only that representation noise,
// then normalize every accepted value back to the exact two-decimal step.
const TEXT_SCALE_EPSILON = 1e-6;

const snapTextScale = (value) => {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < TEXT_SCALE_MIN - TEXT_SCALE_EPSILON ||
    value > TEXT_SCALE_MAX + TEXT_SCALE_EPSILON
  ) {
    return null;
  }

  const stepIndex = Math.round((value - TEXT_SCALE_MIN) / TEXT_SCALE_STEP);
  const snapped = Number(
    (TEXT_SCALE_MIN + stepIndex * TEXT_SCALE_STEP).toFixed(2),
  );
  return Math.abs(value - snapped) <= TEXT_SCALE_EPSILON ? snapped : null;
};

export const isTextScale = (value) => snapTextScale(value) !== null;

export const normalizeTextScale = (value) =>
  snapTextScale(value) ?? DEFAULT_TEXT_SCALE;

export const parseStoredTextScale = (value) => {
  if (value === null || value.trim() === '') {
    return DEFAULT_TEXT_SCALE;
  }

  return normalizeTextScale(Number(value));
};

export const serializeTextScale = (value) => {
  const normalized = snapTextScale(value);
  if (normalized === null) {
    throw new TypeError('Text scale must be between 100% and 200% in 5% steps.');
  }
  return String(normalized);
};

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
