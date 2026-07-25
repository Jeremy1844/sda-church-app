import { usePwaInstall } from '@/constants/PwaInstallContext';
import { LanguageContext } from '@/constants/LanguageContext';
import { resolvePwaInstallGuidance } from '@/services/PwaInstallGuidance';
import { useState, useContext } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

interface PwaInstallDialogProps {
  onDismiss: () => void;
  visible: boolean;
}

const statusCopy = {
  accepted:
    'The browser accepted the request. Follow any remaining browser or system steps. This app does not track installation completion.',
  dismissed:
    'The browser install request was dismissed. You can close this guide and try again later if the browser offers a new install request.',
  'not-applicable': 'Installation guidance is available only in the web app.',
  'prompt-available':
    'Your browser has made an install request available. Installation is handled by the browser and operating system.',
  standalone: 'This app is already running in standalone mode. No install action is needed.',
  unavailable:
    'This browser did not expose an in-app install prompt. Open its menu or share controls and use an install or home-screen option if one is offered. Availability and wording vary by browser and device.',
} as const;

export const PwaInstallDialog = ({ onDismiss, visible }: PwaInstallDialogProps) => {
  const { language } = useContext(LanguageContext);
  const { requestInstall, status } = usePwaInstall();
  const [requesting, setRequesting] = useState(false);
  const englishOnly = language !== 'en';
  const manualGuidance = resolvePwaInstallGuidance(
    typeof navigator === 'undefined' ? '' : navigator.userAgent,
  );

  const handleInstall = async () => {
    setRequesting(true);
    try {
      await requestInstall();
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>{`Install app${englishOnly ? ' (English)' : ''}`}</Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            automaticallyAdjustKeyboardInsets
          >
            {englishOnly && (
              <Text variant="labelMedium" accessibilityRole="text">
                This new guidance is currently available in English.
              </Text>
            )}
            <Text variant="bodyMedium" style={{ marginTop: englishOnly ? 12 : 0 }}>
              {statusCopy[status]}
            </Text>
            {(status === 'dismissed' || status === 'accepted') && (
              <Text variant="bodyMedium" style={{ marginTop: 12 }}>
                You can also open the browser menu or share controls and use an install or
                home-screen option if one is offered.
              </Text>
            )}
            {status !== 'not-applicable' && status !== 'standalone' && (
              <>
                <Text variant="titleSmall" style={{ marginTop: 16 }}>
                  {`Manual steps for ${manualGuidance.platform}`}
                </Text>
                {manualGuidance.steps.map((step, index) => (
                  <Text key={step} variant="bodyMedium" style={{ marginTop: 8 }}>
                    {`${index + 1}. ${step}`}
                  </Text>
                ))}
              </>
            )}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Close</Button>
          {status === 'prompt-available' && (
            <Button
              mode="contained"
              loading={requesting}
              disabled={requesting}
              onPress={handleInstall}
              accessibilityLabel="Ask browser to install app"
            >
              Install
            </Button>
          )}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    alignSelf: 'center',
    width: '90%',
    maxWidth: 560,
    maxHeight: '90%',
  },
  scrollArea: {
    paddingHorizontal: 0,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
});
