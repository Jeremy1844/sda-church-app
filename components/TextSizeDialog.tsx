import { TEXT_SCALE_OPTIONS, isTextScale } from '@/constants/AppPreferences';
import { LanguageContext } from '@/constants/LanguageContext';
import { useTextSize } from '@/constants/TextSizeContext';
import { useContext } from 'react';
import { Button, Dialog, Portal, SegmentedButtons, Text } from 'react-native-paper';

interface TextSizeDialogProps {
  onDismiss: () => void;
  visible: boolean;
}

export const TextSizeDialog = ({ onDismiss, visible }: TextSizeDialogProps) => {
  const { language } = useContext(LanguageContext);
  const { setTextScale, textScale } = useTextSize();
  const englishOnly = language !== 'en';

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{`Text size${englishOnly ? ' (English)' : ''}`}</Dialog.Title>
        <Dialog.Content>
          {englishOnly && (
            <Text variant="labelMedium">
              This new accessibility setting is currently described in English.
            </Text>
          )}
          <Text variant="bodyMedium" style={{ marginTop: englishOnly ? 12 : 0 }}>
            Choose a persistent text size for the app.
          </Text>
          <SegmentedButtons
            value={String(textScale)}
            onValueChange={(value) => {
              const nextScale = Number(value);
              if (isTextScale(nextScale)) {
                void setTextScale(nextScale);
              }
            }}
            style={{ marginTop: 16 }}
            buttons={TEXT_SCALE_OPTIONS.map((scale) => ({
              accessibilityLabel: `${Math.round(scale * 100)} percent text size`,
              label: `${Math.round(scale * 100)}%`,
              value: String(scale),
            }))}
          />
          <Text variant="bodyMedium" style={{ marginTop: 16 }}>
            Preview: Welcome to NY Chinese SDA.
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Close</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};
