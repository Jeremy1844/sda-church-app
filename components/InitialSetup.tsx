import { PwaInstallDialog } from '@/components/PwaInstallDialog';
import { TEXT_SCALE_OPTIONS, isTextScale } from '@/constants/AppPreferences';
import {
  LanguageContext,
  SupportedLanguage,
} from '@/constants/LanguageContext';
import { usePwaInstall } from '@/constants/PwaInstallContext';
import { useTextSize } from '@/constants/TextSizeContext';
import { ThemeContext, useAppTheme } from '@/constants/Themes';
import { useContext, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Modal,
  Portal,
  SegmentedButtons,
  Text,
} from 'react-native-paper';

interface InitialSetupProps {
  onComplete: () => void;
}

export const InitialSetup = ({ onComplete }: InitialSetupProps) => {
  const { language, setLanguage } = useContext(LanguageContext);
  const { toggleTheme } = useContext(ThemeContext);
  const { status: installStatus } = usePwaInstall();
  const { setTextScale, textScale } = useTextSize();
  const theme = useAppTheme();
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const allLabels = {
    en: {
      title: "Welcome",
      sub: "Let's personalize your experience",
      lang: "Language",
      theme: "Appearance",
      dark: "Dark",
      light: "Light",
      start: "Get Started",
    },
    zh: {
      title: "歡迎",
      sub: "自定義您的體驗",
      lang: "語言設定",
      theme: "外觀模式",
      dark: "深色",
      light: "淺色",
      start: "開始使用",
    },
    "zh-cn": {
      title: "欢迎",
      sub: "自定义您的体验",
      lang: "语言设置",
      theme: "外观模式",
      dark: "深色",
      light: "浅色",
      start: "开始使用",
    },
    es: {
      title: "Bienvenido",
      sub: "Personalicemos tu experiencia",
      lang: "Idioma",
      theme: "Apariencia",
      dark: "Oscuro",
      light: "Claro",
      start: "Comenzar",
    },
  };

  const labels = allLabels[language as keyof typeof allLabels] || allLabels.en;
  const englishOnly = language !== 'en';
  const englishSuffix = englishOnly ? ' (English)' : '';
  const installLabel =
    installStatus === 'standalone' ? 'Installation status' : 'Install app';

  return (
    <>
      <Portal>
        <Modal
          visible={true}
          dismissable={false}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text variant="headlineMedium" style={styles.title}>
              {labels.title}
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {labels.sub}
            </Text>

            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.label}>
                {labels.lang}
              </Text>
              <SegmentedButtons
                value={language}
                onValueChange={(v) => setLanguage(v as SupportedLanguage)}
                buttons={[
                  { value: 'en', label: 'EN' },
                  { value: 'zh', label: '繁體' },
                  { value: 'zh-cn', label: '简体' },
                  { value: 'es', label: 'ES' },
                ]}
              />
            </View>

            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.label}>
                {labels.theme}
              </Text>
              <SegmentedButtons
                value={theme.dark ? 'dark' : 'light'}
                onValueChange={toggleTheme}
                buttons={[
                  { value: 'light', label: labels.light, icon: 'weather-sunny' },
                  { value: 'dark', label: labels.dark, icon: 'weather-night' },
                ]}
              />
            </View>

            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.label}>
                {`Text size${englishSuffix}`}
              </Text>
              {englishOnly && (
                <Text variant="labelSmall" style={styles.englishDisclosure}>
                  This new accessibility setting is currently described in English.
                </Text>
              )}
              <SegmentedButtons
                value={String(textScale)}
                onValueChange={(value) => {
                  const nextScale = Number(value);
                  if (isTextScale(nextScale)) {
                    void setTextScale(nextScale);
                  }
                }}
                buttons={TEXT_SCALE_OPTIONS.map((scale) => ({
                  accessibilityLabel: `${Math.round(scale * 100)} percent text size`,
                  label: `${Math.round(scale * 100)}%`,
                  value: String(scale),
                }))}
              />
            </View>

            {Platform.OS === 'web' && (
              <Button
                mode="outlined"
                icon="download"
                onPress={() => setShowInstallGuide(true)}
                style={styles.installButton}
                accessibilityLabel={`${installLabel} guide`}
              >
                {`${installLabel}${englishSuffix}`}
              </Button>
            )}

            <Button mode="contained" onPress={onComplete} style={styles.button}>
              {labels.start}
            </Button>
          </ScrollView>
        </Modal>
      </Portal>
      <PwaInstallDialog
        visible={showInstallGuide}
        onDismiss={() => setShowInstallGuide(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    borderRadius: 16,
    maxWidth: 500,
    maxHeight: '90%',
    overflow: 'hidden',
    alignSelf: "center",
    width: "90%",
  },
  modalContent: {
    padding: 24,
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 12,
    fontWeight: "600",
  },
  englishDisclosure: {
    marginBottom: 12,
    opacity: 0.75,
  },
  installButton: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
  },
});
