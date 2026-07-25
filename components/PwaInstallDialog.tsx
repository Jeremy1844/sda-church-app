import { usePwaInstall } from '@/constants/PwaInstallContext';
import { LanguageContext } from '@/constants/LanguageContext';
import { useState, useContext } from 'react';
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
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{`Install app${englishOnly ? ' (English)' : ''}`}</Dialog.Title>
        <Dialog.Content>
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
        </Dialog.Content>
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
