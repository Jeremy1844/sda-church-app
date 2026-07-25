import {
  DEFAULT_TEXT_SCALE,
  isTextScale,
  normalizeTextScale,
  scaleTypographyMetric,
  TEXT_SCALE_MAX,
  TEXT_SCALE_MIN,
  TEXT_SCALE_STEP,
  type TextScale,
} from '@/constants/AppPreferences';
import { LanguageContext } from '@/constants/LanguageContext';
import { useTextSize } from '@/constants/TextSizeContext';
import Slider from '@react-native-community/slider';
import { createElement, useContext, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text, useTheme } from 'react-native-paper';

interface TextSizeDialogProps {
  onDismiss: () => void;
  visible: boolean;
}

export const TextSizeDialog = ({ onDismiss, visible }: TextSizeDialogProps) => {
  const { language } = useContext(LanguageContext);
  const { setTextScale, textScale } = useTextSize();
  const theme = useTheme();
  const englishOnly = language !== 'en';
  const [draftScale, setDraftScale] = useState<TextScale>(textScale);
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setDraftScale(textScale);
      setApplyError(null);
    }
  }, [textScale, visible]);

  const dismissWithoutApplying = () => {
    setDraftScale(textScale);
    setApplyError(null);
    onDismiss();
  };

  const handleSliderChange = (value: number) => {
    if (isTextScale(value)) {
      setApplyError(null);
      setDraftScale(normalizeTextScale(value));
    }
  };

  const applyDraft = async () => {
    if (isApplying || !isTextScale(draftScale)) return;
    setIsApplying(true);
    setApplyError(null);
    try {
      await setTextScale(draftScale);
      onDismiss();
    } catch {
      setApplyError('Text size could not be saved. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  const currentPercent = Math.round(draftScale * 100);
  const handleWebSliderKeyDown = (event: {
    key: string;
    preventDefault: () => void;
  }) => {
    const stepPercent = TEXT_SCALE_STEP * 100;
    let nextPercent: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        nextPercent = Math.min(TEXT_SCALE_MAX * 100, currentPercent + stepPercent);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        nextPercent = Math.max(TEXT_SCALE_MIN * 100, currentPercent - stepPercent);
        break;
      case 'Home':
        nextPercent = TEXT_SCALE_MIN * 100;
        break;
      case 'End':
        nextPercent = TEXT_SCALE_MAX * 100;
        break;
      default:
        return;
    }

    event.preventDefault();
    handleSliderChange(nextPercent / 100);
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={() => {
          if (!isApplying) dismissWithoutApplying();
        }}
        dismissable={!isApplying}
        dismissableBackButton={!isApplying}
        style={styles.dialog}
      >
        <Dialog.Title>{`Text size${englishOnly ? ' (English)' : ''}`}</Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
          >
            {englishOnly && (
              <Text variant="labelMedium">
                This accessibility setting is currently described in English.
              </Text>
            )}
            <Text variant="bodyMedium" style={{ marginTop: englishOnly ? 12 : 0 }}>
              Adjust persistent app text from 100% to 200% in 5% steps.
            </Text>

            <Text
              variant="titleMedium"
              accessibilityLiveRegion="polite"
              style={styles.currentValue}
            >
              {`Current selection: ${currentPercent}%`}
            </Text>

            {Platform.OS === 'web'
              ? createElement('input', {
                  'aria-label': 'Text size',
                  'aria-valuemax': TEXT_SCALE_MAX * 100,
                  'aria-valuemin': TEXT_SCALE_MIN * 100,
                  'aria-valuenow': currentPercent,
                  'aria-valuetext': `${currentPercent} percent`,
                  disabled: isApplying,
                  max: TEXT_SCALE_MAX * 100,
                  min: TEXT_SCALE_MIN * 100,
                  onKeyDown: handleWebSliderKeyDown,
                  onInput: (event: { currentTarget: { value: string } }) =>
                    handleSliderChange(Number(event.currentTarget.value) / 100),
                  step: TEXT_SCALE_STEP * 100,
                  style: {
                    accentColor: theme.colors.primary,
                    cursor: isApplying ? 'default' : 'pointer',
                    height: 44,
                    width: '100%',
                  },
                  type: 'range',
                  value: currentPercent,
                })
              : (
                  <Slider
                    accessibilityHint="Swipe up or down to adjust text in five percent steps."
                    accessibilityLabel="Text size"
                    accessibilityRole="adjustable"
                    accessibilityValue={{
                      min: TEXT_SCALE_MIN * 100,
                      max: TEXT_SCALE_MAX * 100,
                      now: currentPercent,
                      text: `${currentPercent} percent`,
                    }}
                    disabled={isApplying}
                    maximumTrackTintColor={theme.colors.surfaceVariant}
                    maximumValue={TEXT_SCALE_MAX}
                    minimumTrackTintColor={theme.colors.primary}
                    minimumValue={TEXT_SCALE_MIN}
                    onValueChange={handleSliderChange}
                    step={TEXT_SCALE_STEP}
                    style={styles.slider}
                    thumbTintColor={theme.colors.primary}
                    value={draftScale}
                  />
                )}

            <View style={styles.rangeLabels} accessible={false}>
              <Text variant="labelMedium">100%</Text>
              <Text variant="labelMedium">{`${currentPercent}%`}</Text>
              <Text variant="labelMedium">200%</Text>
            </View>

            <View
              accessibilityLabel={`Text size preview at ${currentPercent} percent`}
              style={[
                styles.preview,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <Text variant="labelMedium" style={styles.previewLabel}>
                Live preview
              </Text>
              <Text
                style={{
                  color: theme.colors.onSurface,
                  fontFamily: 'NotoSans-Regular',
                  fontSize: scaleTypographyMetric(16, draftScale),
                  lineHeight: scaleTypographyMetric(24, draftScale),
                }}
              >
                Welcome to NY Chinese SDA.
              </Text>
            </View>
            {applyError && (
              <Text
                accessibilityLiveRegion="assertive"
                role="alert"
                style={[styles.errorText, { color: theme.colors.error }]}
                variant="bodyMedium"
              >
                {applyError}
              </Text>
            )}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions style={styles.actions}>
          <Button onPress={dismissWithoutApplying} disabled={isApplying}>
            Close
          </Button>
          <Button
            onPress={() => {
              setApplyError(null);
              setDraftScale(DEFAULT_TEXT_SCALE);
            }}
            disabled={isApplying || draftScale === DEFAULT_TEXT_SCALE}
          >
            Reset to 100%
          </Button>
          <Button
            mode="contained"
            onPress={() => void applyDraft()}
            disabled={isApplying || draftScale === textScale}
            loading={isApplying}
          >
            Apply
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  actions: {
    flexWrap: 'wrap',
  },
  currentValue: {
    marginTop: 20,
    textAlign: 'center',
  },
  dialog: {
    alignSelf: 'center',
    width: '90%',
    maxWidth: 560,
    maxHeight: '90%',
  },
  errorText: {
    marginTop: 12,
  },
  preview: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
    padding: 16,
  },
  previewLabel: {
    marginBottom: 8,
    opacity: 0.75,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  scrollArea: {
    paddingHorizontal: 0,
  },
  slider: {
    height: 44,
    marginTop: 8,
    width: '100%',
  },
});
