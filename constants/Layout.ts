/**
 * Centralized layout constants to ensure consistency across the "Digital Sanctuary".
 * Based on UI_UX.md standards.
 */

export const DESIGN_TOKENS = {
  // Material 3 Appbar height is 64dp (Small/Center-aligned variant).
  // Ref: https://m3.material.io/components/top-app-bar/specs
  // Note: While iOS HIG traditionally uses 44pt for navigation bars, react-native-paper
  // implements MD3 standards (64dp) across both platforms for layout consistency.
  HEADER_HEIGHT_BASE: 64,
  // Used for the "Glass Rule" 0.5px borders
  BORDER_WEIGHT: 0.5,
  // Standard gutter for containers and card spacing
  VIEW_PADDING: 16,
  /**
   * Icon sizes following Material Design 3 specifications.
   * Ref: https://m3.material.io/styles/icons/applying-icons#694df220-3129-4556-9e67-ed3f58a361f1
   */
  ICON_SIZE_STANDARD: 24,
  ICON_SIZE_FEATURED: 32,
  // Specific project standard for bottom tab bar visibility
  ICON_SIZE_TAB: 28,
  // Bottom-tab labels need explicit metrics because the bundled Noto Sans files do not
  // contain CJK glyphs and platform fallback fonts have different vertical bounds.
  BOTTOM_TAB_LABEL_LINE_HEIGHT: 16,
  BOTTOM_TAB_LABEL_BOTTOM_PADDING: 2,
  // 28px icon + 16px label + 2px label padding + 10px navigation-item padding.
  BOTTOM_TAB_CONTENT_HEIGHT: 56,
  // Dimension for timeline markers in the History section
  TIMELINE_CIRCLE_SIZE: 50,
};

/**
 * Keeps the bottom-tab touch target large enough when the OS enlarges label text.
 * Safe-area padding is added by the tab layout, outside this content height.
 */
export const getBottomTabContentHeight = (fontScale: number) => {
  const safeFontScale = Number.isFinite(fontScale) ? Math.max(fontScale, 1) : 1;
  const scaledLabelGrowth =
    DESIGN_TOKENS.BOTTOM_TAB_LABEL_LINE_HEIGHT * (safeFontScale - 1);

  return Math.ceil(DESIGN_TOKENS.BOTTOM_TAB_CONTENT_HEIGHT + scaledLabelGrowth);
};
