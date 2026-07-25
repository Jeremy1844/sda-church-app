import {
  DEFAULT_TEXT_SCALE,
  scaleTypographyMetric,
  type TextScale,
} from '@/constants/AppPreferences';
import { getBottomTabContentHeight } from '@/constants/Layout';
import { StyleSheet } from 'react-native';

export const NAVIGATION_CONTENT_MAX_WIDTH = 960;

type NavigationStyleOptions = Readonly<{
  bottomInset?: number;
  fontScale?: number;
}>;

/**
 * Shared styles for Menu/Navigation-heavy screens.
 * Preference given to the layout logic defined in ResourcesScreen.
 */
export const createNavigationStyles = (
  textScale: TextScale,
  options: NavigationStyleOptions = {},
) => {
  const bottomInset = Number.isFinite(options.bottomInset)
    ? Math.max(0, options.bottomInset ?? 0)
    : 0;
  const fontScale = Number.isFinite(options.fontScale)
    ? Math.max(1, options.fontScale ?? 1)
    : 1;
  const bottomTabHeight = getBottomTabContentHeight(fontScale * textScale);

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: NAVIGATION_CONTENT_MAX_WIDTH,
      padding: 20, // Preference: resources.tsx
      paddingBottom: bottomTabHeight + bottomInset + 24,
    },
    subheader: {
      fontWeight: 'bold',
      fontSize: scaleTypographyMetric(16, textScale), // Preference: resources.tsx
      lineHeight: scaleTypographyMetric(22, textScale),
    },
  });
};

export const NavigationStyles = createNavigationStyles(DEFAULT_TEXT_SCALE);
