import { scaleTypographyMetric } from '@/constants/AppPreferences';
import { useTextSize } from '@/constants/TextSizeContext';
import { useAppTheme } from '@/constants/Themes';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

interface GridMenuCardProps {
  title: string;
  subtitle?: string;
  /** MaterialCommunityIcons glyph for the decorative illustration area */
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  /** Pastel background color for the card */
  color: string;
  /** Icon tint — defaults to a semi-transparent dark of the card color */
  iconColor?: string;
  onPress?: () => void;
  style?: ViewStyle | any;
}

export const GridMenuCard: React.FC<GridMenuCardProps> = ({
  title,
  subtitle,
  icon,
  color,
  iconColor,
  onPress,
  style,
}) => {
  const theme = useAppTheme();
  const { textScale } = useTextSize();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const disabled = !onPress;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  // Derive a slightly darker icon color from the card color for the illustration
  const resolvedIconColor = iconColor ?? 'rgba(40, 40, 40, 0.18)';
  // Compute a slightly more opaque version for the stroke (approx 80% opacity)
  const strokeColor = iconColor ? iconColor.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, 'rgba($1,$2,$3,0.5)') : 'rgba(40, 40, 40, 0.3)';

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: color, borderWidth: 1, borderColor: theme.colors.outlineVariant }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        activeOpacity={1}
      >
        {/* Title block — top left */}
        <View style={styles.titleBlock}>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.onSurface,
                fontSize: scaleTypographyMetric(15, textScale),
                lineHeight: scaleTypographyMetric(20, textScale),
              },
            ]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.colors.onSurfaceVariant,
                  fontSize: scaleTypographyMetric(12, textScale),
                  lineHeight: scaleTypographyMetric(17, textScale),
                },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Illustration + arrow row — bottom */}
        <View style={styles.bottomRow}>
          <View style={styles.decorIconContainer}>
            <MaterialCommunityIcons
              name={icon}
              size={68}
              color={resolvedIconColor}
              style={styles.decorIcon}
            />
          </View>
          {!disabled && (
            <View style={styles.arrowBadge}>
              <MaterialCommunityIcons
                name="arrow-top-right"
                size={14}
                color="#374151"
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151', // crisp dark border
    padding: 18,
    minHeight: 148,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  titleBlock: {
    flex: 0,
  },
  title: {
    fontWeight: '700',
    maxWidth: '90%',
  },
  subtitle: {
    marginTop: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  decorIcon: {
    // Offset slightly so it bleeds toward the edge for a richer look
    marginLeft: -6,
    marginBottom: -6,
  },
  decorIconContainer: {
    position: 'relative',
  },
  decorIconBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  arrowBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF', // solid white
    borderWidth: 1,
    borderColor: '#374151', // crisp dark border
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
});
