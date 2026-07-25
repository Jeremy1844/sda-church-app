import { DESIGN_TOKENS } from '@/constants/Layout';
import { scaleTypographyMetric } from '@/constants/AppPreferences';
import { useTextSize } from '@/constants/TextSizeContext';
import { useAppTheme } from '@/constants/Themes';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  AccessibilityRole,
  AccessibilityState,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

interface MenuCardProps {
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  title: string;
  description?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
  onPress?: () => void;
  rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap | null;
  rightElement?: () => React.ReactNode;
  style?: ViewStyle | any;
}

export const MenuCard: React.FC<MenuCardProps> = ({
  accessibilityRole = 'button',
  accessibilityState,
  title,
  description,
  icon,
  iconColor,
  onPress,
  rightIcon = "chevron-right",
  rightElement,
  style,
}) => {
  const theme = useAppTheme();
  const { textScale } = useTextSize();
  const resolvedRightIcon = onPress ? rightIcon : null;
  const cursorStyle =
    Platform.OS === 'web'
      ? ({ cursor: onPress ? 'pointer' : 'default' } as ViewStyle)
      : undefined;
  return (
    <AnimatedTouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
        cursorStyle,
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ ...accessibilityState, disabled: !onPress }}
    >
      <MaterialCommunityIcons
        pointerEvents="none"
        name={icon}
        size={DESIGN_TOKENS.ICON_SIZE_FEATURED}
        color={iconColor || theme.colors.tertiary}
      />
      <View pointerEvents="none" style={styles.cardContent}>
        <Text
          style={[
            styles.cardTitle,
            {
              color: theme.colors.onSurface,
              fontSize: scaleTypographyMetric(18, textScale),
              lineHeight: scaleTypographyMetric(24, textScale),
            },
          ]}
        >
          {title}
        </Text>
        {description && (
          <Text
            style={[
              styles.cardSubtitle,
              {
                color: theme.colors.onSurfaceVariant,
                fontSize: scaleTypographyMetric(14, textScale),
                lineHeight: scaleTypographyMetric(20, textScale),
              },
            ]}
          >
            {description}
          </Text>
        )}
      </View>
      {rightElement
        ? (
            <View
              pointerEvents="none"
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {rightElement()}
            </View>
          )
        : resolvedRightIcon && (
            <MaterialCommunityIcons
              pointerEvents="none"
              name={resolvedRightIcon}
              size={DESIGN_TOKENS.ICON_SIZE_STANDARD}
              color={theme.colors.onSurfaceVariant}
            />
          )}
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardContent: { flex: 1, marginLeft: 16 },
  cardTitle: { fontWeight: '700' },
  cardSubtitle: { marginTop: 2 },
});
