import {
  DEFAULT_TEXT_SCALE,
  scaleTypographyMetric,
  type TextScale,
} from '@/constants/AppPreferences';
import { StyleSheet } from "react-native";

/**
 * Shared styles for Menu/Navigation-heavy screens.
 * Preference given to the layout logic defined in ResourcesScreen.
 */
export const createNavigationStyles = (textScale: TextScale) => StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20, // Preference: resources.tsx
    paddingBottom: 80, // Tab bar gutter
  },
  subheader: {
    fontWeight: "bold",
    fontSize: scaleTypographyMetric(16, textScale), // Preference: resources.tsx
    lineHeight: scaleTypographyMetric(22, textScale),
  },
});

export const NavigationStyles = createNavigationStyles(DEFAULT_TEXT_SCALE);
