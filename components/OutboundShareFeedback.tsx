import type { SupportedLanguage } from '@/constants/LanguageContext';
import { useAppTheme } from '@/constants/Themes';
import { shareOutboundText } from '@/services/OutboundSharePolicy';
import type {
  OutboundShareOutcome,
  OutboundSharePayload,
} from '@/services/OutboundSharePolicy';
import { useCallback, useState } from 'react';
import { Platform, ScrollView, Share, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Snackbar, Text } from 'react-native-paper';

const ENGLISH_FALLBACK_COPY = Object.freeze({
  englishOnlyNotice: 'Share fallback instructions (English only)',
  englishOnlyStatus: 'Share status (English only).',
  shared: 'Share action completed.',
  copied: 'Copied to clipboard.',
  manualTitle: 'Copy this text',
  manualInstructions:
    'Automatic sharing and clipboard copying are unavailable. Select and copy the text below.',
  manualTextLabel: 'Text to copy manually',
  dismiss: 'Dismiss',
  close: 'Close',
});

type FeedbackState = Readonly<{
  outcome: OutboundShareOutcome;
  manualText: string | null;
}>;

export function useOutboundShare() {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const share = useCallback(async (payload: OutboundSharePayload) => {
    // This callback is called directly by an onPress handler so Web Share and Clipboard
    // remain inside a user-initiated interaction.
    setFeedback(null);
    const outcome = await shareOutboundText(
      payload,
      Platform.OS === 'web' ? 'web' : 'native',
      async (nativePayload) => {
        const result = await Share.share({
          title: nativePayload.title,
          message: nativePayload.text,
        });
        return result.action === Share.dismissedAction ? 'cancelled' : 'shared';
      },
    );

    if (outcome.kind !== 'cancelled') {
      setFeedback({
        outcome,
        manualText: outcome.kind === 'manual-copy' ? payload.text : null,
      });
    }
    return outcome;
  }, []);

  const dismissFeedback = useCallback(() => setFeedback(null), []);

  return Object.freeze({ feedback, share, dismissFeedback });
}

type OutboundShareFeedbackProps = Readonly<{
  feedback: FeedbackState | null;
  language: SupportedLanguage;
  onDismiss: () => void;
}>;

export function OutboundShareFeedback({
  feedback,
  language,
  onDismiss,
}: OutboundShareFeedbackProps) {
  const theme = useAppTheme();
  const isManual = feedback?.outcome.kind === 'manual-copy';
  const status =
    feedback?.outcome.kind === 'shared'
      ? ENGLISH_FALLBACK_COPY.shared
      : feedback?.outcome.kind === 'copied'
        ? ENGLISH_FALLBACK_COPY.copied
        : '';

  return (
    <Portal>
      <Dialog visible={isManual} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>{ENGLISH_FALLBACK_COPY.manualTitle}</Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            automaticallyAdjustKeyboardInsets
          >
            {language !== 'en' && (
              <Text variant="labelMedium" style={styles.englishOnlyNotice}>
                {ENGLISH_FALLBACK_COPY.englishOnlyNotice}
              </Text>
            )}
            <Text accessibilityLiveRegion="polite" variant="bodyMedium">
              {ENGLISH_FALLBACK_COPY.manualInstructions}
            </Text>
            <View
              style={[
                styles.manualTextContainer,
                { borderColor: theme.colors.outlineVariant },
              ]}
            >
              <Text
                selectable
                accessibilityLabel={ENGLISH_FALLBACK_COPY.manualTextLabel}
                variant="bodyMedium"
              >
                {feedback?.manualText}
              </Text>
            </View>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{ENGLISH_FALLBACK_COPY.close}</Button>
        </Dialog.Actions>
      </Dialog>
      <Snackbar
        visible={Boolean(status)}
        duration={4000}
        onDismiss={onDismiss}
        accessibilityLiveRegion="polite"
        action={{ label: ENGLISH_FALLBACK_COPY.dismiss, onPress: onDismiss }}
      >
        {language !== 'en'
          ? `${status} ${ENGLISH_FALLBACK_COPY.englishOnlyStatus}`
          : status}
      </Snackbar>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    alignSelf: 'center',
    width: '90%',
    maxWidth: 640,
    maxHeight: '90%',
  },
  scrollArea: {
    paddingHorizontal: 0,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  englishOnlyNotice: {
    fontWeight: '700',
    marginBottom: 8,
  },
  manualTextContainer: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    marginTop: 16,
    padding: 12,
  },
});
